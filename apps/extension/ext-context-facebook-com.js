/**
 * Context cho Messenger trên www.facebook.com / web.facebook.com
 * URL: /messages/t/{threadId} hoặc /messages/e2ee/t/{threadId}
 */
(function () {
  "use strict";

  const SOURCES = window.ANHUNGLAND_SOURCES || {
    MESSENGER_STANDARD: "messenger_standard",
    MESSENGER_E2EE: "messenger_e2ee",
    UNKNOWN: "unknown",
  };

  const HEADER_TOP_MIN = 40;
  const HEADER_TOP_MAX = 120;
  const CHAT_HEADER_LEFT_MIN = 320;
  const CHAT_HEADER_LEFT_MAX_RATIO = 0.72;
  const RIGHT_PANEL_MIN_X_RATIO = 0.68;
  const LEFT_LIST_MAX_X_RATIO = 0.42;
  const MIN_E2EE_UID_SCORE = 28;
  const GLOBAL_ID_FREQ_CAP = 14;
  const MESSENGER_E2EE_MSG_ID_RE = /^\d+@msgr\./i;

  function parseE2eeCustomerUidFromMessageId(messageId) {
    const id = String(messageId || "").trim();
    if (!MESSENGER_E2EE_MSG_ID_RE.test(id)) return "";
    const match = /^(\d{5,})@msgr\./i.exec(id);
    return match?.[1] || "";
  }

  function countE2eeCustomerUidsFromMessageIds(messageIds, exclude) {
    const counts = new Map();
    for (const raw of messageIds || []) {
      const uid = parseE2eeCustomerUidFromMessageId(raw);
      if (!uid || exclude?.has(uid)) continue;
      counts.set(uid, (counts.get(uid) || 0) + 1);
    }
    return counts;
  }

  function pickDominantUidFromCounts(counts) {
    let best = "";
    let bestCount = 0;
    for (const [uid, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        best = uid;
      }
    }
    return best;
  }

  function collectE2eeUidsFromDomMessageIds(exclude) {
    const counts = new Map();
    const scopes = document.querySelectorAll('[data-scope="messages_table"]');
    const nodes = scopes.length
      ? [...scopes].flatMap((root) => [...root.querySelectorAll("[data-message-id]")])
      : [...document.querySelectorAll("[data-message-id]")];

    nodes.forEach((node) => {
      const uid = parseE2eeCustomerUidFromMessageId(node.getAttribute("data-message-id"));
      if (!uid || exclude.has(uid)) return;
      counts.set(uid, (counts.get(uid) || 0) + 1);
    });
    return counts;
  }

  function resolveE2eeCustomerUidFromMessageIds(messageIds, excludeIds) {
    const exclude = excludeIds instanceof Set
      ? excludeIds
      : new Set((excludeIds || []).filter(Boolean));
    return pickDominantUidFromCounts(countE2eeCustomerUidsFromMessageIds(messageIds, exclude));
  }

  function getLocationParts() {
    try {
      const url = new URL(window.location.href);
      return { pathname: url.pathname, href: url.href };
    } catch (_e) {
      return {
        pathname: window.location.pathname || "",
        href: window.location.href || "",
      };
    }
  }

  function detectSource() {
    if (typeof window.detectAnhunglandSource === "function") {
      return window.detectAnhunglandSource(window.location);
    }
    const { pathname } = getLocationParts();
    if (/\/messages\/e2ee\/t\/[^/]+/i.test(pathname)) {
      return SOURCES.MESSENGER_E2EE;
    }
    if (/\/messages\/t\/[^/]+/i.test(pathname)) {
      return SOURCES.MESSENGER_STANDARD;
    }
    return SOURCES.UNKNOWN;
  }

  function resolveThreadId() {
    const { pathname } = getLocationParts();
    const e2ee = pathname.match(/\/messages\/e2ee\/t\/([^/?#]+)/i);
    if (e2ee?.[1]) return String(e2ee[1]).trim();
    const standard = pathname.match(/\/messages\/t\/([^/?#]+)/i);
    if (standard?.[1]) return String(standard[1]).trim();
    return "";
  }

  function pickNumericId(value) {
    const id = String(value || "").trim();
    return /^\d{5,}$/.test(id) ? id : "";
  }

  function isInChatHeaderBand(node) {
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    const minLeft = Math.min(CHAT_HEADER_LEFT_MIN, window.innerWidth * 0.24);
    const maxLeft = window.innerWidth * CHAT_HEADER_LEFT_MAX_RATIO;
    return (
      rect.top >= HEADER_TOP_MIN &&
      rect.top <= HEADER_TOP_MAX &&
      rect.left >= minLeft &&
      rect.left <= maxLeft &&
      rect.width > 20
    );
  }

  function isInRightSidebar(node) {
    if (!(node instanceof Element)) return false;
    return node.getBoundingClientRect().left >= window.innerWidth * RIGHT_PANEL_MIN_X_RATIO;
  }

  function isInLeftThreadList(node) {
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    return (
      rect.left < window.innerWidth * LEFT_LIST_MAX_X_RATIO &&
      rect.top > 80 &&
      rect.width > 40 &&
      rect.height > 20
    );
  }

  function countIdOccurrencesInHtml(html, id) {
    if (!html || !id) return 0;
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (html.match(new RegExp(escaped, "g")) || []).length;
  }

  function htmlSnippetsNearThread(html, threadId, radius = 1800) {
    if (!html || !threadId) return [];
    const snippets = [];
    const needles = [
      threadId,
      `/messages/e2ee/t/${threadId}`,
      `/messages/t/${threadId}`,
    ];
    for (const needle of needles) {
      let from = 0;
      while (snippets.length < 12) {
        const pos = html.indexOf(needle, from);
        if (pos === -1) break;
        snippets.push(html.slice(Math.max(0, pos - 280), pos + radius));
        from = pos + needle.length;
      }
    }
    return snippets;
  }

  function hrefMatchesThreadId(href, threadId) {
    const h = String(href || "");
    const id = String(threadId || "").trim();
    if (!h || !id) return false;
    return (
      h.includes(`/messages/e2ee/t/${id}`) ||
      h.includes(`/messages/t/${id}`) ||
      h.includes(`/t/${id}`)
    );
  }

  function findThreadLinksById(threadId) {
    if (!threadId) return [];
    const links = [];
    document.querySelectorAll('a[href*="/messages/"]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!hrefMatchesThreadId(link.getAttribute("href") || "", threadId)) return;
      links.push(link);
    });
    return links;
  }

  function climbToThreadRow(node) {
    let current = node instanceof Element ? node : null;
    for (let depth = 0; depth < 14 && current; depth += 1) {
      if (!(current instanceof HTMLElement)) break;
      if (current.getAttribute("role") === "row") return current;
      const rect = current.getBoundingClientRect();
      if (
        rect.height >= 48 &&
        rect.width >= 100 &&
        (current.querySelector('img[src*="fbcdn"]') ||
          current.querySelector('span[dir="auto"]'))
      ) {
        return current;
      }
      current = current.parentElement;
    }
    const closest = node?.closest?.('[role="row"]');
    return closest instanceof HTMLElement ? closest : null;
  }

  function collectIdsFromElement(el) {
    const ids = [];
    if (!(el instanceof Element)) return ids;

    const hover = String(el.getAttribute("data-hovercard") || "");
    const hoverMatch = hover.match(/(?:[?&]id=|user\.php\/)(\d{5,})/i);
    if (hoverMatch?.[1]) ids.push(pickNumericId(hoverMatch[1]));

    [
      "data-profileid",
      "data-profile-id",
      "data-ownerid",
      "data-owner-id",
      "data-userid",
      "data-user-id",
    ].forEach((attr) => {
      const value = pickNumericId(el.getAttribute(attr));
      if (value) ids.push(value);
    });

    return ids.filter(Boolean);
  }

  function collectIdsFromHref(href) {
    const ids = [];
    const h = String(href || "");
    if (!h) return ids;

    const profileMatch = h.match(/profile\.php\?[^#]*\bid=(\d{5,})/i);
    if (profileMatch?.[1]) ids.push(profileMatch[1]);

    const pathMatch = h.match(/facebook\.com\/(\d{5,})(?:[/?#]|$)/i);
    if (pathMatch?.[1]) ids.push(pathMatch[1]);

    return ids.map(pickNumericId).filter(Boolean);
  }

  function bumpIdScore(scores, id, weight) {
    if (!id) return;
    scores.set(id, (scores.get(id) || 0) + weight);
  }

  function pickBestUid(scores) {
    let best = "";
    let bestScore = 0;
    for (const [id, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    }
    if (!best || bestScore < MIN_E2EE_UID_SCORE) {
      return { uid: "", score: 0, source: "" };
    }
    return { uid: best, score: bestScore, source: "" };
  }

  /**
   * Facebook nhúng map OTID/JID ↔ thread E2EE trong payload Lightspeed sync (script JSON).
   * Ví dụ DOM LIVE: updateThreadAuthorityAndMappingWithOTIDFromJID",[19,"100027742188762"],[19,"1430292848506081"]
   */
  function extractUidFromLightspeedThreadMapping(html, threadId, viewerUid) {
    const tid = String(threadId || "").trim();
    if (!tid || !html) return "";

    const exclude = new Set([tid, String(viewerUid || "").trim()].filter(Boolean));
    const esc = tid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `updateThreadAuthorityAndMappingWithOTIDFromJID\\\\",\\[19,\\\\"(\\d+)\\\\"\\],\\[19,\\\\"${esc}\\\\"\\]`,
        "gi",
      ),
      new RegExp(
        `updateThreadAuthorityAndMappingWithOTIDFromJID",\\[19,"(\\d+)"\\],\\[19,"${esc}"\\]`,
        "gi",
      ),
    ];

    const found = [];
    for (const re of patterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(html))) {
        const id = pickNumericId(match[1]);
        if (id && !exclude.has(id)) found.push(id);
      }
    }
    return found.length ? found[found.length - 1] : "";
  }

  function extractE2eeCustomerFacebookUidWithMeta(threadId, viewerUid) {
    const exclude = new Set(
      [String(viewerUid || "").trim(), String(threadId || "").trim()].filter(Boolean),
    );
    const scores = new Map();
    const sources = new Map();
    const html = document.documentElement?.innerHTML || "";

    const lsUid = extractUidFromLightspeedThreadMapping(html, threadId, viewerUid);
    if (lsUid) {
      bumpIdScore(scores, lsUid, 100);
      sources.set(lsUid, "lightspeed-otid-mapping");
    }

    const note = (id, source) => {
      if (!id || !source) return;
      if (!sources.has(id)) sources.set(id, source);
    };

    const considerTrusted = (id, weight, source) => {
      if (!id || exclude.has(id)) return;
      bumpIdScore(scores, id, weight);
      note(id, source);
    };

    const considerGlobal = (id, weight, source) => {
      if (!id || exclude.has(id)) return;
      if (countIdOccurrencesInHtml(html, id) > GLOBAL_ID_FREQ_CAP) return;
      bumpIdScore(scores, id, weight);
      note(id, source);
    };

    findThreadLinksById(threadId).forEach((link) => {
      const row = climbToThreadRow(link);
      if (!(row instanceof HTMLElement)) return;
      row.querySelectorAll('a[href*="facebook.com"]').forEach((anchor) => {
        if (!(anchor instanceof HTMLAnchorElement)) return;
        collectIdsFromHref(anchor.href).forEach((id) =>
          considerTrusted(id, 95, "thread-list-row"),
        );
        collectIdsFromElement(anchor).forEach((id) =>
          considerTrusted(id, 92, "thread-list-hovercard"),
        );
      });
      row.querySelectorAll("[data-hovercard], [data-profileid], [data-profile-id]").forEach(
        (el) => {
          collectIdsFromElement(el).forEach((id) =>
            considerTrusted(id, 90, "thread-list-attrs"),
          );
        },
      );
    });

    document.querySelectorAll('a[href*="facebook.com"]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const inHeader = isInChatHeaderBand(link);
      const inSidebar = isInRightSidebar(link);
      if (!inHeader && !inSidebar) return;
      const source = inSidebar ? "contact-sidebar" : "chat-header";
      const weight = inSidebar ? 72 : 78;
      collectIdsFromHref(link.href).forEach((id) => considerGlobal(id, weight, source));
      collectIdsFromElement(link).forEach((id) => considerGlobal(id, weight - 5, source));
    });

    const nearThreadPatterns = [
      /"participant_fbid":"(\d{5,})"/gi,
      /"other_user_id":"(\d{5,})"/gi,
      /"contact_id":"(\d{5,})"/gi,
      /"peer_id":"(\d{5,})"/gi,
      /"messaging_user_fbid":"(\d{5,})"/gi,
      /"canonical_fbid":"(\d{5,})"/gi,
      /"counterpart_fbid":"(\d{5,})"/gi,
      /"recipient_id":"(\d{5,})"/gi,
      /"id":"(\d{5,})","__typename":"User"/gi,
      /profile\.php\?[^"'\\]*\bid=(\d{5,})/gi,
      /hovercard\/user\.php\?id=(\d{5,})/gi,
    ];

    htmlSnippetsNearThread(html, threadId).forEach((chunk) => {
      nearThreadPatterns.forEach((pattern) => {
        pattern.lastIndex = 0;
        let match = pattern.exec(chunk);
        while (match) {
          considerGlobal(pickNumericId(match[1]), 52, "json-near-thread");
          match = pattern.exec(chunk);
        }
      });
    });

    const msgIdCounts = collectE2eeUidsFromDomMessageIds(exclude);
    for (const [uid, count] of msgIdCounts) {
      const weight = 88 + Math.min(count, 8);
      bumpIdScore(scores, uid, weight);
      note(uid, "data-message-id-prefix");
    }

    const picked = pickBestUid(scores);
    if (picked.uid) {
      picked.source = sources.get(picked.uid) || "scored";
    }
    window.__ANHUNGLAND_LAST_E2EE_UID__ = picked;
    return picked;
  }

  function extractE2eeCustomerFacebookUid(threadId, viewerUid) {
    return extractE2eeCustomerFacebookUidWithMeta(threadId, viewerUid).uid;
  }

  /**
   * UID Facebook thật của khách.
   * - Messenger thường: threadId URL = UID khách (1-1).
   * - E2EE: threadId URL ≠ UID FB — cố đọc UID từ DOM/JSON; không có thì "".
   */
  function resolveCustomerUid() {
    const threadId = resolveThreadId();
    if (!threadId) return "";

    if (detectSource() !== SOURCES.MESSENGER_E2EE) {
      return threadId;
    }

    const viewerUid = resolveEmployeeUid();
    const picked = extractE2eeCustomerFacebookUidWithMeta(threadId, viewerUid);
    if (picked.uid) return picked.uid;

    const exclude = new Set([viewerUid, threadId].filter(Boolean));
    const fallback = pickDominantUidFromCounts(collectE2eeUidsFromDomMessageIds(exclude));
    if (fallback) {
      window.__ANHUNGLAND_LAST_E2EE_UID__ = {
        uid: fallback,
        score: 88,
        source: "data-message-id-prefix",
      };
    }
    return fallback;
  }

  function resolveThreadType() {
    return detectSource() === SOURCES.MESSENGER_E2EE ? "FB_E2EE_MESSAGE" : "FB_PERSONAL_MESSAGE";
  }

  function resolveEmployeeUid() {
    const html = document.documentElement?.innerHTML || "";
    const pick = (pattern) => {
      const match = html.match(pattern);
      const value = String(match?.[1] || "").trim();
      return /^\d{5,}$/.test(value) ? value : "";
    };
    return (
      pick(/"USER_ID":"(\d+)"/) ||
      pick(/"userID":"(\d+)"/) ||
      pick(/"viewerID":"(\d+)"/) ||
      pick(/"actorID":"(\d+)"/) ||
      pick(/"account_id":"(\d+)"/) ||
      ""
    );
  }

  function getUrlParamSnapshot() {
    const threadId = resolveThreadId();
    const source = detectSource();
    const out = {};
    if (threadId) out.thread_id = threadId;
    if (source === SOURCES.MESSENGER_E2EE) {
      out.e2ee = "1";
      const fbUid = resolveCustomerUid();
      if (fbUid) out.customer_facebook_uid = fbUid;
    }
    const employeeUid = resolveEmployeeUid();
    if (employeeUid) out.employee_facebook_uid = employeeUid;
    return out;
  }

  function isMessengerPath() {
    const source = detectSource();
    return (
      source === SOURCES.MESSENGER_STANDARD || source === SOURCES.MESSENGER_E2EE
    );
  }

  function buildScanKey() {
    return resolveThreadId() || "";
  }

  window.__ANHUNGLAND_EXT_CONTEXT__ = {
    get source() {
      return detectSource();
    },
    messengerWeb: true,
    isActivePath: isMessengerPath,
    isMessengerPath,
    resolveThreadId,
    resolveCustomerUid,
    resolveEmployeeUid,
    resolveThreadType,
    parseE2eeCustomerUidFromMessageId,
    resolveE2eeCustomerUidFromMessageIds,
    getUrlParamSnapshot,
    buildScanKey,
  };
})();
