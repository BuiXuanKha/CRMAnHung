/**
 * Quét khách + tin nhắn trên Messenger web (facebook.com / web.facebook.com).
 */
(function () {
  "use strict";

  const PANEL_ID = "anhungland-ext-panel";
  const MESSAGE_ID_ATTR = "data-message-id";
  const MESSENGER_MID_RE = /^mid\./i;
  /** E2EE: data-message-id dạng 100012643241932@msgr.7440334878442458206 (không có tiền tố mid.). */
  const MESSENGER_E2EE_MSG_ID_RE = /^\d+@msgr\./i;
  const LEFT_LIST_MAX_X_RATIO = 0.42;
  const HEADER_TOP_MIN = 40;
  const HEADER_TOP_MAX = 120;
  const CHAT_HEADER_LEFT_MIN = 320;
  const CHAT_HEADER_LEFT_MAX_RATIO = 0.72;
  const RIGHT_PANEL_MIN_LEFT_RATIO = 0.68;

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function foldForMatch(value) {
    return normalizeText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function isInsidePanel(node) {
    if (!(node instanceof Element)) return false;
    return Boolean(node.closest(`#${PANEL_ID}`));
  }

  function isMessengerMidId(value) {
    const v = String(value || "").trim();
    return MESSENGER_MID_RE.test(v) || MESSENGER_E2EE_MSG_ID_RE.test(v);
  }

  function getMessengerMessageIdFromNode(node) {
    if (!(node instanceof Element)) return "";
    const root = node.closest(`[${MESSAGE_ID_ATTR}]`);
    if (!(root instanceof HTMLElement)) return "";
    const id = String(root.getAttribute(MESSAGE_ID_ATTR) || "").trim();
    return isMessengerMidId(id) ? id : "";
  }

  function getCtx() {
    return window.__ANHUNGLAND_EXT_CONTEXT__ || null;
  }

  function getPersonNameUtil() {
    return window.__ANHUNGLAND_PERSON_NAME__ || null;
  }

  function hasPersonNameLetters(text) {
    const util = getPersonNameUtil();
    if (util?.hasPersonNameLetters) return util.hasPersonNameLetters(text);
    return /[A-Za-z\u00C0-\u1EF9\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(text || "");
  }

  function minPersonNameLength(text) {
    const util = getPersonNameUtil();
    if (util?.minPersonNameLength) return util.minPersonNameLength(text);
    return 4;
  }

  /** Trạng thái online / hoạt động — không phải tên người. */
  function isActivityOrStatusText(folded) {
    if (!folded) return true;
    if (/^hoat dong\b/.test(folded)) return true;
    if (/\bhoat dong\s+\d+/.test(folded)) return true;
    if (/^active\b/.test(folded)) return true;
    if (/\bactive\s+(now|\d+)/.test(folded)) return true;
    if (/\blast\s+(seen|active)\b/.test(folded)) return true;
    if (
      /\b\d+\s*(gio|phut|min|giay|ngay|tuan|thang|nam|hours?|minutes?|mins?|days?|weeks?|months?|years?)\s+(truoc|ago)\b/.test(
        folded,
      )
    ) {
      return true;
    }
    if (/\b(gio|phut|min|hour|minute|day|week)\s+truoc\b/.test(folded)) return true;
    if (/^(online|offline|away|busy|inactive)\b/.test(folded)) return true;
    if (/^(dang hoat dong|dang truc tuyen|dang online)\b/.test(folded)) return true;
    return false;
  }

  /** Loại text preview / trạng thái — không phải tên người. */
  function acceptCustomerNameText(value) {
    const text = normalizeText(value);
    if (!text || text.length > 80) return "";
    if (!hasPersonNameLetters(text)) return "";
    if (/^[\d\s:./·•,\-]+$/.test(text)) return "";
    if (/^\d{1,2}:\d{2}$/.test(text)) return "";
    if (/^\d{8,}$/.test(text.replace(/\s/g, ""))) return "";

    const folded = foldForMatch(text);
    if (isActivityOrStatusText(folded)) return "";

    const exactReject = [
      "messenger",
      "facebook",
      "hoi thoai",
      "tat ca tin nhan",
      "tin nhan",
      "chi tiet lien he",
      "active now",
      "dang hoat dong",
      "dang truc tuyen",
      "online",
      "seen",
      "da xem",
      "delivered",
      "da gui",
      "sent",
    ];
    if (exactReject.some((w) => folded === w || folded.startsWith(`${w} `))) {
      return "";
    }

    if (/^(ban|you)\s+(da\s+)?gui\b/.test(folded)) return "";
    if (/\b(da gui|sent)\s+\d+\s*(anh|photo|hinh|videos?|video)\b/.test(folded)) {
      return "";
    }
    if (/\bgui\s+\d+\s*(anh|photo|hinh)\b/.test(folded)) return "";
    if (/\b(da gui mot|sent an?)\s+(anh|photo|file|voice|tin nhan)\b/.test(folded)) {
      return "";
    }
    if (/^(da nhan|received|typing|dang nhap|dang soan)\b/.test(folded)) return "";
    if (/^(hom nay|hom qua|today|yesterday)\b/.test(folded)) return "";
    if (/^\([A-Za-z]\)$/.test(text)) return "";
    if (/^\([^)]{1,4}\)$/.test(text)) return "";
    if (text.length < minPersonNameLength(text) && !/\s/.test(text)) return "";

    return text;
  }

  function getSpanFontPx(node) {
    if (!(node instanceof Element)) return 14;
    const span = node.matches('span[dir="auto"]') ? node : node.querySelector('span[dir="auto"]');
    if (span instanceof Element) {
      const px = parseFloat(getComputedStyle(span).fontSize || "0");
      if (Number.isFinite(px) && px > 0) return px;
    }
    const px = parseFloat(getComputedStyle(node).fontSize || "0");
    return Number.isFinite(px) && px > 0 ? px : 14;
  }

  function isInLeftThreadList(node) {
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    return (
      rect.left < window.innerWidth * LEFT_LIST_MAX_X_RATIO &&
      rect.width > 40 &&
      rect.top > 80
    );
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
    return node.getBoundingClientRect().left >= window.innerWidth * RIGHT_PANEL_MIN_LEFT_RATIO;
  }

  function parseSenderNameToken(nameToken) {
    const folded = foldForMatch(nameToken);
    if (!folded) return null;
    if (folded === "ban" || folded === "you" || folded.startsWith("ban ")) {
      return "me";
    }
    return "customer";
  }

  /** Messenger E2EE: aria dạng "Tin nhắn do Bạn/Tung gửi lúc ...: nội dung". */
  function parseE2eeStyleAriaLabel(label) {
    const raw = normalizeText(label);
    if (!raw) return null;

    const vn = raw.match(/Tin nhắn do\s+(.+?)\s+gửi\b/i);
    if (vn) {
      const sender = parseSenderNameToken(normalizeText(vn[1]));
      const body = raw.match(/:\s+(.+)$/);
      return {
        sender,
        text: body ? normalizeText(body[1]) : "",
      };
    }

    const en = raw.match(/Message from\s+(.+?)\s+sent\b/i);
    if (en) {
      const sender = parseSenderNameToken(normalizeText(en[1]));
      const body = raw.match(/:\s+(.+)$/);
      return {
        sender,
        text: body ? normalizeText(body[1]) : "",
      };
    }

    return null;
  }

  function isMessengerE2eePath() {
    const ctx = getCtx();
    if ((ctx?.source || "") === "messenger_e2ee") return true;
    try {
      return /\/messages\/e2ee\/t\//i.test(window.location.pathname || "");
    } catch {
      return false;
    }
  }

  function isNodeInE2eeChatArea(node) {
    if (!(node instanceof Element)) return false;
    if (isInsidePanel(node)) return false;

    // Tin trong messages_table / role=log — không lọc theo tọa độ (chat giữa trùng vùng list trái).
    if (node.closest('[data-scope="messages_table"]') || node.closest('[role="log"]')) {
      if (node.closest('[data-scope="date_break"]')) return false;
      return true;
    }

    if (isInLeftThreadList(node) || isInChatHeaderBand(node) || isInRightSidebar(node)) {
      return false;
    }

    const minLeft = Math.min(280, window.innerWidth * 0.18);
    const maxLeft = window.innerWidth * RIGHT_PANEL_MIN_LEFT_RATIO;
    let current = node instanceof HTMLElement ? node : null;
    for (let depth = 0; depth < 14 && current; depth += 1) {
      const rect = current.getBoundingClientRect();
      if (rect.width >= 16 && rect.height >= 8 && rect.left >= minLeft && rect.left < maxLeft) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function compareNodesByDomOrder(a, b) {
    if (!(a instanceof Element) || !(b instanceof Element)) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  }

  function isMessengerE2eeSenderAriaLabel(label) {
    return (
      /Tin nhắn do\s+.+\s+gửi|Message from\s+.+\s+sent/i.test(String(label || "")) ||
      /^Nhập,\s*Tin nhắn do\s+/i.test(String(label || ""))
    );
  }

  function isE2eeDateOrTimeSeparator(text) {
    const clean = normalizeText(text);
    const folded = foldForMatch(clean);
    if (!folded) return true;
    if (/^\d+\s*(gio|phut|min|giay|ngay|tuan|thang|nam|hour|minute|day|week|month|year)s?\b/.test(folded)) {
      return true;
    }
    if (/^(hom nay|hom qua|today|yesterday|vua xong|just now)$/.test(folded)) return true;
    if (/^\d{1,2}:\d{2}(\s|$)/.test(clean)) return true;
    return false;
  }

  function isE2eeSystemOrNoiseMessage(text) {
    const folded = foldForMatch(text);
    if (!folded) return true;
    if (isE2eeDateOrTimeSeparator(text)) return true;
    if (isActivityOrStatusText(folded)) return true;
    if (/\b(da tao nhom|tao nhom nay|created (the|this) group|ban da tao nhom|you created)\b/.test(folded)) {
      return true;
    }
    if (/\b(bat dau cuoc tro chuyen|started this chat|them .+ vao nhom|added .+ to the group)\b/.test(folded)) {
      return true;
    }
    if (/^(nhap|type a message|gui tin nhan)\b/.test(folded)) return true;
    return false;
  }

  function isE2eeMessageButton(node) {
    if (!(node instanceof HTMLElement)) return false;
    const label = node.getAttribute("aria-label") || "";
    if (!isMessengerE2eeSenderAriaLabel(label)) return false;
    if (!node.closest('[data-scope="messages_table"]')) return false;
    if (node.closest('[data-scope="date_break"]')) return false;
    return isNodeInE2eeChatArea(node);
  }

  function findE2eeAriaMessageNodes() {
    const nodes = [];
    const seen = new Set();
    const push = (node) => {
      if (!(node instanceof HTMLElement) || seen.has(node)) return;
      seen.add(node);
      nodes.push(node);
    };

    document
      .querySelectorAll(
        '[data-scope="messages_table"] [aria-label*="Tin nhắn do"], [data-scope="messages_table"] [aria-label*="Message from"]',
      )
      .forEach((node) => {
        if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
        if (node.closest('[data-scope="date_break"]')) return;
        const label = node.getAttribute("aria-label") || "";
        if (!isMessengerE2eeSenderAriaLabel(label)) return;
        push(node);
      });

    document
      .querySelectorAll(
        '[role="button"][aria-label*="Tin nhắn do"], [role="button"][aria-label*="Message from"]',
      )
      .forEach((node) => {
        if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
        push(node);
      });

    return nodes;
  }

  function getMessageRootWithAria(msgNode) {
    if (!(msgNode instanceof Element)) return null;

    let current = msgNode instanceof HTMLElement ? msgNode : null;
    for (let depth = 0; depth < 14 && current; depth += 1) {
      const label = current.getAttribute?.("aria-label") || "";
      if (label && isMessengerE2eeSenderAriaLabel(label)) return current;
      if (label && current.hasAttribute(MESSAGE_ID_ATTR)) return current;
      current = current.parentElement;
    }

    if (msgNode.getAttribute("aria-label")) return msgNode;
    const closest = msgNode.closest(`[${MESSAGE_ID_ATTR}][aria-label]`);
    return closest instanceof HTMLElement ? closest : msgNode;
  }

  function parseMessageAriaLabel(msgNode) {
    const root = getMessageRootWithAria(msgNode);
    const label = root?.getAttribute?.("aria-label") || "";
    if (!label) return { sender: null, text: "" };

    const luc = parseE2eeLucAriaLabel(label);
    if (luc) return luc;

    const e2ee = parseE2eeStyleAriaLabel(label);
    if (e2ee) return e2ee;

    let senderName = "";
    const withBody = label.match(/,\s*([^,]+?):\s+(.+)$/);
    if (withBody) {
      senderName = normalizeText(withBody[1]);
      return {
        sender: parseSenderNameToken(senderName),
        text: normalizeText(withBody[2]),
      };
    }

    const endOnly = label.match(/,\s*([^,]+)\s*$/);
    if (endOnly) senderName = normalizeText(endOnly[1]);

    return {
      sender: parseSenderNameToken(senderName),
      text: "",
    };
  }

  function hrefMatchesThreadId(href, threadId) {
    const h = String(href || "");
    const id = String(threadId || "").trim();
    if (!h || !id) return false;
    return (
      h.includes(`/messages/t/${id}`) ||
      h.includes(`/messages/e2ee/t/${id}`) ||
      h.includes(`/messages/e2ee/t/${id}/`) ||
      h.includes(`/messages/t/${id}/`) ||
      h.includes(`/t/${id}`)
    );
  }

  function findThreadLinksById(threadId) {
    if (!threadId) return [];
    const links = [];
    document.querySelectorAll('a[href*="/messages/"]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || isInsidePanel(link)) return;
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

  function collectNameCandidatesInScope(scope) {
    if (!(scope instanceof HTMLElement)) return [];
    const items = [];
    const push = (node, text, opts = {}) => {
      const clean = acceptCustomerNameText(text);
      if (!clean) return;
      const fontPx = getSpanFontPx(node);
      const rect = node.getBoundingClientRect();
      items.push({
        text: clean,
        fontPx,
        top: rect.top,
        left: rect.left,
        isThreadTitle: Boolean(opts.isThreadTitle),
      });
    };

    scope.querySelectorAll('[data-surface*="thread_title"], [data-surface*="ThreadTitle"]').forEach(
      (wrap) => {
        if (!(wrap instanceof HTMLElement)) return;
        push(wrap, wrap.textContent, { isThreadTitle: true });
        wrap.querySelectorAll('span[dir="auto"]').forEach((span) => {
          push(span, span.textContent, { isThreadTitle: true });
        });
      },
    );

    scope.querySelectorAll('span[dir="auto"], h1, h2, [role="heading"]').forEach((node) => {
      if (!(node instanceof HTMLElement) || node.closest("abbr")) return;
      push(node, node.textContent);
    });

    scope.querySelectorAll("img[alt]").forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      const alt = acceptCustomerNameText(img.getAttribute("alt") || "");
      if (alt) {
        const rect = img.getBoundingClientRect();
        items.push({ text: alt, fontPx: 16, top: rect.top, left: rect.left });
      }
    });

    items.sort((a, b) => b.fontPx - a.fontPx || a.top - b.top || a.left - b.left);
    return items;
  }

  function scoreNameCandidate(candidate) {
    const text = candidate.text || "";
    const folded = foldForMatch(text);
    if (isActivityOrStatusText(folded)) return -10000;

    let score = (candidate.fontPx || 14) * 12;
    if (candidate.fontPx >= 16) score += 40;
    if (candidate.fontPx >= 15 && candidate.fontPx < 16) score += 20;
    if (candidate.fontPx > 0 && candidate.fontPx <= 13) score -= 60;
    if (candidate.isThreadTitle) score += 55;
    if (/\s/.test(text)) score += 25;
    if (text.length >= 6) score += 15;
    if (text.length >= 10) score += 10;
    try {
      if (/^[\p{L}\p{M}][\p{L}\p{M}\p{N}.'\-\s]*$/u.test(text)) score += 8;
    } catch {
      if (/^[A-Za-z\u00C0-\u1EF9]/.test(text)) score += 8;
    }
    const util = getPersonNameUtil();
    if (util?.usesCompactNameScript?.(text)) score += 12;
    return score;
  }

  function pickBestNameCandidate(candidates) {
    if (!candidates.length) return "";

    const viable = candidates.filter(
      (c) => c.text && !isActivityOrStatusText(foldForMatch(c.text)),
    );
    if (!viable.length) return "";

    const largeFont = viable.filter((c) => (c.fontPx || 0) >= 15);
    const pool = largeFont.length ? largeFont : viable;

    pool.sort((a, b) => scoreNameCandidate(b) - scoreNameCandidate(a));
    return pool[0]?.text || "";
  }

  /** Tên khách từ aria-label tin nhắn (khi header/list chỉ có trạng thái). */
  function extractNameFromMessageSenders() {
    const counts = new Map();
    const ingestLabel = (label) => {
      const e2ee = parseE2eeStyleAriaLabel(label);
      if (e2ee?.sender === "customer") {
        const vn = label.match(/Tin nhắn do\s+(.+?)\s+gửi\b/i);
        const en = label.match(/Message from\s+(.+?)\s+sent\b/i);
        const senderName = normalizeText(vn?.[1] || en?.[1] || "");
        const clean = acceptCustomerNameText(senderName);
        if (clean) counts.set(clean, (counts.get(clean) || 0) + 1);
        return;
      }
      const withBody = label.match(/,\s*([^,]+?):\s+(.+)$/);
      if (!withBody) return;
      const senderName = normalizeText(withBody[1]);
      if (parseSenderNameToken(senderName) !== "customer") return;
      const clean = acceptCustomerNameText(senderName);
      if (!clean) return;
      counts.set(clean, (counts.get(clean) || 0) + 1);
    };

    findMessageNodes().forEach((node) => {
      const label = getMessageRootWithAria(node)?.getAttribute?.("aria-label") || "";
      ingestLabel(label);
    });

    if (!findMessageNodes().length) {
      document.querySelectorAll("[aria-label]").forEach((node) => {
        if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
        if (!isNodeInE2eeChatArea(node)) return;
        const label = node.getAttribute("aria-label") || "";
        if (isMessengerE2eeSenderAriaLabel(label)) ingestLabel(label);
      });
    }

    let best = "";
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        best = name;
      }
    }
    if (best) return { name: best, source: "message-aria-sender" };
    return { name: "", source: "" };
  }

  function extractNameFromThreadList(threadId) {
    const links = findThreadLinksById(threadId);
    let best = "";
    let bestScore = -1;

    for (const link of links) {
      if (!isInLeftThreadList(link)) continue;
      const row = climbToThreadRow(link);
      const scope = row instanceof HTMLElement ? row : link;
      const candidates = collectNameCandidatesInScope(scope);
      const name = pickBestNameCandidate(candidates);
      if (!name) continue;

      let score = 100;
      if (
        scope.matches?.('[aria-selected="true"]') ||
        scope.querySelector?.('[aria-selected="true"]')
      ) {
        score += 40;
      }
      if (scope.matches?.('[aria-current="true"]') || link.getAttribute("aria-current")) {
        score += 30;
      }
      score += candidates[0]?.fontPx || 14;

      if (score > bestScore) {
        bestScore = score;
        best = name;
      }
    }

    if (best) return { name: best, source: "thread-list" };

    for (const row of document.querySelectorAll('[role="row"]')) {
      if (!(row instanceof HTMLElement) || isInsidePanel(row)) continue;
      if (!isInLeftThreadList(row)) continue;
      const selected =
        row.getAttribute("aria-selected") === "true" ||
        row.querySelector('[aria-selected="true"]');
      if (!selected) continue;
      const name = pickBestNameCandidate(collectNameCandidatesInScope(row));
      if (name) return { name, source: "thread-list-selected" };
    }

    return { name: "", source: "" };
  }

  function extractNameFromChatHeader(threadId) {
    const headerLinks = findThreadLinksById(threadId).filter((link) =>
      isInChatHeaderBand(link),
    );

    for (const link of headerLinks) {
      const scope =
        link.closest("header") ||
        link.parentElement?.parentElement ||
        link;
      if (!(scope instanceof HTMLElement)) continue;
      const candidates = collectNameCandidatesInScope(scope);
      const name = pickBestNameCandidate(candidates);
      if (name) return { name, source: "chat-header-link" };
      const direct = acceptCustomerNameText(link.textContent);
      if (direct) return { name: direct, source: "chat-header-link-text" };
    }

    const bandCandidates = [];
    document.querySelectorAll('span[dir="auto"], h1, h2, [role="heading"]').forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      if (!isInChatHeaderBand(node) || isInRightSidebar(node)) return;
      const clean = acceptCustomerNameText(node.textContent);
      if (!clean) return;
      bandCandidates.push({
        text: clean,
        fontPx: getSpanFontPx(node),
        top: node.getBoundingClientRect().top,
        left: node.getBoundingClientRect().left,
      });
    });
    const best = pickBestNameCandidate(bandCandidates);
    if (best) return { name: best, source: "chat-header-band" };

    return { name: "", source: "" };
  }

  function extractCustomerName(threadId) {
    const attempts = [
      () => extractNameFromChatHeader(threadId),
      () => extractNameFromThreadList(threadId),
      () => extractNameFromMessageSenders(),
    ];
    for (const run of attempts) {
      const result = run();
      if (result.name && acceptCustomerNameText(result.name)) return result;
    }
    return { name: "", source: "" };
  }

  function extractAvatarFromScope(scope) {
    if (!(scope instanceof HTMLElement)) return "";
    let best = null;
    let bestScore = -1;
    scope.querySelectorAll('img[src*="fbcdn"]').forEach((img) => {
      if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 24 || rect.width > 128) return;
      const score = rect.width + (rect.height >= 24 ? 20 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = img;
      }
    });
    return best?.src || "";
  }

  function extractHeaderAvatar(threadId) {
    const listLinks = findThreadLinksById(threadId).filter((link) =>
      isInLeftThreadList(link),
    );
    for (const link of listLinks) {
      const row = climbToThreadRow(link);
      const url = extractAvatarFromScope(row || link);
      if (url) return { url, source: "thread-list-row" };
    }

    const headerLinks = findThreadLinksById(threadId).filter((link) =>
      isInChatHeaderBand(link),
    );
    for (const link of headerLinks) {
      let scope = link.parentElement;
      for (let i = 0; i < 4 && scope; i += 1) {
        const url = extractAvatarFromScope(scope);
        if (url) return { url, source: "chat-header" };
        scope = scope.parentElement;
      }
    }

    let best = null;
    let bestScore = -1;
    document.querySelectorAll('img[src*="fbcdn"]').forEach((img) => {
      if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return;
      if (!isInChatHeaderBand(img)) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 28 || rect.width > 96) return;
      const score = 200 - rect.top + rect.width;
      if (score > bestScore) {
        bestScore = score;
        best = img;
      }
    });
    if (best?.src) return { url: best.src, source: "chat-header-fallback" };

    return { url: "", source: "" };
  }

  function getE2eeChatLogRoot() {
    let best = null;
    let bestScore = -1;
    document.querySelectorAll('[role="log"]').forEach((el) => {
      if (!(el instanceof HTMLElement) || isInsidePanel(el)) return;
      if (isInLeftThreadList(el) || isInRightSidebar(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 180 || rect.height < 80) return;
      const score = rect.width * rect.height;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    });
    return best;
  }

  function getChatScanRoot() {
    if (isMessengerE2eePath()) {
      const e2eeLog = getE2eeChatLogRoot();
      if (e2eeLog instanceof HTMLElement) return e2eeLog;
    }

    const minLeft = Math.min(300, window.innerWidth * 0.22);
    let best = null;
    let bestCount = 0;
    document.querySelectorAll('[role="main"], div').forEach((el) => {
      if (!(el instanceof HTMLElement) || isInsidePanel(el)) return;
      const rect = el.getBoundingClientRect();
      const count = el.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).length;
      if (rect.left < minLeft && count < 3) return;
      if (count > bestCount) {
        bestCount = count;
        best = el;
      }
    });
    if (bestCount > 0) return best;

    let bestScroll = null;
    let bestScore = -1;
    document.querySelectorAll("div").forEach((div) => {
      if (!(div instanceof HTMLElement) || isInsidePanel(div)) return;
      if (isInLeftThreadList(div) || isInRightSidebar(div) || isInChatHeaderBand(div)) return;
      const style = getComputedStyle(div);
      if (!/(auto|scroll|overlay)/.test(style.overflowY)) return;
      const rect = div.getBoundingClientRect();
      if (rect.left < minLeft || rect.width < 260 || rect.height < 180) return;
      const spanCount = div.querySelectorAll('span[dir="auto"]').length;
      const score = spanCount * 4 + rect.height;
      if (score > bestScore) {
        bestScore = score;
        bestScroll = div;
      }
    });
    return bestScore >= 24 ? bestScroll : null;
  }

  function getChatScroller() {
    const root = getChatScanRoot();
    if (!(root instanceof HTMLElement)) return null;

    let best = null;
    let bestScore = -1;
    root.querySelectorAll("div").forEach((div) => {
      if (!(div instanceof HTMLElement) || isInsidePanel(div)) return;
      const style = getComputedStyle(div);
      if (!/(auto|scroll|overlay)/.test(style.overflowY)) return;
      const rect = div.getBoundingClientRect();
      if (rect.height < 160 || rect.width < 220) return;
      const msgCount = div.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).length;
      let score = msgCount * 12 + rect.height;
      if (msgCount === 0) score -= 40;
      if (score > bestScore) {
        bestScore = score;
        best = div;
      }
    });
    return best;
  }

  function extractMessageText(msgNode) {
    const parts = [];
    const seen = new Set();

    msgNode.querySelectorAll('span[dir="auto"], div[dir="auto"]').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const hasInnerAuto = [...node.querySelectorAll('span[dir="auto"], div[dir="auto"]')].some(
        (inner) => inner !== node && node.contains(inner),
      );
      if (hasInnerAuto) return;

      const text = normalizeText(node.textContent);
      if (!text) return;
      if (/^\d{1,2}:\d{2}(\s|$)/.test(text)) return;
      if (/^(đã gửi|sent|delivered|seen|đã xem)/i.test(text)) return;
      if (!acceptCustomerNameText(text) && /^(ban|you)\s/i.test(foldForMatch(text))) return;

      const key = foldForMatch(text);
      if (seen.has(key)) return;
      seen.add(key);
      parts.push(text);
    });

    if (parts.length) {
      return dedupeRepeatedText(parts.length === 1 ? parts[0] : normalizeText(parts.join("\n")));
    }
    return dedupeRepeatedText(normalizeText(msgNode.textContent));
  }

  function isLikelyProfileAvatarImage(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const src = String(img.currentSrc || img.src || "");
    const rect = img.getBoundingClientRect();
    if (rect.width > 120 || rect.height > 120) return false;
    return /p100x100|s100x100|_tt6|cp6_dst-jpg_s100/i.test(src);
  }

  function extractImageUrls(msgNode, opts = {}) {
    const skipProfileAvatars = Boolean(opts.skipProfileAvatars);
    const urls = [];
    const seen = new Set();
    msgNode.querySelectorAll('img[src*="fbcdn"]').forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      if (skipProfileAvatars && isLikelyProfileAvatarImage(img)) return;
      const src = String(img.currentSrc || img.src || "").trim();
      if (!src || seen.has(src)) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 40 && rect.height < 40) return;
      seen.add(src);
      urls.push(src);
    });
    return urls;
  }

  function findClosestMessageRow(node) {
    if (!(node instanceof Element)) return null;
    let current = node instanceof HTMLElement ? node : null;
    for (let depth = 0; depth < 18 && current; depth += 1) {
      if (current.getAttribute("role") === "row") return current;
      const style = getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      if (/(flex|grid)/.test(style.display) && rect.height >= 20 && rect.width >= 80) {
        return current;
      }
      current = current.parentElement;
    }
    const row = node.closest('[role="row"]');
    return row instanceof HTMLElement ? row : null;
  }

  function elementHasClass(el, className) {
    if (!(el instanceof Element)) return false;
    return String(el.className || "").split(/\s+/).includes(className);
  }

  function inferSenderFromRowStructure(node) {
    if (!(node instanceof Element)) return null;
    const row = findClosestMessageRow(node);
    if (!(row instanceof HTMLElement)) return null;
    if (elementHasClass(row, "x13a6bvl") || row.querySelector(".x13a6bvl")) return "me";
    if (elementHasClass(row, "x1cy8zhl") || row.closest(".x1cy8zhl")) return "customer";
    return null;
  }

  function resolveSender(msgNode) {
    const aria = parseMessageAriaLabel(msgNode);
    if (aria.sender === "me" || aria.sender === "customer") return aria.sender;

    const byRow = inferSenderFromRowStructure(msgNode);
    if (byRow) return byRow;

    const scanRoot = getChatScanRoot();
    const rootRect =
      scanRoot instanceof HTMLElement ? scanRoot.getBoundingClientRect() : null;
    const rect = msgNode.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    if (rootRect && rootRect.width > 120) {
      const rel = (centerX - rootRect.left) / rootRect.width;
      if (rel >= 0.62) return "me";
      if (rel <= 0.38) return "customer";
    } else {
      const ratio = centerX / Math.max(window.innerWidth, 1);
      if (ratio >= 0.62) return "me";
      if (ratio <= 0.38) return "customer";
    }
    return "unknown";
  }

  function findMessageNodes() {
    const scanRoot = getChatScanRoot();
    if (!(scanRoot instanceof HTMLElement)) return [];

    const found = [];
    const seen = new Set();
    scanRoot.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      const rawId = String(node.getAttribute(MESSAGE_ID_ATTR) || "").trim();
      if (!rawId) return;
      if (!isMessengerMidId(rawId)) return;
      if (seen.has(node)) return;
      seen.add(node);
      found.push(node);
    });
    return found;
  }

  function acceptMessageBubbleText(value, customerName) {
    const text = normalizeText(value);
    if (!text || text.length < 2 || text.length > 4000) return "";
    if (/^\d{1,2}:\d{2}(\s|$)/.test(text)) return "";
    const folded = foldForMatch(text);
    if (/^(hom nay|hom qua|today|yesterday)\b/.test(folded)) return "";
    if (/^\d+\s*(gio|phut|min|ngay|tuan|thang|nam)\b/.test(folded)) return "";
    if (/\b(da tao nhom nay|created this group|ban da tao)\b/.test(folded)) return "";
    if (customerName && foldForMatch(text) === foldForMatch(customerName) && text.length < 48) {
      return "";
    }
    if (isActivityOrStatusText(folded)) return "";
    if (/^(gui tin nhan|nhap tin nhan|type a message)\b/.test(folded)) return "";
    return text;
  }

  function collectBubbleFallbackMessages(scanRoot, customerName) {
    if (!(scanRoot instanceof HTMLElement)) return [];
    const records = [];
    const seen = new Set();
    const minTop = 110;
    const maxBottom = window.innerHeight - 90;

    scanRoot.querySelectorAll('span[dir="auto"]').forEach((span) => {
      if (!(span instanceof HTMLElement) || isInsidePanel(span)) return;
      if (isInLeftThreadList(span) || isInChatHeaderBand(span) || isInRightSidebar(span)) {
        return;
      }
      const rect = span.getBoundingClientRect();
      if (rect.top < minTop || rect.bottom > maxBottom) return;
      if (rect.width < 24) return;

      const text = acceptMessageBubbleText(span.textContent, customerName);
      if (!text) return;

      const row =
        span.closest('[role="row"]') ||
        span.parentElement?.parentElement?.parentElement ||
        span;
      const top = Math.round(rect.top);
      const folded = foldForMatch(text);
      const rowKey = `${top}::${folded}`;
      if (seen.has(rowKey)) return;
      seen.add(rowKey);

      const midNode = row instanceof Element ? row.closest(`[${MESSAGE_ID_ATTR}]`) : null;
      const midId =
        midNode instanceof HTMLElement && isMessengerMidId(midNode.getAttribute(MESSAGE_ID_ATTR))
          ? String(midNode.getAttribute(MESSAGE_ID_ATTR) || "").trim()
          : "";

      const sender = resolveSender(span);
      records.push({
        id: midId,
        text,
        imageUrls: extractImageUrls(row instanceof HTMLElement ? row : span),
        sender,
        senderUid: "",
        dedupeKey: midId ? `mid:${midId}` : `bubble::${top}::${folded.slice(0, 120)}`,
        top: rect.top,
        anchor: span,
      });
    });

    return records;
  }

  function getMessageSortTop(node) {
    if (!(node instanceof Element)) return 0;
    const candidates = [
      node.querySelector?.('span[dir="auto"]'),
      node.closest('[data-scope="messages_table"]'),
      node.closest('[role="row"]'),
      node,
    ];
    for (const el of candidates) {
      if (!(el instanceof HTMLElement)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.height >= 4 && Number.isFinite(rect.top)) return rect.top;
    }
    return node.getBoundingClientRect().top || 0;
  }

  /** E2EE message row: aria-label="Lúc ..., Bạn|Tên: nội dung". */
  function parseE2eeLucAriaLabel(label) {
    const raw = normalizeText(label);
    if (!raw) return null;
    if (!/^Lúc\s/i.test(raw) && !/^Message at\s/i.test(raw)) return null;

    const withBody = raw.match(/,\s*([^,]+?):\s+(.+)$/);
    if (withBody) {
      return {
        sender: parseSenderNameToken(normalizeText(withBody[1])),
        text: normalizeText(withBody[2]),
      };
    }

    const endOnly = raw.match(/,\s*([^,]+)\s*$/);
    if (endOnly) {
      return {
        sender: parseSenderNameToken(normalizeText(endOnly[1])),
        text: "",
      };
    }

    return null;
  }

  function isE2eeMessageRowNode(node) {
    if (!(node instanceof HTMLElement) || isInsidePanel(node)) return false;
    if (node.closest('[data-scope="date_break"]')) return false;
    const messageId = String(node.getAttribute(MESSAGE_ID_ATTR) || "").trim();
    if (!messageId || !isMessengerMidId(messageId)) return false;
    const label = node.getAttribute("aria-label") || "";
    return Boolean(parseE2eeLucAriaLabel(label));
  }

  function extractE2eeBodyText(node) {
    if (!(node instanceof HTMLElement)) return "";
    const skip = /^(Nhập,\s*Tin nhắn do|Tin nhắn gốc:|Message from)/i;
    const candidates = [];
    node.querySelectorAll('[dir="auto"], div[class*="x126k92a"]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest("h3")) return;
      const t = normalizeText(el.textContent);
      if (!t || skip.test(t) || t.length > 4000) return;
      candidates.push(t);
    });
    if (!candidates.length) return "";
    return candidates.sort((a, b) => b.length - a.length)[0];
  }

  function extractE2eeAttachmentUrls(node) {
    const imageUrls = [];
    const videoUrls = [];
    const seen = new Set();

    const pushUnique = (list, url) => {
      const u = String(url || "").trim();
      if (!u || seen.has(u)) return;
      seen.add(u);
      list.push(u);
    };

    if (!(node instanceof HTMLElement)) return { imageUrls, videoUrls };

    node.querySelectorAll("img").forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      const src = String(img.currentSrc || img.src || "").trim();
      if (!src) return;
      const alt = String(img.alt || "").trim();
      if (alt === "Mở ảnh" || alt === "Open photo") {
        pushUnique(imageUrls, src);
        return;
      }
      if (isLikelyProfileAvatarImage(img)) return;
      if (src.startsWith("data:image/") || img.width >= 80 || img.height >= 80) {
        pushUnique(imageUrls, src);
      }
    });

    node.querySelectorAll("video").forEach((video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      pushUnique(videoUrls, video.currentSrc || video.src || "");
      video.querySelectorAll("source[src]").forEach((source) => {
        pushUnique(videoUrls, source.src || "");
      });
    });

    return { imageUrls, videoUrls };
  }

  function buildE2eeRecordFromMessageRow(node) {
    if (!isE2eeMessageRowNode(node)) return null;

    const messageId = String(node.getAttribute(MESSAGE_ID_ATTR) || "").trim();
    const label = node.getAttribute("aria-label") || "";
    const parsed = parseE2eeLucAriaLabel(label);
    if (!parsed || (parsed.sender !== "me" && parsed.sender !== "customer")) return null;

    let text = parsed.text ? dedupeRepeatedText(parsed.text) : "";
    if (!text) text = extractE2eeBodyText(node);

    const { imageUrls, videoUrls } = extractE2eeAttachmentUrls(node);
    const allImages = [...imageUrls, ...videoUrls.map((u) => u)];

    if (!text && allImages.length) text = videoUrls.length && !imageUrls.length ? "[Video]" : "[Ảnh]";
    if (!text && !allImages.length) return null;
    if (text && isE2eeSystemOrNoiseMessage(text)) return null;

    const sortTop = getMessageSortTop(node);
    return {
      id: messageId,
      text,
      imageUrls: allImages,
      sender: parsed.sender,
      senderUid: "",
      dedupeKey: `mid:${messageId}`,
      top: sortTop,
      anchor: node,
    };
  }

  /**
   * E2EE: tìm [data-message-id] + aria "Lúc ..., Bạn|Tên: ..." trên cùng thẻ.
   */
  function collectE2eeMessagesByDataMessageId() {
    const records = [];
    const seenIds = new Set();

    document.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      const messageId = String(node.getAttribute(MESSAGE_ID_ATTR) || "").trim();
      if (!messageId || seenIds.has(messageId)) return;

      const record = buildE2eeRecordFromMessageRow(node);
      if (!record) return;

      seenIds.add(messageId);
      records.push(record);
    });

    records.sort((a, b) => {
      const dom = compareNodesByDomOrder(a.anchor, b.anchor);
      if (dom !== 0) return dom;
      return (a.top ?? 0) - (b.top ?? 0);
    });
    return records;
  }

  function collectE2eeScopedMessageRecords() {
    return collectE2eeMessagesByDataMessageId();
  }

  function collectE2eeAriaLabelMessages() {
    const records = [];
    const seenLabels = new Set();

    findE2eeAriaMessageNodes().forEach((node) => {
        if (!isE2eeMessageButton(node)) return;

        const label = node.getAttribute("aria-label") || "";
        const labelKey = foldForMatch(label);
        if (seenLabels.has(labelKey)) return;
        seenLabels.add(labelKey);

        const aria = parseE2eeStyleAriaLabel(label) || parseMessageAriaLabel(node);
        if (!aria || (aria.sender !== "me" && aria.sender !== "customer")) return;

        let text = aria.text ? dedupeRepeatedText(aria.text) : "";
        const imageScope = node.closest('[data-scope="messages_table"]') || node;
        const imageUrls = extractImageUrls(imageScope, { skipProfileAvatars: true });
        if (!text && imageUrls.length) text = "[Ảnh]";
        if (!text && !imageUrls.length) text = "[Ảnh]";
        if (isE2eeSystemOrNoiseMessage(text)) return;

        const messageId = getMessengerMessageIdFromNode(node);
        const sortTop = getMessageSortTop(node);
        records.push({
          id: messageId,
          text,
          imageUrls,
          sender: aria.sender,
          senderUid: "",
          dedupeKey: messageId
            ? `mid:${messageId}`
            : `e2ee-aria::${labelKey.slice(0, 160)}`,
          top: sortTop,
          anchor: node,
        });
      });

    records.sort((a, b) => {
      const dom = compareNodesByDomOrder(a.anchor, b.anchor);
      if (dom !== 0) return dom;
      return (a.top ?? 0) - (b.top ?? 0);
    });
    return records;
  }

  function dedupeRepeatedText(text) {
    const clean = normalizeText(text);
    if (!clean) return "";

    const dupSpaced = clean.match(/^(.+?)\s+\1$/u);
    if (dupSpaced?.[1]) return normalizeText(dupSpaced[1]);

    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 2 && foldForMatch(words[0]) === foldForMatch(words[1])) {
      return words[0];
    }

    const half = Math.floor(clean.length / 2);
    if (half >= 1) {
      let a = clean.slice(0, half).trim();
      let b = clean.slice(half).trim();
      if (a && b && foldForMatch(a) === foldForMatch(b)) return a;
      if (b.startsWith(a) && foldForMatch(b.slice(a.length).trim()) === foldForMatch(a)) {
        return a;
      }
    }

    return clean;
  }

  function buildMessageRecord(msgNode) {
    const messageId = String(msgNode.getAttribute(MESSAGE_ID_ATTR) || "").trim();
    const aria = parseMessageAriaLabel(msgNode);
    let text = aria.text ? dedupeRepeatedText(aria.text) : dedupeRepeatedText(extractMessageText(msgNode));
    const imageUrls = extractImageUrls(msgNode);
    if (!text && imageUrls.length) text = "[Ảnh]";
    if (!text && !imageUrls.length) return null;

    const sender = resolveSender(msgNode);
    const rect = msgNode.getBoundingClientRect();
    return {
      id: messageId,
      text,
      imageUrls,
      sender,
      senderUid: "",
      dedupeKey: messageId ? `mid:${messageId}` : `no-mid::${sender}::${text || "[img]"}`,
      top: rect.top,
      anchor: msgNode,
    };
  }

  function collectMessages(maxCount = 500, customerName = "") {
    const isE2ee = isMessengerE2eePath();
    const entries = [];

    if (isE2ee) {
      collectE2eeMessagesByDataMessageId().forEach((record) => {
        if (record) entries.push(record);
      });
    } else {
      findMessageNodes().forEach((node) => {
        const record = buildMessageRecord(node);
        if (record) entries.push(record);
      });

      if (!entries.length) {
        const scanRoot = getChatScanRoot();
        if (scanRoot instanceof HTMLElement) {
          collectBubbleFallbackMessages(scanRoot, customerName).forEach((record) => {
            if (record) entries.push(record);
          });
        }
      }
    }

    entries.sort((a, b) => {
      const anchorA = a.anchor instanceof Element ? a.anchor : null;
      const anchorB = b.anchor instanceof Element ? b.anchor : null;
      if (anchorA && anchorB) {
        const dom = compareNodesByDomOrder(anchorA, anchorB);
        if (dom !== 0) return dom;
      }
      return (a.top ?? 0) - (b.top ?? 0);
    });

    const byKey = new Map();
    const ordered = [];
    for (const record of entries) {
      const key = record.dedupeKey || record.id || `${record.sender}::${record.text}`;
      if (byKey.has(key)) continue;
      if (ordered.length >= maxCount) break;
      byKey.set(key, true);
      ordered.push(record);
    }
    return ordered;
  }

  function scan(state) {
    const ctx = getCtx();
    const source = ctx?.source || "messenger_standard";
    const threadId = ctx?.resolveThreadId?.() || "";
    const isE2ee = source === "messenger_e2ee";

    state.threadId = threadId;
    state.employeeUid = ctx?.resolveEmployeeUid?.() || "";
    state.myPageUid = state.employeeUid;
    state.threadType = ctx?.resolveThreadType?.() || "";
    state.scanSource = source;

    if (!threadId) {
      state.customerName = "";
      state.avatarUrl = "";
      state.chatMessages = [];
      state.lastMessagesKey = "";
      state.source = "url-only";
      state.status = "Mo mot cuoc tro chuyen Messenger (URL /messages/t/...).";
      state.scanDebug = { threadId: "" };
      return;
    }

    const nameResult = extractCustomerName(threadId);
    const avatarResult = extractHeaderAvatar(threadId);
    const messages = collectMessages(500, nameResult.name);

    let customerFacebookUid = ctx?.resolveCustomerUid?.() || "";
    if (isE2ee && !customerFacebookUid && messages.length) {
      const exclude = new Set([state.employeeUid, threadId].filter(Boolean));
      customerFacebookUid =
        ctx?.resolveE2eeCustomerUidFromMessageIds?.(
          messages.map((record) => record.id),
          exclude,
        ) || "";
      if (customerFacebookUid) {
        window.__ANHUNGLAND_LAST_E2EE_UID__ = {
          uid: customerFacebookUid,
          score: 90,
          source: "data-message-id-prefix",
        };
      }
    }
    state.customerUid = customerFacebookUid || (isE2ee ? "" : threadId);

    state.customerName = nameResult.name;
    state.avatarUrl = avatarResult.url;
    state.chatMessages = messages;
    state.lastMessagesKey = threadId;
    state.source = nameResult.source || (avatarResult.url ? "avatar-only" : "url-only");
    state.scanDebug = {
      threadId,
      customerFacebookUid: state.customerUid || null,
      e2eeCustomerUidSource: window.__ANHUNGLAND_LAST_E2EE_UID__?.source || "",
      e2eeCustomerUidScore: window.__ANHUNGLAND_LAST_E2EE_UID__?.score || 0,
      e2eeUsesThreadKey: isE2ee && !state.customerUid,
      headerName: nameResult.name,
      nameSource: nameResult.source,
      avatarSource: avatarResult.source,
      chatMidCount: messages.length,
      e2eeMessageSource: isE2ee ? "data-message-id-aria-luc" : "",
      isE2ee,
      employeeUid: state.employeeUid,
      threadListLinks: findThreadLinksById(threadId).length,
    };

    const uidLabel = isE2ee
      ? state.customerUid
        ? `UID FB ${state.customerUid} (thread E2EE ${threadId})`
        : `thread E2EE ${threadId} — chua doc duoc UID FB (mo Chi tiet lien he / profile)`
      : `UID/thread ${state.customerUid}`;
    const msgHint = messages.length
      ? ` | ${messages.length} tin (cuon len de them tin cu)`
      : " | chua thay tin tren DOM";

    if (nameResult.name) {
      state.status = `Da quet: ${nameResult.name} (${uidLabel})${msgHint}.`;
    } else {
      state.status = `${uidLabel} — chua doc duoc ten (thu chon lai hoi thoai ben trai)${msgHint}.`;
    }
  }

  window.__ANHUNGLAND_MESSENGER_SCANNER__ = {
    scan,
    collectMessages,
    getChatScanRoot,
    getChatScroller,
  };
})();
