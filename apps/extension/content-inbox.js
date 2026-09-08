/**
 * Anhungland Extension — orchestrator (Business Suite + Messenger web)
 */
(function () {
  "use strict";

  const PANEL_ID = "anhungland-ext-panel";
  const STYLE_ID = "pages-fb-crm-inbox-style";
  const WATCH_INTERVAL_MS = 1200;
  const THREAD_LIST_TITLE_MIN_FONT_PX = 15;
  const THREAD_LIST_PREVIEW_MAX_FONT_PX = 14;
  const LEFT_NAV_MAX_X = 56;
  const THREAD_LIST_TOP_MIN = 110;
  const LEFT_LIST_MAX_X_RATIO = 0.55;
  const CHAT_MIN_X_RATIO = 0.26;
  const CHAT_MAX_X_RATIO = 0.84;
  const RIGHT_PANEL_MIN_X_RATIO = 0.58;
  const UI_VERSION = CRM_EXTENSION_UI_LABEL;
  const MESSAGE_ID_ATTR = "data-message-id";
  const MESSENGER_MID_RE = /^mid\./i;
  const MESSENGER_E2EE_MSG_ID_RE = /^\d+@msgr\./i;
  const EXPORT_CHUNK_SIZE = 2_000_000;
  const DOM_LIVE_SUMMARY_MAIN_MAX = 120_000;
  const MESSAGE_MAX_COUNT = 500;
  const MESSAGE_SCROLL_DEBOUNCE_MS = 350;
  const MESSAGE_SCROLL_LATE_MERGE_MS = 900;
  const MESSAGE_MIN_TOP = 130;
  const MESSAGE_MAX_BOTTOM_GAP = 140;

  const STATE = {
    watching: false,
    collapsed: false,
    urlPollTimer: null,
    lastScanKey: "",
    status: "San sang. Bam Bat quet de bat dau.",
    pageId: "",
    assetId: "",
    mailboxId: "",
    businessId: "",
    threadType: "",
    threadId: "",
    employeeUid: "",
    scanSource: "",
    myPageUid: "",
    customerUid: "",
    customerName: "",
    avatarUrl: "",
    chatMessages: [],
    lastMessagesKey: "",
    source: "",
    scanDebug: {
      rowName: "",
      headerName: "",
      rightName: "",
      altName: "",
      hasListRow: false,
    },
    backendBaseUrl: CRM_DEFAULT_API_URL,
    backendLoaded: false,
    backendSaving: false,
    auth: {
      token: "",
      refreshToken: "",
      user: null,
      loaded: false,
      loggingIn: false,
      status: "",
    },
    domLiveStatus:
      "Bam Quet DOM LIVE de tai file (summary + full DOM) gui dev.",
    domLiveExporting: false,
    serverSectionCollapsed: true,
    domLiveSectionCollapsed: true,
    scanInfoSectionCollapsed: true,
    messagesSectionCollapsed: false,
    messagesCopyStatus: "",
    scanInfoCopyStatus: "",
    draftSubmitting: false,
    draftStatus: "",
    /** Snapshot khách vừa quét — tự gửi BE khi chuyển sang khách khác. */
    autoDraftSnapshot: null,
  };

  function getCtx() {
    return window.__ANHUNGLAND_EXT_CONTEXT__ || window.__PAGES_FB_CRM_EXT_CONTEXT__ || null;
  }

  function getScanSource() {
    const ctx = getCtx();
    const source = ctx?.source;
    if (source) return source;
    if (ctx?.businessSuiteInbox) return "business_suite";
    if (ctx?.messengerWeb) return "messenger_standard";
    return "unknown";
  }

  function isBusinessSuiteSource() {
    return getScanSource() === "business_suite";
  }

  function isMessengerSource() {
    const source = getScanSource();
    return source === "messenger_standard" || source === "messenger_e2ee";
  }

  function isExtensionActive() {
    const ctx = getCtx();
    if (ctx?.isActivePath) return ctx.isActivePath();
    if (ctx?.isBusinessInboxPath) return ctx.isBusinessInboxPath();
    return false;
  }

  function getScanSourceLabel() {
    if (typeof window.getAnhunglandSourceLabel === "function") {
      return window.getAnhunglandSourceLabel(getScanSource());
    }
    return getScanSource();
  }

  function getMessengerScanner() {
    return window.__ANHUNGLAND_MESSENGER_SCANNER__ || null;
  }

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isEmbeddedMediaUrl(url) {
    const value = String(url || "").trim();
    return value.startsWith("data:") || value.startsWith("blob:");
  }

  function isShareableHttpMediaUrl(url) {
    const value = String(url || "").trim();
    if (!value || isEmbeddedMediaUrl(value)) return false;
    try {
      const parsed = new URL(value, window.location.href);
      return /^https?:$/i.test(parsed.protocol);
    } catch {
      return false;
    }
  }

  function formatImageUrlForCopy(url, index) {
    const value = String(url || "").trim();
    if (!value) return "";
    if (isEmbeddedMediaUrl(value)) {
      const approxKb = Math.max(1, Math.round((value.length * 3) / 4 / 1024));
      return `image_${index + 1}: [preview nhúng ~${approxKb}KB — không phải link https; dùng nút «Tải ảnh» trong panel]`;
    }
    return `image_${index + 1}: ${value}`;
  }

  function renderMessageImageHtml(messageIndex, imageIndex, url) {
    const label = `Ảnh ${imageIndex + 1}`;
    if (isEmbeddedMediaUrl(url)) {
      return `
              <div class="pf-msg-image-embedded">
                <img class="pf-msg-image-preview" alt="${escapeHtml(label)}"
                  data-role="msg-image-preview"
                  data-message-index="${messageIndex}"
                  data-image-index="${imageIndex}" />
                <button type="button" class="pf-btn ghost pf-msg-image-download"
                  data-role="download-message-image"
                  data-message-index="${messageIndex}"
                  data-image-index="${imageIndex}">${escapeHtml(`Tải ${label}`)}</button>
                <div class="pf-msg-image-note">Preview E2EE/blob — không mở tab mới bằng link https.</div>
              </div>`;
    }
    if (isShareableHttpMediaUrl(url)) {
      return `
              <a class="pf-msg-image-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    }
    return `
              <div class="pf-msg-image-note">${escapeHtml(`${label}: link không hợp lệ hoặc đã hết hạn.`)}</div>`;
  }

  function hydrateMessageImagePreviews(panel) {
    if (!(panel instanceof HTMLElement)) return;
    panel.querySelectorAll('[data-role="msg-image-preview"]').forEach((node) => {
      if (!(node instanceof HTMLImageElement)) return;
      const messageIndex = Number(node.dataset.messageIndex);
      const imageIndex = Number(node.dataset.imageIndex);
      const url = STATE.chatMessages?.[messageIndex]?.imageUrls?.[imageIndex];
      if (url) node.src = url;
    });
  }

  function downloadMessageImage(messageIndex, imageIndex) {
    const url = String(STATE.chatMessages?.[messageIndex]?.imageUrls?.[imageIndex] || "").trim();
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fb-crm-msg-${messageIndex + 1}-img-${imageIndex + 1}.jpg`;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    STATE.messagesCopyStatus = `Đã tải ảnh #${messageIndex + 1}-${imageIndex + 1}.`;
    renderPanel();
  }

  function getPageId() {
    const ctx = getCtx();
    if (ctx?.resolveAssetId) return ctx.resolveAssetId() || "";
    if (ctx?.resolvePageId) return ctx.resolvePageId() || "";
    return "";
  }

  function extractBusinessIdFromDom() {
    const html = document.documentElement?.innerHTML || "";
    const pick = (pattern) => {
      const match = html.match(pattern);
      const value = String(match?.[1] || "").trim();
      return /^\d{8,}$/.test(value) ? value : "";
    };
    return (
      pick(/"page_owner_business_id":"(\d+)"/) ||
      pick(/[?&]business_id=(\d+)/) ||
      ""
    );
  }

  function syncInboxUrlParams() {
    const ctx = getCtx();
    STATE.scanSource = getScanSource();

    if (isMessengerSource()) {
      STATE.threadId = ctx?.resolveThreadId?.() || "";
      STATE.customerUid = ctx?.resolveCustomerUid?.() || "";
      if (!STATE.customerUid && STATE.threadId && getScanSource() !== "messenger_e2ee") {
        STATE.customerUid = STATE.threadId;
      }
      const personalUid = ctx?.resolveEmployeeUid?.() || "";
      STATE.employeeUid = personalUid;
      STATE.threadType = ctx?.resolveThreadType?.() || "";
      STATE.assetId = "";
      STATE.mailboxId = "";
      STATE.businessId = "";
      STATE.pageId = "";
      STATE.myPageUid = personalUid;
      return;
    }

    STATE.threadId = "";
    STATE.assetId = ctx?.resolveAssetId?.() || "";
    STATE.mailboxId = ctx?.resolveMailboxId?.() || STATE.assetId || "";
    STATE.businessId =
      ctx?.resolveBusinessId?.() || extractBusinessIdFromDom() || "";
    STATE.threadType = ctx?.resolveThreadType?.() || "";
    STATE.customerUid = ctx?.resolveCustomerUid?.() || "";
    STATE.pageId = STATE.assetId;
    const pageUid = getMyPageUid() || "";
    STATE.employeeUid = pageUid;
    STATE.myPageUid = pageUid;
  }

  function extractMyPageUidFromDom(assetId = "") {
    const html = document.documentElement?.innerHTML || "";
    const asset = String(assetId || "").trim();
    const pick = (pattern) => {
      const match = html.match(pattern);
      const value = String(match?.[1] || "").trim();
      return /^\d{5,}$/.test(value) ? value : "";
    };

    const pageUriToken = pick(/"page_uri_token":"(\d+)"/);
    if (pageUriToken && pageUriToken !== asset) return pageUriToken;

    const profilePlus = pick(/"profile_plus_id_for_delegate_page":"(\d+)"/);
    if (profilePlus && profilePlus !== asset) return profilePlus;

    if (pageUriToken) return pageUriToken;
    if (profilePlus) return profilePlus;
    return "";
  }

  /**
   * UID Facebook của Page đang inbox → EmployeeFacebookUid trên CRM.
   * Meta thường đặt page_id === asset_id trên URL; không được bỏ page_id rồi đọc DOM
   * (page_uri_token / profile_plus thường là nick 615… — trùng nhau khi đổi Page).
   */
  function getMyPageUid() {
    const ctx = getCtx();
    const fromUrl = ctx?.resolveMyPageUid ? ctx.resolveMyPageUid() : "";
    const assetId = getPageId();

    if (fromUrl) return fromUrl;

    if (isBusinessSuiteSource() && assetId) return assetId;

    const fromDom = extractMyPageUidFromDom(assetId);
    if (fromDom) return fromDom;

    return "";
  }

  function getCustomerUid() {
    const ctx = getCtx();
    if (ctx?.resolveCustomerUid) return ctx.resolveCustomerUid() || "";
    return "";
  }

  /** Khóa quét — luôn đọc URL hiện tại, không dùng STATE (tránh stale khi đổi khách). */
  function buildScanKey() {
    const ctx = getCtx();
    if (ctx?.buildScanKey) {
      const key = ctx.buildScanKey();
      if (key) return key;
    }
    if (isMessengerSource()) {
      return getCtx()?.resolveThreadId?.() || "";
    }
    return [getPageId(), getCustomerUid()].join("::");
  }

  function handleCustomerNavigation() {
    const newKey = buildScanKey();
    const prevKey = STATE.lastScanKey;
    if (newKey === prevKey) return false;

    if (prevKey) {
      void autoSubmitDraftForPreviousCustomer(prevKey);
    }

    STATE.lastScanKey = newKey;
    scanCurrentCustomer();
    renderPanel();
    return true;
  }

  function querySelectorAllDeep(selector, root = document) {
    const results = [];
    const seen = new Set();

    function walk(node) {
      if (!node || seen.has(node)) return;
      seen.add(node);
      if (
        node instanceof Document ||
        node instanceof DocumentFragment ||
        node instanceof ShadowRoot ||
        node instanceof Element
      ) {
        try {
          node.querySelectorAll(selector).forEach((el) => {
            if (!seen.has(el)) results.push(el);
          });
        } catch (_e) {
          /* ignore */
        }
      }
      const children =
        node instanceof Document
          ? [node.documentElement].filter(Boolean)
          : node instanceof Element
            ? node.children
            : [];
      for (const child of children) {
        if (child instanceof Element && child.shadowRoot) walk(child.shadowRoot);
      }
      if (node instanceof Element || node instanceof Document) {
        const tree = node instanceof Document ? node.documentElement : node;
        if (tree) {
          tree.querySelectorAll("*").forEach((el) => {
            if (el.shadowRoot) walk(el.shadowRoot);
          });
        }
      }
    }

    walk(root);
    return results;
  }

  function isInsidePanel(node) {
    return Boolean(node?.closest?.(`#${PANEL_ID}`));
  }

  function getBusinessInboxRoot() {
    const surface = document.querySelector('[data-surface="/bizweb:inbox"]');
    if (surface instanceof HTMLElement && !isInsidePanel(surface)) {
      return surface.closest("div") || surface;
    }
    return null;
  }

  function getThreadListScope() {
    const pagelet = document.querySelector('[data-pagelet="GenericThreadListView"]');
    if (pagelet instanceof HTMLElement && !isInsidePanel(pagelet)) {
      return pagelet;
    }
    const threadDetail = document.querySelector('[data-surface*="thread_and_detail"]');
    if (threadDetail instanceof HTMLElement && !isInsidePanel(threadDetail)) {
      return threadDetail;
    }
    const mainContent = document.querySelector('[data-surface*="main_content"]');
    if (mainContent instanceof HTMLElement && !isInsidePanel(mainContent)) {
      return mainContent;
    }
    return getBusinessInboxRoot();
  }

  function getChatContentRoot() {
    const selectors = [
      '[data-pagelet*="ThreadDetail"]',
      '[data-pagelet*="MessageList"]',
      '[data-surface*="thread_detail"]',
      '[data-surface*="thread_and_detail"]',
      '[data-surface*="message_list"]',
    ];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node instanceof HTMLElement && !isInsidePanel(node)) {
        return node;
      }
    }
    const listScope = getThreadListScope();
    if (listScope?.parentElement instanceof HTMLElement) {
      return listScope.parentElement;
    }
    return getBusinessInboxRoot() || document.body;
  }

  function isMessengerMidId(value) {
    const v = String(value || "").trim();
    return MESSENGER_MID_RE.test(v) || MESSENGER_E2EE_MSG_ID_RE.test(v);
  }

  /** Thứ tự trong cây DOM (giống thứ tự HTML), không phụ thuộc vị trí màn hình khi cuộn. */
  function compareElementsByDomOrder(a, b) {
    if (a === b) return 0;
    if (!(a instanceof Element) || !(b instanceof Element)) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  }

  function getMessengerMidFromNode(node) {
    if (!(node instanceof HTMLElement)) return "";
    const direct = String(node.getAttribute(MESSAGE_ID_ATTR) || "").trim();
    if (isMessengerMidId(direct)) return direct;
    const nested = node.querySelector(`[${MESSAGE_ID_ATTR}]`);
    if (nested instanceof HTMLElement) {
      const nestedId = String(nested.getAttribute(MESSAGE_ID_ATTR) || "").trim();
      if (isMessengerMidId(nestedId)) return nestedId;
    }
    return "";
  }

  function countMessengerMidsIn(root) {
    if (!(root instanceof HTMLElement)) return 0;
    let count = 0;
    root.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).forEach((node) => {
      if (isMessengerMidId(node.getAttribute(MESSAGE_ID_ATTR))) count += 1;
    });
    return count;
  }

  /**
   * Div khung chat: vùng chứa nhiều tin `data-message-id="mid.$..."` nhất (thường là scroller).
   * Chỉ quét tin trong khung này — không quét list trái / toàn inbox.
   */
  function getChatMessagesContainer() {
    const chatRoot = getChatContentRoot();
    if (!(chatRoot instanceof HTMLElement)) return null;

    const listScope = getThreadListScope();
    let best = null;
    let bestScore = -1;

    chatRoot.querySelectorAll("div").forEach((div) => {
      if (!(div instanceof HTMLElement) || isInsidePanel(div)) return;
      if (listScope instanceof HTMLElement && listScope.contains(div)) return;

      const midCount = countMessengerMidsIn(div);
      if (midCount < 1) return;

      const rect = div.getBoundingClientRect();
      if (rect.height < 120 || rect.width < 200) return;
      if (rect.left < window.innerWidth * 0.22) return;

      const style = getComputedStyle(div);
      const scrollable = /(auto|scroll|overlay)/.test(style.overflowY);
      let score = midCount * 30 + rect.height;
      if (scrollable) score += 80;
      if (rect.left >= window.innerWidth * CHAT_MIN_X_RATIO) score += 40;

      if (score > bestScore) {
        bestScore = score;
        best = div;
      }
    });

    if (best instanceof HTMLElement) return best;

    const firstMid = chatRoot.querySelector(`[${MESSAGE_ID_ATTR}]`);
    if (firstMid instanceof HTMLElement && isMessengerMidId(firstMid.getAttribute(MESSAGE_ID_ATTR))) {
      let node = firstMid.parentElement;
      for (let depth = 0; depth < 24 && node instanceof HTMLElement; depth += 1) {
        if (listScope instanceof HTMLElement && listScope.contains(node) && node !== chatRoot) {
          node = node.parentElement;
          continue;
        }
        const midCount = countMessengerMidsIn(node);
        const rect = node.getBoundingClientRect();
        if (midCount >= 2 && rect.height >= 150 && rect.left >= window.innerWidth * 0.22) {
          return node;
        }
        node = node.parentElement;
      }
    }

    return chatRoot;
  }

  /** Vùng quét tin: cả thread detail (gồm tin chào/CTA đầu) — rộng hơn div scroller. */
  function getChatMessageScanRoot() {
    if (isMessengerSource()) {
      return getMessengerScanner()?.getChatScanRoot?.() || null;
    }
    const chatRoot = getChatContentRoot();
    const container = getChatMessagesContainer();
    if (!(chatRoot instanceof HTMLElement)) return container;
    if (!(container instanceof HTMLElement)) return chatRoot;
    const rootMids = countMessengerMidsIn(chatRoot);
    const boxMids = countMessengerMidsIn(container);
    return rootMids >= boxMids ? chatRoot : container;
  }

  function isInsideNestedMessageBubble(el, rootMsgNode) {
    if (!(el instanceof Element) || !(rootMsgNode instanceof HTMLElement)) return false;
    const owner = el.closest("[data-message-id]");
    return owner instanceof HTMLElement && owner !== rootMsgNode;
  }

  /** Rect thật của bubble (node bọc ngoài đôi khi width=0). */
  function getMessageNodeLayoutRect(node) {
    if (!(node instanceof HTMLElement)) return null;
    const self = node.getBoundingClientRect();
    if (self.width >= 12 && self.height >= 8) return self;

    for (const sel of ["span > span", "span[dir='auto']", "img"]) {
      const inner = node.querySelector(sel);
      if (inner instanceof Element) {
        const rect = inner.getBoundingClientRect();
        if (rect.width >= 12 && rect.height >= 8) return rect;
      }
    }

    const row = findClosestFlexRow(node);
    if (row instanceof HTMLElement) {
      const rect = row.getBoundingClientRect();
      if (rect.width >= 40 && rect.height >= 8) return rect;
    }

    return self.width || self.height ? self : null;
  }

  function isInChatMessageColumnHorizontal(node) {
    if (!(node instanceof Element)) return false;
    const rect = getMessageNodeLayoutRect(node instanceof HTMLElement ? node : null) || node.getBoundingClientRect();
    const minWidth = node instanceof HTMLElement && node.hasAttribute("data-message-id") ? 8 : 40;
    return (
      rect.left >= window.innerWidth * CHAT_MIN_X_RATIO &&
      rect.right <= window.innerWidth * CHAT_MAX_X_RATIO + 8 &&
      rect.width >= minWidth &&
      rect.height >= 8
    );
  }

  /** Tin nằm trong vùng quét chat (thread detail), không tính list trái. */
  function isMessageNodeInChatCollectionScope(node) {
    const scanRoot = getChatMessageScanRoot();
    const listScope = getThreadListScope();
    if (!(scanRoot instanceof HTMLElement)) return false;
    if (!scanRoot.contains(node)) return false;
    if (listScope instanceof HTMLElement && listScope.contains(node) && !scanRoot.contains(node)) {
      return false;
    }
    return isMessengerMidId(node.getAttribute(MESSAGE_ID_ATTR));
  }

  /** Ưu tiên tin đang hiển thị trong scroller (gợi ý vị trí khi merge). */
  function isMessageNodeVisibleInScroller(node) {
    if (!isMessageNodeInChatCollectionScope(node)) return false;

    const rect = node.getBoundingClientRect();
    if (!rect.width && !rect.height) return false;

    const scroller = getChatMessageScroller();
    if (scroller instanceof HTMLElement) {
      const sr = scroller.getBoundingClientRect();
      return (
        rect.bottom > sr.top + 4 &&
        rect.top < sr.bottom - 4 &&
        rect.right > sr.left + 4 &&
        rect.left < sr.right - 4
      );
    }

    return (
      rect.top >= MESSAGE_MIN_TOP &&
      rect.bottom <= window.innerHeight - MESSAGE_MAX_BOTTOM_GAP
    );
  }

  function isMessageNodeInChatArea(node) {
    return isMessageNodeInChatCollectionScope(node);
  }

  function isInChatMessageColumn(node) {
    return isMessageNodeInChatArea(node);
  }

  function parseSenderUidFromMessageId(value) {
    const raw = String(value || "").trim();
    const uidMatch = raw.match(/^(\d{8,24})@/i);
    if (uidMatch?.[1]) return uidMatch[1];
    return "";
  }

  function acceptMessageText(value) {
    const text = normalizeText(value);
    if (!text || text.length > 4000) return "";
    if (/^\d{1,2}:\d{2}(\s*(AM|PM|SA|CH|CHIEU|SANG))?$/i.test(text)) return "";
    const folded = foldForMatch(text);
    const blocked = new Set([
      "gui tin nhan",
      "nhap tin nhan",
      "aa",
      "a a",
      "enter",
      "messenger",
      "instagram",
      "whatsapp",
    ]);
    if (blocked.has(folded)) return "";
    if (folded === foldForMatch(STATE.customerName) && text.length < 48) return "";
    return text;
  }

  function isSystemMessageText(text) {
    const folded = foldForMatch(text);
    if (!folded) return true;
    if (isAiFooterMetaText(text)) return true;
    if (/goi cho .+ (da )?gui goi y goi/i.test(folded)) return true;
    if (/da gui goi y goi thoai/i.test(folded)) return true;
    if (/sent a call suggestion/i.test(folded)) return true;
    if (/goi thoai cho/i.test(folded)) return true;
    if (folded === "dinh kem" || folded === "attachment") return true;
    return false;
  }

  /** Nhãn Meta dưới bubble AI — không phải nội dung tin. */
  function isAiFooterMetaText(text) {
    const folded = foldForMatch(text || "");
    if (!folded) return false;
    return (
      /cai thien phan hoi cua ai/.test(folded) ||
      /improve ai response/.test(folded) ||
      /phan hoi cua ai/.test(folded)
    );
  }

  function rowHasAiResponseFooter(scopeRoot) {
    if (!(scopeRoot instanceof HTMLElement)) return false;
    for (const node of scopeRoot.querySelectorAll("span, div[dir='auto']")) {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) continue;
      if (isAiFooterMetaText(node.textContent)) return true;
    }
    return false;
  }

  function normalizeIconLabel(raw) {
    const text = normalizeText(raw || "");
    if (!text) return "";
    const folded = foldForMatch(text);
    const known = {
      like: "Thích",
      thích: "Thích",
      "thumbs up": "Thích",
      love: "Yêu thích",
      "yeu thich": "Yêu thích",
      haha: "Haha",
      wow: "Wow",
      sad: "Buồn",
      buon: "Buồn",
      angry: "Phẫn nộ",
      "phan no": "Phẫn nộ",
      care: "Quan tâm",
      "quan tam": "Quan tâm",
      sticker: "Sticker",
      gif: "GIF",
    };
    if (known[folded]) return known[folded];
    if (text.length <= 32 && !isAiFooterMetaText(text) && !isAdThreadIntroText(text)) {
      return text;
    }
    return "";
  }

  function extractIconSymbolLabelFromScope(scopeRoot, ownerMidNode) {
    if (!(scopeRoot instanceof HTMLElement)) return "";
    const owner =
      ownerMidNode instanceof HTMLElement ? ownerMidNode : scopeRoot;
    const labels = [];

    scopeRoot
      .querySelectorAll("[aria-label], img[alt], [role='img'][aria-label]")
      .forEach((node) => {
        if (!(node instanceof Element) || isInsidePanel(node)) return;
        const nestedMid = node.closest(`[${MESSAGE_ID_ATTR}]`);
        if (
          nestedMid instanceof HTMLElement &&
          nestedMid !== owner &&
          owner.contains(nestedMid)
        ) {
          return;
        }
        if (node.closest('[aria-hidden="true"]')) return;
        const raw = node.getAttribute("aria-label") || node.getAttribute("alt") || "";
        const icon = normalizeIconLabel(raw);
        if (icon) labels.push(icon);
      });

    if (!labels.length) {
      scopeRoot.querySelectorAll("img").forEach((img) => {
        if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return;
        if (isProfilePhotoImg(img) || isMessageAttachmentImage(img)) return;
        const nestedMid = img.closest(`[${MESSAGE_ID_ATTR}]`);
        if (
          nestedMid instanceof HTMLElement &&
          nestedMid !== owner &&
          owner.contains(nestedMid)
        ) {
          return;
        }
        const rect = img.getBoundingClientRect();
        if (rect.width < 32 || rect.height < 32 || rect.width > 220 || rect.height > 220) {
          return;
        }
        const ariaIcon = normalizeIconLabel(
          img.getAttribute("aria-label") || img.getAttribute("alt") || "",
        );
        if (ariaIcon) {
          labels.push(ariaIcon);
          return;
        }
        const src = String(img.currentSrc || img.src || "");
        if (/emoji\.php|sticker|rsrc\.php/i.test(src)) {
          labels.push("Thích");
        }
      });
    }

    if (!labels.length) {
      scopeRoot.querySelectorAll("svg").forEach((svg) => {
        if (!(svg instanceof SVGElement) || isInsidePanel(svg)) return;
        const rect = svg.getBoundingClientRect();
        if (rect.width < 32 || rect.height < 32) return;
        const ariaIcon = normalizeIconLabel(svg.getAttribute("aria-label") || "");
        if (ariaIcon) labels.push(ariaIcon);
      });
    }

    const unique = [...new Set(labels)];
    return unique[0] ? `[${unique[0]}]` : "";
  }

  function extractAriaDescriptionFromBubble(root) {
    if (!(root instanceof Element)) return "";
    const labels = [];
    root.querySelectorAll("[aria-label], img[alt], video[aria-label]").forEach((node) => {
      if (!(node instanceof Element) || isInsidePanel(node)) return;
      if (node.closest('[aria-hidden="true"]')) return;
      const raw = node.getAttribute("aria-label") || node.getAttribute("alt") || "";
      const text = acceptMessageText(raw);
      if (!text || isSystemMessageText(text)) return;
      const folded = foldForMatch(text);
      if (/^(anh|image|photo|video|sticker|gif|file|tap de)/i.test(folded) && text.length < 24) {
        return;
      }
      labels.push(text);
    });
    return normalizeText([...new Set(labels)].join(" · "));
  }

  function extractBusinessSuiteMessageTextPartsInScope(scopeRoot, ownerMidNode) {
    if (!(scopeRoot instanceof HTMLElement)) return [];
    const owner =
      ownerMidNode instanceof HTMLElement ? ownerMidNode : scopeRoot;
    const items = [];
    const spanNodes = [
      ...scopeRoot.querySelectorAll("span > span"),
      ...scopeRoot.querySelectorAll("span[dir='auto']"),
      ...scopeRoot.querySelectorAll("span"),
    ];

    spanNodes.forEach((span) => {
      if (!(span instanceof HTMLElement) || isInsidePanel(span)) return;
      const nestedMid = span.closest(`[${MESSAGE_ID_ATTR}]`);
      if (
        nestedMid instanceof HTMLElement &&
        nestedMid !== owner &&
        owner.contains(nestedMid)
      ) {
        return;
      }
      if (span.closest('[aria-hidden="true"]')) return;
      if (span.closest('button, [role="button"], [role="menuitem"]')) return;
      const innerSpan = span.querySelector(":scope > span");
      if (innerSpan instanceof HTMLElement && innerSpan !== span) return;
      const text = acceptMessageText(span.textContent);
      if (!text || isSystemMessageText(text) || isAiFooterMetaText(text)) return;
      const rect = span.getBoundingClientRect();
      items.push({ text, top: rect.top, left: rect.left });
    });

    items.sort((a, b) => a.top - b.top || a.left - b.left);
    const unique = [];
    const seen = new Set();
    for (const item of items) {
      if (seen.has(item.text)) continue;
      seen.add(item.text);
      unique.push(item.text);
    }
    return unique;
  }

  function extractBusinessSuiteMessageTextParts(msgNode) {
    if (!(msgNode instanceof HTMLElement)) return [];
    const row = findClosestFlexRow(msgNode);
    const scope =
      row instanceof HTMLElement && row.contains(msgNode) ? row : msgNode;
    return extractBusinessSuiteMessageTextPartsInScope(scope, msgNode);
  }

  function extractImageUrlsFromScope(scopeRoot, ownerMidNode) {
    if (!(scopeRoot instanceof HTMLElement)) return [];
    const owner =
      ownerMidNode instanceof HTMLElement ? ownerMidNode : scopeRoot;
    const urls = [];
    const seen = new Set();
    const addUrl = (raw) => {
      const src = normalizeMessageImageUrl(raw);
      if (!src || seen.has(src)) return;
      seen.add(src);
      urls.push(src);
    };

    scopeRoot.querySelectorAll("img").forEach((img) => {
      const nestedMid = img.closest(`[${MESSAGE_ID_ATTR}]`);
      if (
        nestedMid instanceof HTMLElement &&
        nestedMid !== owner &&
        owner.contains(nestedMid)
      ) {
        return;
      }
      if (!isMessageAttachmentImage(img)) return;
      addUrl(img.currentSrc || img.src || img.getAttribute("data-src"));
    });
    return urls;
  }

  function extractBusinessSuiteMessageText(msgNode) {
    const parts = extractBusinessSuiteMessageTextParts(msgNode);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    return normalizeText(parts.join("\n"));
  }

  function extractVisibleTextFromElement(root) {
    if (!(root instanceof Element)) return "";
    const parts = [];
    root.querySelectorAll('span[dir="auto"], div[dir="auto"]').forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      if (node.closest('[aria-hidden="true"]')) return;
      if (node.closest('button, [role="button"], [role="menuitem"]')) return;
      if (node.querySelector('span[dir="auto"], div[dir="auto"]')) return;
      const text = acceptMessageText(node.textContent);
      if (!text || isSystemMessageText(text)) return;
      parts.push(text);
    });

    const unique = [...new Set(parts)];
    if (unique.length) {
      unique.sort((a, b) => b.length - a.length);
      return normalizeText(unique[0]);
    }

    return "";
  }

  function extractAttachmentLabelFromBubble(root) {
    if (!(root instanceof Element)) return "";
    const aria = extractAriaDescriptionFromBubble(root);
    if (aria) return aria;

    const hasMedia = root.querySelector(
      'img:not([height="32"]):not([width="32"]), video, [role="img"]',
    );
    if (!hasMedia) return "";

    return "[Đính kèm]";
  }

  function normalizeMessageImageUrl(raw) {
    const value = String(raw || "").trim();
    if (!value || value.startsWith("data:") || value.startsWith("blob:")) return "";
    try {
      const url = new URL(value, window.location.href);
      if (!/^https?:$/i.test(url.protocol)) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function isMessageAttachmentImage(img) {
    if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return false;
    const src = normalizeMessageImageUrl(img.currentSrc || img.src || img.getAttribute("data-src"));
    if (!src) return false;
    if (/emoji\.php|\/rsrc\.php\//i.test(src)) return false;

    const rect = img.getBoundingClientRect();
    if (rect.width >= 64 || rect.height >= 64) return true;
    if (isProfilePhotoImg(img)) return false;
    return rect.width >= 48 && rect.height >= 48;
  }

  function extractImageUrlsFromMessageNode(msgNode) {
    if (!(msgNode instanceof HTMLElement)) return [];
    const row = findClosestFlexRow(msgNode);
    const scope =
      row instanceof HTMLElement && row.contains(msgNode) ? row : msgNode;
    const urls = extractImageUrlsFromScope(scope, msgNode);
    if (urls.length) return urls;

    const seen = new Set(urls);
    const addUrl = (raw) => {
      const src = normalizeMessageImageUrl(raw);
      if (!src || seen.has(src)) return;
      seen.add(src);
      urls.push(src);
    };
    msgNode.querySelectorAll("a[href]").forEach((anchor) => {
      if (isInsideNestedMessageBubble(anchor, msgNode)) return;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.href || "";
      if (!/fbcdn\.net|scontent\./i.test(href)) return;
      if (!/\.(jpg|jpeg|png|webp|gif)(\?|$)|stp=/i.test(href)) return;
      addUrl(href);
    });
    return urls;
  }

  function mergeMessageImageUrls(prev = [], incoming = []) {
    const merged = [...(prev || [])];
    const seen = new Set(merged);
    for (const url of incoming || []) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      merged.push(url);
    }
    return merged;
  }

  function extractMessageTextFromBubble(msgNode) {
    if (!(msgNode instanceof HTMLElement)) return "";

    let text = extractBusinessSuiteMessageText(msgNode);
    if (!text) text = extractVisibleTextFromElement(msgNode);
    if (!text) {
      const imageUrls = extractImageUrlsFromMessageNode(msgNode);
      if (imageUrls.length) return "";
      text = extractAttachmentLabelFromBubble(msgNode);
    }
    if (!text || isSystemMessageText(text)) return "";
    if (text === "[Đính kèm]" && extractImageUrlsFromMessageNode(msgNode).length) return "";
    return text;
  }

  function collectMessageStyleFlags(msgNode) {
    const flags = {
      hasEth: false,
      hasLti: false,
      hasK16: false,
      hasKzq: false,
    };
    const visit = (node) => {
      if (!(node instanceof Element)) return;
      const className = String(node.className || "");
      if (!className) return;
      if (/\bxetholh\b/.test(className)) flags.hasEth = true;
      if (/\bxltidu3\b/.test(className)) flags.hasLti = true;
      if (/\bx16k5g9a\b/.test(className)) flags.hasK16 = true;
      if (/\bxzqok8k\b/.test(className)) flags.hasKzq = true;
    };
    visit(msgNode);
    msgNode.querySelectorAll("div, span").forEach((node) => visit(node));
    return flags;
  }

  function resolveSenderByChatPosition(msgNode) {
    const rect = msgNode.getBoundingClientRect();
    const scope = getChatMessageScroller() || getChatContentRoot();
    const scopeRect =
      scope instanceof Element
        ? scope.getBoundingClientRect()
        : {
            left: window.innerWidth * CHAT_MIN_X_RATIO,
            width: window.innerWidth * (CHAT_MAX_X_RATIO - CHAT_MIN_X_RATIO),
          };
    if (!scopeRect.width) return "unknown";

    const centerX = rect.left + rect.width / 2;
    const ratio = (centerX - scopeRect.left) / scopeRect.width;
    if (ratio < 0.44) return "customer";
    if (ratio > 0.56) return "page";
    return "unknown";
  }

  function resolveMessageSenderRole(msgNode, senderUid) {
    const customerUid = String(STATE.customerUid || "").trim();
    const pageIds = new Set(
      [STATE.assetId, STATE.myPageUid, STATE.pageId].filter(Boolean).map(String),
    );
    if (senderUid && customerUid && senderUid === customerUid) return "customer";
    if (senderUid && pageIds.has(senderUid)) return "page";

    const flags = collectMessageStyleFlags(msgNode);
    if (flags.hasEth && !flags.hasLti) return "customer";
    if (flags.hasLti && !flags.hasEth) return "page";
    if (flags.hasEth && flags.hasLti) {
      if (flags.hasK16 && !flags.hasKzq) return "customer";
      if (flags.hasKzq && !flags.hasK16) return "page";
      const byPos = resolveSenderByChatPosition(msgNode);
      if (byPos !== "unknown") return byPos;
    }

    const byPos = resolveSenderByChatPosition(msgNode);
    if (byPos !== "unknown") return byPos;
    return "unknown";
  }


  function findClosestFlexRow(node) {
    if (!(node instanceof Element)) return null;
    let current = node instanceof HTMLElement ? node : null;
    for (let depth = 0; depth < 18 && current; depth += 1) {
      const style = getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      if (/(flex|grid)/.test(style.display) && rect.height >= 20 && rect.width >= 80) {
        return current;
      }
      if (current.getAttribute('role') === 'row') return current;
      current = current.parentElement;
    }
    const row = node.closest('[role="row"]');
    return row instanceof HTMLElement ? row : null;
  }

  function elementHasClass(el, className) {
    if (!(el instanceof Element)) return false;
    return String(el.className || '').split(/\s+/).includes(className);
  }

  function inferSenderFromRowStructure(node) {
    if (!(node instanceof Element)) return '';
    const row = findClosestFlexRow(node);
    if (!(row instanceof HTMLElement)) return '';
    if (elementHasClass(row, 'x13a6bvl') || row.querySelector('.x13a6bvl')) return 'page';
    if (elementHasClass(row, 'x1cy8zhl') || row.closest('.x1cy8zhl')) return 'customer';
    return resolveSenderByChatPosition(node instanceof HTMLElement ? node : row);
  }

  function isAdThreadIntroText(text) {
    const folded = foldForMatch(text || '');
    if (!folded) return true;
    return /da tra loi mot quang cao|replied to an ad|replied to your ad/i.test(folded);
  }

  function messageNodeHasExclusiveContent(msgNode) {
    if (!(msgNode instanceof HTMLElement)) return false;
    if (extractImageUrlsFromMessageNode(msgNode).length) return true;
    if (extractBusinessSuiteMessageTextParts(msgNode).length) return true;
    return !!extractMessageTextFromBubble(msgNode);
  }

  function collectOrphanBubbleMessages(scanRoot) {
    if (!(scanRoot instanceof HTMLElement)) return [];
    const listScope = getThreadListScope();
    const records = [];
    const seen = new Set();

    scanRoot.querySelectorAll('span > span').forEach((span) => {
      if (!(span instanceof HTMLElement) || isInsidePanel(span)) return;
      const text = acceptMessageText(span.textContent);
      if (!text || isSystemMessageText(text) || isAdThreadIntroText(text)) return;

      const row = findClosestFlexRow(span);
      if (!(row instanceof HTMLElement) || !scanRoot.contains(row)) return;
      if (listScope instanceof HTMLElement && listScope.contains(row)) return;

      const top = Math.round(span.getBoundingClientRect().top);
      const folded = foldForMatch(text);
      const rowKey = `${top}::${folded}`;
      if (seen.has(rowKey)) return;

      const midNode =
        row.querySelector(`[${MESSAGE_ID_ATTR}]`) || row.closest(`[${MESSAGE_ID_ATTR}]`);
      const midId = midNode instanceof HTMLElement ? getMessengerMidFromNode(midNode) : '';
      if (midId) {
        const parts = extractBusinessSuiteMessageTextPartsInScope(row, midNode);
        if (parts.includes(text)) return;
      }

      seen.add(rowKey);
      let sender = inferSenderFromRowStructure(span);
      if (!sender || sender === 'unknown') sender = resolveSenderByChatPosition(span);

      records.push({
        id: midId || '',
        text,
        imageUrls: extractImageUrlsFromScope(row, midNode || row),
        sender: sender || 'unknown',
        senderUid: '',
        dedupeKey: midId ? `mid:${midId}` : `orphan::${top}::${folded.slice(0, 100)}`,
        top,
        anchor: span,
      });
    });

    return records;
  }

  function collectIconOnlyBubbleEntries(scanRoot) {
    if (!(scanRoot instanceof HTMLElement)) return [];
    const entries = [];
    const seen = new Set();

    scanRoot.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).forEach((midNode) => {
      if (!(midNode instanceof HTMLElement) || isInsidePanel(midNode)) return;
      if (!isMessengerMidId(midNode.getAttribute(MESSAGE_ID_ATTR))) return;
      const midId = getMessengerMidFromNode(midNode);
      if (!midId || seen.has(midId)) return;

      const row = findClosestFlexRow(midNode);
      const scope = row instanceof HTMLElement ? row : midNode;
      const textParts = extractBusinessSuiteMessageTextPartsInScope(scope, midNode).filter(
        (part) => !isAiFooterMetaText(part),
      );
      if (textParts.length) return;

      const iconLabel = extractIconSymbolLabelFromScope(scope, midNode);
      if (!iconLabel) return;

      seen.add(midId);
      entries.push({
        anchor: midNode,
        record: {
          id: midId,
          text: iconLabel,
          imageUrls: [],
          sender: resolveMessageSenderRole(midNode, '', iconLabel),
          senderUid: '',
          dedupeKey: `mid:${midId}`,
          top: midNode.getBoundingClientRect().top,
        },
      });
    });

    return entries;
  }

  function buildMessageRecords(msgNode) {
    if (!(msgNode instanceof HTMLElement) || isInsidePanel(msgNode)) return [];
    if (!isMessageNodeInChatCollectionScope(msgNode)) return [];
    if (!messageNodeHasExclusiveContent(msgNode)) return [];

    const row = findClosestFlexRow(msgNode);
    const scope = row instanceof HTMLElement && row.contains(msgNode) ? row : msgNode;
    const messageId = getMessengerMidFromNode(msgNode);
    let imageUrls = extractImageUrlsFromMessageNode(msgNode);
    const textParts = extractBusinessSuiteMessageTextParts(msgNode).filter(
      (part) => !isAiFooterMetaText(part),
    );
    let text = '';
    if (textParts.length === 1) {
      text = textParts[0];
    } else if (textParts.length > 1) {
      const shortParts = textParts.filter((part) => part.length <= 120);
      text = shortParts.length === 1 ? shortParts[0] : normalizeText(textParts.join('\n'));
    } else {
      text = extractMessageTextFromBubble(msgNode);
    }

    if (!text) text = extractIconSymbolLabelFromScope(scope, msgNode);
    if (text && rowHasAiResponseFooter(scope) && !/^\[AI\]/i.test(text)) {
      text = `[AI] ${text}`;
    }

    if (!text && !imageUrls.length) return [];

    const senderUid = parseSenderUidFromMessageId(messageId);
    const sender = resolveMessageSenderRole(msgNode, senderUid);
    const rect = msgNode.getBoundingClientRect();
    return [
      {
        id: messageId || '',
        text,
        imageUrls,
        sender,
        senderUid,
        dedupeKey: messageId ? `mid:${messageId}` : `no-mid::${sender}::${text || '[img]'}`,
        top: rect.top,
        anchor: msgNode,
      },
    ];
  }

  function buildMessageRecord(msgNode) {
    const records = buildMessageRecords(msgNode);
    return records[0] || null;
  }

  function messageDedupeKey(msg) {
    return msg?.dedupeKey || `${msg?.id || "no-id"}::${msg?.sender}::${msg?.text}`;
  }

  /** Chống trùng theo data-message-id (mid.* hoặc E2EE uid@msgr.*). */
  function messageStorageKey(msg) {
    const id = String(msg?.id || "").trim();
    if (isMessengerMidId(id)) return `mid:${id}`;
    return messageDedupeKey(msg);
  }

  function shouldPreferIncomingMessage(prev, incoming) {
    if (!prev) return true;
    const prevImages = prev.imageUrls?.length || 0;
    const nextImages = incoming.imageUrls?.length || 0;
    if (nextImages > prevImages) return true;
    if (!incoming?.text) return false;
    if (prev.text === "[Đính kèm]" && incoming.text !== "[Đính kèm]") return true;
    if (incoming.text === "[Đính kèm]" && prev.text !== "[Đính kèm]") return false;
    if (isSystemMessageText(prev.text) && !isSystemMessageText(incoming.text)) return true;
    return incoming.text.length > (prev.text || "").length;
  }

  let chatScrollBound = null;
  let chatScrollHandler = null;
  let chatScrollDebounceTimer = null;
  let chatMutationObserver = null;

  function unbindChatScrollWatcher() {
    if (chatScrollBound && chatScrollHandler) {
      chatScrollBound.removeEventListener("scroll", chatScrollHandler);
    }
    chatScrollBound = null;
    chatScrollHandler = null;
    if (chatScrollDebounceTimer) {
      clearTimeout(chatScrollDebounceTimer);
      chatScrollDebounceTimer = null;
    }
    if (chatMutationObserver) {
      chatMutationObserver.disconnect();
      chatMutationObserver = null;
    }
  }

  function rescanChatMessagesInChatFrame(options = {}) {
    if (!hasAuthToken()) return 0;
    if (buildScanKey() !== STATE.lastMessagesKey) return 0;
    return mergeChatMessagesIntoState({ render: true, ...options });
  }

  function scheduleChatMessagesMerge() {
    if (buildScanKey() !== STATE.lastMessagesKey) return;
    if (chatScrollDebounceTimer) clearTimeout(chatScrollDebounceTimer);
    chatScrollDebounceTimer = window.setTimeout(() => {
      chatScrollDebounceTimer = null;
      if (buildScanKey() !== STATE.lastMessagesKey) return;
      rescanChatMessagesInChatFrame();
      window.setTimeout(() => {
        if (buildScanKey() === STATE.lastMessagesKey) rescanChatMessagesInChatFrame();
      }, MESSAGE_SCROLL_LATE_MERGE_MS);
    }, MESSAGE_SCROLL_DEBOUNCE_MS);
  }

  function bindChatScrollWatcher() {
    unbindChatScrollWatcher();
    const scroller = getChatMessageScroller();
    if (!(scroller instanceof HTMLElement)) return;

    chatScrollHandler = () => scheduleChatMessagesMerge();
    scroller.addEventListener("scroll", chatScrollHandler, { passive: true });
    chatScrollBound = scroller;

    chatMutationObserver = new MutationObserver(() => scheduleChatMessagesMerge());
    chatMutationObserver.observe(scroller, { childList: true, subtree: true });
  }

  function mergeChatMessagesIntoState(options = {}) {
    const { render = false } = options;
    const incoming = collectChatMessagesFromDom();
    const existing = new Map(
      STATE.chatMessages.map((msg) => [messageStorageKey(msg), msg]),
    );

    if (getScanSource() === "messenger_e2ee") {
      const hasStableMessageIds = incoming.some((msg) => isMessengerMidId(msg?.id));
      const hasE2eeAria = incoming.some((msg) =>
        String(msg?.dedupeKey || "").startsWith("e2ee-aria::"),
      );
      if (hasStableMessageIds || hasE2eeAria) {
        for (const [key, msg] of [...existing.entries()]) {
          const dedupe = String(msg?.dedupeKey || "");
          const legacyBubble =
            dedupe.startsWith("bubble::") ||
            dedupe.startsWith("orphan::") ||
            dedupe.startsWith("e2ee-bubble::");
          const legacyAria =
            hasStableMessageIds && dedupe.startsWith("e2ee-aria::");
          if (legacyBubble || legacyAria) {
            existing.delete(key);
          }
        }
      }
    }

    let changed = 0;

    for (const msg of incoming) {
      const key = messageStorageKey(msg);
      const prev = existing.get(key);
      if (!prev) {
        existing.set(key, msg);
        changed += 1;
        continue;
      }
      const senderImproved =
        prev.sender !== msg.sender &&
        msg.sender !== "unknown" &&
        (prev.sender === "unknown" || prev.sender !== msg.sender);
      const mergedImages = mergeMessageImageUrls(prev.imageUrls, msg.imageUrls);
      const imagesImproved = mergedImages.length > (prev.imageUrls?.length || 0);
      if (shouldPreferIncomingMessage(prev, msg) || senderImproved || imagesImproved) {
        existing.set(key, {
          ...prev,
          ...msg,
          text: msg.text || prev.text,
          imageUrls: mergedImages,
        });
        changed += 1;
      }
    }

    const merged = Array.from(existing.values()).sort((a, b) => {
      if (Number.isFinite(a.domOrder) && Number.isFinite(b.domOrder)) {
        return a.domOrder - b.domOrder;
      }
      return (a.top ?? 0) - (b.top ?? 0);
    });
    STATE.chatMessages = merged.slice(0, MESSAGE_MAX_COUNT);

    const uidFilled = tryFillE2eeCustomerUidFromMessages();
    if (changed > 0 || uidFilled) captureAutoDraftSnapshot();
    if (render && (changed > 0 || uidFilled)) renderPanel();
    return changed;
  }

  function findChatMessageNodes() {
    const scanRoot = getChatMessageScanRoot();
    if (!(scanRoot instanceof HTMLElement)) return [];

    const found = [];
    const seen = new Set();
    scanRoot.querySelectorAll(`[${MESSAGE_ID_ATTR}]`).forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      if (!isMessengerMidId(node.getAttribute(MESSAGE_ID_ATTR))) return;
      if (!isMessageNodeInChatCollectionScope(node)) return;
      if (!messageNodeHasExclusiveContent(node)) return;
      const nested = [...node.querySelectorAll(`[${MESSAGE_ID_ATTR}]`)].filter(
        (child) =>
          child instanceof HTMLElement &&
          child !== node &&
          isMessengerMidId(child.getAttribute(MESSAGE_ID_ATTR)) &&
          messageNodeHasExclusiveContent(child),
      );
      if (nested.some((child) => child.contains(node))) return;
      if (seen.has(node)) return;
      seen.add(node);
      found.push(node);
    });
    return found;
  }

  function getChatMessageScroller() {
    if (isMessengerSource()) {
      return getMessengerScanner()?.getChatScroller?.() || null;
    }
    const chatRoot = getChatContentRoot();
    if (!(chatRoot instanceof HTMLElement)) return null;

    let best = null;
    let bestScore = -1;
    chatRoot.querySelectorAll("div").forEach((div) => {
      if (!(div instanceof HTMLElement) || isInsidePanel(div)) return;
      const style = getComputedStyle(div);
      if (!/(auto|scroll|overlay)/.test(style.overflowY)) return;
      const rect = div.getBoundingClientRect();
      if (rect.height < 180 || rect.width < 220) return;
      if (!isInChatMessageColumnHorizontal(div)) return;
      const msgCount = div.querySelectorAll("[data-message-id]").length;
      let score = msgCount * 10 + rect.height;
      if (msgCount === 0) score -= 50;
      if (score > bestScore) {
        bestScore = score;
        best = div;
      }
    });
    return best;
  }

  function collectChatMessagesFromDom() {
    if (isMessengerSource()) {
      return getMessengerScanner()?.collectMessages?.(MESSAGE_MAX_COUNT, STATE.customerName || "") || [];
    }

    const entries = [];

    const pushEntry = (record, anchor) => {
      if (!record) return;
      entries.push({
        record: {
          id: record.id,
          text: record.text,
          imageUrls: record.imageUrls || [],
          sender: record.sender,
          senderUid: record.senderUid,
          dedupeKey: record.dedupeKey,
          top: record.top,
        },
        anchor: anchor || record.anchor || null,
      });
    };

    findChatMessageNodes().forEach((node) => {
      buildMessageRecords(node).forEach((record) => pushEntry(record, node));
    });

    const scanRoot = getChatMessageScanRoot();
    if (scanRoot instanceof HTMLElement) {
      collectOrphanBubbleMessages(scanRoot).forEach((record) => pushEntry(record, record.anchor));
      collectIconOnlyBubbleEntries(scanRoot).forEach(({ record, anchor }) =>
        pushEntry(record, anchor),
      );
    }

    entries.sort((a, b) => {
      const anchorA = a.anchor instanceof Element ? a.anchor : null;
      const anchorB = b.anchor instanceof Element ? b.anchor : null;
      if (anchorA && anchorB) {
        const domCmp = compareElementsByDomOrder(anchorA, anchorB);
        if (domCmp !== 0) return domCmp;
      }
      return (a.record.top ?? 0) - (b.record.top ?? 0);
    });

    const byKey = new Map();
    const ordered = [];
    for (const entry of entries) {
      const key = messageStorageKey(entry.record);
      if (byKey.has(key)) continue;
      if (ordered.length >= MESSAGE_MAX_COUNT) break;
      byKey.set(key, true);
      ordered.push({ ...entry.record, domOrder: ordered.length });
    }

    if (ordered.length) return ordered;

    const legacyByKey = new Map();
    const legacyOrdered = [];

    const pushRecord = (record) => {
      const key = messageStorageKey(record);
      if (!record || legacyByKey.has(key)) return;
      if (legacyOrdered.length >= MESSAGE_MAX_COUNT) return;
      legacyByKey.set(key, true);
      legacyOrdered.push({
        id: record.id,
        text: record.text,
        imageUrls: record.imageUrls || [],
        sender: record.sender,
        senderUid: record.senderUid,
        dedupeKey: record.dedupeKey,
        top: record.top,
      });
    };

    if (!ordered.length) {
      const chatRoot = getChatContentRoot();
      if (chatRoot instanceof HTMLElement) {
        chatRoot
          .querySelectorAll('[data-surface*="message"], [data-surface*="Message"]')
          .forEach((surface) => {
            if (!(surface instanceof HTMLElement) || isInsidePanel(surface)) return;
            if (!isMessageNodeInChatArea(surface)) return;
            const text = extractMessageTextFromBubble(surface);
            if (!text) return;
            const rect = surface.getBoundingClientRect();
            const sender =
              rect.left + rect.width / 2 <
              window.innerWidth * ((CHAT_MIN_X_RATIO + CHAT_MAX_X_RATIO) / 2)
                ? "customer"
                : "page";
            const imageUrls = extractImageUrlsFromMessageNode(surface);
            pushRecord({
              id: "",
              text,
              imageUrls,
              sender,
              senderUid: "",
              dedupeKey: `${sender}::${text || "[img]"}::${imageUrls.join("|")}`,
              top: rect.top,
            });
          });
      }
    }

    return ordered;
  }

  /** Messenger E2EE có thể chưa có UID FB — vẫn theo threadId. Business Suite cần selected_item_id. */
  function canTrackChatMessages() {
    if (isMessengerSource()) {
      return Boolean(normalizeText(STATE.threadId || buildScanKey()));
    }
    return Boolean(normalizeText(STATE.customerUid));
  }

  function refreshChatMessagesForCurrentThread() {
    const key = buildScanKey();
    if (!canTrackChatMessages()) {
      STATE.chatMessages = [];
      STATE.lastMessagesKey = "";
      unbindChatScrollWatcher();
      return;
    }

    if (key !== STATE.lastMessagesKey) {
      STATE.chatMessages = [];
      STATE.lastMessagesKey = key;
      bindChatScrollWatcher();
    } else if (!chatScrollBound) {
      bindChatScrollWatcher();
    }

    mergeChatMessagesIntoState({ render: false });
  }

  function isInThreadListColumn(node) {
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    return (
      rect.left >= LEFT_NAV_MAX_X &&
      rect.left < window.innerWidth * LEFT_LIST_MAX_X_RATIO &&
      rect.top >= THREAD_LIST_TOP_MIN &&
      rect.width > 40 &&
      rect.height > 20
    );
  }

  function isChannelTabInboxLink(link) {
    if (!(link instanceof HTMLAnchorElement)) return true;
    const rect = link.getBoundingClientRect();
    if (rect.top < 100) return true;
    const href = link.getAttribute("href") || "";
    const surface = link.closest("[data-surface]")?.getAttribute("data-surface") || "";
    if (surface.includes("channel_selector")) return true;
    const label = foldForMatch(link.getAttribute("aria-label") || "");
    const channelLabels = [
      "tat ca tin nhan",
      "messenger",
      "instagram",
      "whatsapp",
      "binh luan tren facebook",
      "binh luan tren instagram",
    ];
    if (channelLabels.some((w) => label === w || label.startsWith(`${w} `))) {
      return true;
    }
    return false;
  }

  function climbToThreadListRow(node) {
    let current = node instanceof Element ? node : null;
    for (let depth = 0; depth < 14 && current; depth += 1) {
      if (!(current instanceof HTMLElement)) break;
      if (current.getAttribute("role") === "row") return current;
      const rect = current.getBoundingClientRect();
      if (
        rect.height >= 52 &&
        rect.width >= 120 &&
        (current.querySelector('img[src*="fbcdn"]') ||
          current.querySelector('span[dir="auto"]'))
      ) {
        return current;
      }
      current = current.parentElement;
    }
    const closest = node?.closest?.('a[role="row"], [role="row"]');
    return closest instanceof HTMLElement ? closest : null;
  }

  function collectThreadListRows() {
    const scope = getThreadListScope() || document;
    return Array.from(scope.querySelectorAll('a[role="row"], [role="row"]')).filter(
      (row) => {
        if (!(row instanceof HTMLElement) || isInsidePanel(row)) return false;
        if (!isInThreadListColumn(row)) return false;
        const href = row.getAttribute("href") || "";
        if (href === "#" && row.getBoundingClientRect().height < 44) return false;
        return true;
      },
    );
  }

  function findThreadListLinkByUid(uid) {
    if (!uid) return null;
    const scopes = [getThreadListScope(), document].filter(Boolean);
    for (const scope of scopes) {
      const links = scope.querySelectorAll(`a[href*="selected_item_id=${uid}"]`);
      for (const link of links) {
        if (!(link instanceof HTMLAnchorElement) || isInsidePanel(link)) continue;
        if (isChannelTabInboxLink(link)) continue;
        if (!isInThreadListColumn(link)) continue;
        return link;
      }
    }
    return null;
  }

  function getAutoSpanFontPx(span) {
    if (!(span instanceof HTMLElement)) return 0;
    const style = span.getAttribute("style") || "";
    const varMatch = style.match(/--x-fontSize:\s*(\d+(?:\.\d+)?)px/i);
    if (varMatch) return Number(varMatch[1]) || 0;
    const px = parseFloat(getComputedStyle(span).fontSize || "0");
    return Number.isFinite(px) ? px : 0;
  }

  function hasPersonNameLetters(text) {
    const util = window.__ANHUNGLAND_PERSON_NAME__;
    if (util?.hasPersonNameLetters) return util.hasPersonNameLetters(text);
    return /[A-Za-z\u00C0-\u1EF9\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(text || "");
  }

  function minPersonNameLength(text) {
    const util = window.__ANHUNGLAND_PERSON_NAME__;
    if (util?.minPersonNameLength) return util.minPersonNameLength(text);
    return 4;
  }

  function acceptThreadListTitleText(value) {
    const text = normalizeText(value);
    if (!text || text.length > 120) return "";
    if (!hasPersonNameLetters(text)) return "";
    if (/^[\d\s:./·•,\-]+$/.test(text)) return "";
    const folded = text.toLowerCase();
    if (/^\d{1,2}:\d{2}$/.test(text)) return "";
    if (
      [
        "hom nay",
        "hom qua",
        "tat ca tin nhan",
        "messenger",
        "instagram",
        "whatsapp",
        "hoi thoai",
        "chi tiet lien he",
        "facebook",
      ].some((w) => folded === w || folded.startsWith(`${w} `))
    ) {
      return "";
    }
    return text;
  }

  function collectThreadListTitleLeaves(scope) {
    if (!(scope instanceof HTMLElement)) return [];
    const items = [];
    const push = (node, text, fontPx) => {
      const clean = acceptThreadListTitleText(text);
      if (!clean) return;
      const rect = node.getBoundingClientRect();
      items.push({ text: clean, fontPx, rect });
    };

    scope.querySelectorAll("span.xlyipyv.xuxw1ft, span.xuxw1ft").forEach((node) => {
      if (!(node instanceof HTMLElement) || node.closest("abbr")) return;
      push(node, node.textContent, getAutoSpanFontPx(node.closest('span[dir="auto"]') || node));
    });

    if (!items.length) {
      scope.querySelectorAll('span[dir="auto"]').forEach((autoSpan) => {
        if (!(autoSpan instanceof HTMLElement) || autoSpan.closest("abbr")) return;
        push(autoSpan, autoSpan.textContent, getAutoSpanFontPx(autoSpan));
      });
    }

    return items.sort((a, b) => a.rect.top - b.rect.top || b.fontPx - a.fontPx);
  }

  function extractThreadListTitleFromScope(scope) {
    const leaves = collectThreadListTitleLeaves(scope);
    for (const leaf of leaves) {
      if (leaf.fontPx > 0 && leaf.fontPx < THREAD_LIST_TITLE_MIN_FONT_PX) continue;
      if (leaf.fontPx > 0 && leaf.fontPx <= THREAD_LIST_PREVIEW_MAX_FONT_PX) continue;
      return leaf.text;
    }
    for (const leaf of leaves) {
      if (leaf.fontPx > 0 && leaf.fontPx <= THREAD_LIST_PREVIEW_MAX_FONT_PX) continue;
      return leaf.text;
    }
    return leaves[0]?.text || "";
  }

  function findSelectedListRow(hintName = "") {
    const uid = getCustomerUid();
    const byName = findThreadRowByCustomerName(hintName);
    if (byName?.row) return byName.row;

    const listLink = findThreadListLinkByUid(uid);
    if (listLink) {
      const fromLink = climbToThreadListRow(listLink);
      if (fromLink) return fromLink;
    }

    const bySelected = findThreadRowBySelectedState();
    if (bySelected?.row) return bySelected.row;

    const rows = collectThreadListRows();
    const normalizedHint = foldForMatch(hintName);

    if (uid) {
      for (const row of rows) {
        const link = row.querySelector(
          `a[href*="selected_item_id=${uid}"], a[href*="${uid}"]`,
        );
        if (link) return row;
      }
    }

    if (normalizedHint) {
      for (const row of rows) {
        const rowName = foldForMatch(
          extractThreadListTitleFromScope(row) || extractNameFromAvatarAlt(row),
        );
        if (rowName && rowName === normalizedHint) return row;
      }
    }

    return rows[0] || null;
  }

  function resolveCustomerFromThreadList(hintName = "") {
    const byName = findThreadRowByCustomerName(hintName);
    if (byName) return byName;

    const bySelected = findThreadRowBySelectedState();
    if (bySelected) return bySelected;

    const row = findSelectedListRow(hintName);
    if (row instanceof HTMLElement) {
      const titleWrap = row.querySelector('[data-surface*="thread_title"]');
      const titleText = titleWrap
        ? extractThreadListTitleFromSurface(titleWrap)
        : extractThreadListTitleFromScope(row);
      return { row, titleText, titleWrap };
    }
    return null;
  }

  function getAvatarSrcFromImg(img) {
    if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return "";
    const src = img.getAttribute("src") || img.currentSrc || "";
    if (!src || src.startsWith("data:")) return "";
    return src;
  }

  function isProfilePhotoSrc(src) {
    const value = String(src || "").toLowerCase();
    if (!value) return false;
    if (value.includes("emoji.php") || value.includes("/rsrc.php/")) return false;
    if (/\.svg(\?|$)/i.test(value)) return false;
    return (
      value.includes("scontent.") ||
      value.includes("fbcdn.net/v/t") ||
      value.includes("stp=dst-jpg") ||
      value.includes("stp=cp0_dst-jpg")
    );
  }

  function isProfilePhotoImg(img) {
    if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return false;
    const src = getAvatarSrcFromImg(img);
    if (!isProfilePhotoSrc(src)) return false;
    const rect = img.getBoundingClientRect();
    if (rect.width <= 18 || rect.height <= 18) return false;
    const alt = foldForMatch(img.getAttribute("alt") || "");
    if (alt === "messenger" || alt === "instagram") return false;
    return true;
  }

  function scoreProfilePhotoImg(img, options = {}) {
    const rect = img.getBoundingClientRect();
    let score = 10;
    const src = getAvatarSrcFromImg(img) || "";
    if (options.preferListColumn && isInThreadListColumn(img)) score += 25;
    if (rect.width >= 40 && rect.width <= 72) score += 30;
    else if (rect.width >= 28 && rect.width < 40) score += 10;
    if (rect.width > 100 || rect.height > 100) score -= 40;
    if (src.includes("s100x100") || src.includes("s60x60")) score += 15;
    if (options.matchName) {
      const foldedAlt = foldForMatch(img.getAttribute("alt") || "");
      const foldedLabel = foldForMatch(img.getAttribute("aria-label") || "");
      const target = foldForMatch(options.matchName);
      if (target && (foldedAlt === target || foldedLabel === target)) score += 120;
    }
    if (
      options.preferChatHeader &&
      rect.left >= window.innerWidth * CHAT_MIN_X_RATIO &&
      rect.left <= window.innerWidth * CHAT_MAX_X_RATIO &&
      rect.top < window.innerHeight * 0.28
    ) {
      score += 35;
    }
    return score;
  }

  function extractProfileAvatarFromContainer(container, options = {}) {
    if (!(container instanceof Element)) return "";
    const listScope = getThreadListScope();
    let bestSrc = "";
    let bestScore = -1;
    container.querySelectorAll("img").forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      if (options.excludeListScope && listScope?.contains(img)) return;
      if (!isProfilePhotoImg(img)) return;
      const score = scoreProfilePhotoImg(img, options);
      if (score > bestScore) {
        bestScore = score;
        bestSrc = getAvatarSrcFromImg(img);
      }
    });
    return bestSrc;
  }

  function extractThreadListTitleFromSurface(surfaceWrapper) {
    if (!(surfaceWrapper instanceof Element)) return "";
    const leaf = surfaceWrapper.querySelector(".xlyipyv");
    if (leaf instanceof HTMLElement) {
      return acceptThreadListTitleText(leaf.textContent);
    }
    return acceptThreadListTitleText(surfaceWrapper.textContent);
  }

  function climbToThreadRowFromTitle(titleWrapper) {
    let current = titleWrapper instanceof Element ? titleWrapper : null;
    for (let depth = 0; depth < 24 && current; depth += 1) {
      if (!(current instanceof HTMLElement)) break;
      const surface = current.getAttribute("data-surface") || "";
      if (surface.includes("thread_row")) return current;
      const profileImg = current.querySelector("img.img, img[src*='scontent']");
      if (
        profileImg instanceof HTMLImageElement &&
        isProfilePhotoImg(profileImg)
      ) {
        const rect = current.getBoundingClientRect();
        if (rect.height >= 44 && rect.height <= 220 && rect.width >= 120) {
          return current;
        }
      }
      current = current.parentElement;
    }
    return titleWrapper instanceof Element ? titleWrapper.parentElement : null;
  }

  function findThreadRowByCustomerName(customerName) {
    const normalizedName = foldForMatch(customerName);
    if (!normalizedName) return null;

    const scope = getThreadListScope() || document;
    const titleSurfaces = scope.querySelectorAll('[data-surface*="thread_title"]');
    let best = null;
    let bestScore = -1;

    for (const titleWrap of titleSurfaces) {
      if (!(titleWrap instanceof Element) || isInsidePanel(titleWrap)) continue;
      const titleText = extractThreadListTitleFromSurface(titleWrap);
      const foldedTitle = foldForMatch(titleText);
      if (!foldedTitle) continue;

      let score = 0;
      if (foldedTitle === normalizedName) score += 100;
      else if (
        foldedTitle.includes(normalizedName) ||
        normalizedName.includes(foldedTitle)
      ) {
        score += 70;
      } else {
        continue;
      }

      const row = climbToThreadRowFromTitle(titleWrap);
      if (!(row instanceof HTMLElement)) continue;
      if (row.querySelector('[aria-selected="true"]')) score += 25;

      if (score > bestScore) {
        bestScore = score;
        best = { row, titleText, titleWrap };
      }
    }

    return best;
  }

  function findThreadRowBySelectedState() {
    const scope = getThreadListScope() || document;
    const titleSurfaces = scope.querySelectorAll('[data-surface*="thread_title"]');
    for (const titleWrap of titleSurfaces) {
      if (!(titleWrap instanceof Element) || isInsidePanel(titleWrap)) continue;
      const row = climbToThreadRowFromTitle(titleWrap);
      if (!(row instanceof HTMLElement)) continue;
      if (
        row.matches('[aria-selected="true"]') ||
        row.querySelector('[aria-selected="true"]')
      ) {
        const titleText = extractThreadListTitleFromSurface(titleWrap);
        if (titleText) return { row, titleText, titleWrap };
      }
    }
    return null;
  }

  function extractAvatarFromRoot(root, options = {}) {
    return extractProfileAvatarFromContainer(root, options);
  }

  /** Tên từ alt/aria của ảnh đại diện (Business Suite thường ghi tên ở đây). */
  function extractNameFromAvatarAlt(root) {
    if (!(root instanceof Element)) return "";
    const imgs = root.querySelectorAll('img[src*="fbcdn"], img[src*="facebook"]');
    for (const img of imgs) {
      if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) continue;
      const alt = acceptThreadListTitleText(img.getAttribute("alt") || "");
      if (alt) return alt;
      const labelledBy = img.getAttribute("aria-labelledby");
      if (labelledBy) {
        const label = document.getElementById(labelledBy);
        const text = acceptThreadListTitleText(label?.textContent || "");
        if (text) return text;
      }
    }
    return "";
  }

  function extractChatHeaderName(root = getChatContentRoot()) {
    const candidates = [];
    const scope = root instanceof HTMLElement ? root : getChatContentRoot();
    scope.querySelectorAll('span[dir="auto"], h1, h2, [role="heading"]').forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      const rect = node.getBoundingClientRect();
      if (
        rect.left < window.innerWidth * CHAT_MIN_X_RATIO ||
        rect.left > window.innerWidth * CHAT_MAX_X_RATIO
      ) {
        return;
      }
      if (rect.top > window.innerHeight * 0.35) return;
      const text = acceptThreadListTitleText(node.textContent);
      if (!text) return;
      const fontPx = getAutoSpanFontPx(node);
      candidates.push({ text, fontPx, top: rect.top });
    });
    candidates.sort((a, b) => a.top - b.top || b.fontPx - a.fontPx);
    return candidates[0]?.text || "";
  }

  function extractRightPanelName() {
    const candidates = [];
    document.querySelectorAll('span[dir="auto"], h1, h2, h3, strong').forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      const rect = node.getBoundingClientRect();
      if (rect.left < window.innerWidth * RIGHT_PANEL_MIN_X_RATIO) return;
      if (rect.top > window.innerHeight * 0.45) return;
      const text = acceptThreadListTitleText(node.textContent);
      if (!text || text.length > 64) return;
      const fontPx = getAutoSpanFontPx(node);
      candidates.push({ text, fontPx, top: rect.top });
    });
    candidates.sort((a, b) => a.top - b.top || b.fontPx - a.fontPx);
    return candidates[0]?.text || "";
  }

  let e2eeUidRetryTimer = null;

  function tryFillE2eeCustomerUidFromMessages() {
    if (getScanSource() !== "messenger_e2ee" || STATE.customerUid) return false;
    const ctx = getCtx();
    if (!ctx?.resolveE2eeCustomerUidFromMessageIds) return false;

    const ids = (STATE.chatMessages || []).map((msg) => msg.id).filter(Boolean);
    if (!ids.length) return false;

    const exclude = new Set(
      [STATE.employeeUid, STATE.threadId, STATE.myPageUid].filter(Boolean),
    );
    const uid = ctx.resolveE2eeCustomerUidFromMessageIds(ids, exclude);
    if (!uid) return false;

    STATE.customerUid = uid;
    window.__ANHUNGLAND_LAST_E2EE_UID__ = {
      uid,
      score: 90,
      source: "data-message-id-prefix",
    };
    if (STATE.scanDebug && typeof STATE.scanDebug === "object") {
      STATE.scanDebug.customerFacebookUid = uid;
      STATE.scanDebug.e2eeCustomerUidSource = "data-message-id-prefix";
      STATE.scanDebug.e2eeCustomerUidScore = 90;
      STATE.scanDebug.e2eeUsesThreadKey = false;
    }
    captureAutoDraftSnapshot();
    return true;
  }

  function scheduleE2eeUidRetry() {
    if (e2eeUidRetryTimer) clearTimeout(e2eeUidRetryTimer);
    let attempts = 0;
    const tick = () => {
      e2eeUidRetryTimer = null;
      if (getScanSource() !== "messenger_e2ee" || buildScanKey() !== STATE.lastScanKey) return;
      if (STATE.customerUid) return;

      const uid = getCtx()?.resolveCustomerUid?.() || "";
      if (uid) {
        STATE.customerUid = uid;
        captureAutoDraftSnapshot();
        const scanner = getMessengerScanner();
        if (scanner?.scan) scanner.scan(STATE);
        renderPanel();
        return;
      }
      if (tryFillE2eeCustomerUidFromMessages()) {
        renderPanel();
        return;
      }
      attempts += 1;
      if (attempts < 6) e2eeUidRetryTimer = window.setTimeout(tick, 700);
    };
    e2eeUidRetryTimer = window.setTimeout(tick, 350);
  }

  function scanCurrentCustomer() {
    syncInboxUrlParams();

    if (isMessengerSource()) {
      const scanner = getMessengerScanner();
      if (!scanner?.scan) {
        STATE.status = "Scanner Messenger chua san sang — reload extension.";
        return;
      }
      scanner.scan(STATE);
      refreshChatMessagesForCurrentThread();
      tryFillE2eeCustomerUidFromMessages();
      if (getScanSource() === "messenger_e2ee" && !STATE.customerUid) {
        scheduleE2eeUidRetry();
      }
    } else if (!isBusinessSuiteSource()) {
      STATE.status = "Nguon quet khong ho tro tren trang nay.";
    } else {
      scanBusinessSuiteCustomer();
    }
    captureAutoDraftSnapshot();
  }

  function scanBusinessSuiteCustomer() {

    if (!STATE.assetId) {
      STATE.customerName = "";
      STATE.avatarUrl = "";
      STATE.chatMessages = [];
      STATE.lastMessagesKey = "";
      STATE.source = "";
      STATE.status =
        "Chua thay asset_id tren URL. Chon dung Page trong Business Suite.";
      return;
    }

    if (!STATE.customerUid) {
      STATE.customerName = "";
      STATE.avatarUrl = "";
      STATE.chatMessages = [];
      STATE.lastMessagesKey = "";
      STATE.source = "url-only";
      STATE.status = `Page ${STATE.assetId} — chon mot khach trong danh sach ben trai.`;
      return;
    }

    const chatRoot = getChatContentRoot();
    const headerName = extractChatHeaderName(chatRoot);
    const rightName = extractRightPanelName();
    const preName = headerName || rightName || "";
    const threadMatch = resolveCustomerFromThreadList(preName);
    const row = threadMatch?.row || null;
    const rowName =
      threadMatch?.titleText ||
      (row ? extractThreadListTitleFromScope(row) : "") ||
      "";
    const altName = extractNameFromAvatarAlt(chatRoot);
    const name = rowName || altName || headerName || rightName || "";

    let avatarUrl = "";
    let avatarSource = "";
    if (row) {
      avatarUrl = extractProfileAvatarFromContainer(row, { matchName: name });
      if (avatarUrl) avatarSource = "list-row-pair";
    }
    if (!avatarUrl && name) {
      const listScope = getThreadListScope();
      document.querySelectorAll("img").forEach((img) => {
        if (!(img instanceof HTMLImageElement) || isInsidePanel(img)) return;
        if (!listScope?.contains(img)) return;
        if (!isProfilePhotoImg(img)) return;
        const score = scoreProfilePhotoImg(img, { matchName: name, preferListColumn: true });
        if (score > 80 && !avatarUrl) {
          avatarUrl = getAvatarSrcFromImg(img);
          avatarSource = "list-img-by-name";
        }
      });
    }
    if (!avatarUrl) {
      avatarUrl = extractProfileAvatarFromContainer(chatRoot, {
        matchName: name,
        preferChatHeader: true,
        excludeListScope: true,
      });
      if (avatarUrl) avatarSource = "chat-header";
    }
    if (!avatarUrl && row) {
      avatarUrl = extractProfileAvatarFromContainer(row);
      if (avatarUrl) avatarSource = "list-row-fallback";
    }

    STATE.scanDebug = {
      rowName,
      headerName,
      rightName,
      altName,
      avatarSource,
      hasListRow: Boolean(row),
      hasThreadListScope: Boolean(getThreadListScope()),
      hasChatRoot: Boolean(chatRoot),
      chatMidContainer: Boolean(getChatMessagesContainer()),
      chatMidCount: countMessengerMidsIn(getChatMessageScanRoot()),
      listLinkHref: findThreadListLinkByUid(STATE.customerUid)?.getAttribute("href") || "",
    };
    STATE.customerName = name;
    STATE.avatarUrl = avatarUrl;
    STATE.source = rowName
      ? "list-row"
      : headerName
        ? "chat-header"
        : rightName
        ? "right-panel"
        : altName
          ? "avatar-alt"
          : "url-only";

    refreshChatMessagesForCurrentThread();

    const msgCount = STATE.chatMessages.length;
    const msgHint = msgCount
      ? ` | ${msgCount} tin (cuon len de them tin cu)`
      : " | chua thay tin tren DOM";

    if (name && avatarUrl) {
      STATE.status = `Da quet: ${name} (UID ${STATE.customerUid})${msgHint}.`;
    } else if (name) {
      STATE.status = `Da quet ten "${name}" — chua thay avatar${msgHint}.`;
    } else {
      STATE.status = `UID ${STATE.customerUid} — chua doc duoc ten${msgHint}.`;
    }
  }

  function normalizeBackendBaseUrl(value) {
    const raw = normalizeText(value).replace(/\/+$/, "");
    if (!raw) return CRM_DEFAULT_API_URL;
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return CRM_DEFAULT_API_URL;
      }
      const host = url.host.toLowerCase();
      if (host === "crm.anhungland.com") {
        return CRM_DEFAULT_API_URL;
      }
      if (host === "localhost:5000" || host === "127.0.0.1:5000" || host === "localhost:4000") {
        return "http://localhost:5050/api/v1";
      }
      let path = (url.pathname || "").replace(/\/+$/, "");
      if (!path || path === "/") path = "/api/v1";
      if (path === "/api") path = "/api/v1";
      return `${url.protocol}//${url.host}${path}`;
    } catch (_e) {
      return null;
    }
  }

  function setAuthToken(token) {
    const value = normalizeText(token || "");
    STATE.auth.token = value;
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    if (value) {
      chrome.storage.local.set({ [AUTH_TOKEN_STORAGE_KEY]: value });
    } else {
      chrome.storage.local.remove(AUTH_TOKEN_STORAGE_KEY);
    }
  }

  function setRefreshToken(token) {
    const value = normalizeText(token || "");
    STATE.auth.refreshToken = value;
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    if (value) {
      chrome.storage.local.set({ [AUTH_REFRESH_STORAGE_KEY]: value });
    } else {
      chrome.storage.local.remove(AUTH_REFRESH_STORAGE_KEY);
    }
  }

  function setAuthUser(user) {
    STATE.auth.user = user || null;
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    if (user) {
      chrome.storage.local.set({ [AUTH_USER_STORAGE_KEY]: user });
    } else {
      chrome.storage.local.remove(AUTH_USER_STORAGE_KEY);
    }
  }

  function clearAuthSession() {
    setAuthToken("");
    setRefreshToken("");
    setAuthUser(null);
    STATE.auth.status = "";
  }

  function hasAuthToken() {
    return Boolean(normalizeText(STATE.auth.token || ""));
  }

  function normalizeLoginError(rawMessage) {
    const message = String(rawMessage || "").trim().toLowerCase();
    if (!message) return "Đăng nhập thất bại.";
    if (message.includes("invalid credentials")) {
      return "Sai tên đăng nhập hoặc mật khẩu.";
    }
    if (message.includes("unauthorized")) {
      return "Phiên đăng nhập không hợp lệ.";
    }
    return String(rawMessage || "").trim() || "Đăng nhập thất bại.";
  }

  function backendFetch(path, init = {}) {
    const url = `${STATE.backendBaseUrl}${path}`;
    const requestInit = {
      method: init.method || "GET",
      headers: init.headers,
      body: init.body,
    };

    return new Promise((resolve, reject) => {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        fetch(url, requestInit)
          .then(async (response) => {
            resolve({
              ok: response.ok,
              status: response.status,
              text: await response.text(),
            });
          })
          .catch(reject);
        return;
      }

      chrome.runtime.sendMessage(
        { type: API_FETCH_TYPE, payload: { url, init: requestInit } },
        (response) => {
          if (chrome.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response) {
            reject(new Error("Extension không phản hồi — reload extension."));
            return;
          }
          if (response.error) {
            reject(new Error(`${response.error} (API: ${STATE.backendBaseUrl})`));
            return;
          }
          resolve(response);
        },
      );
    });
  }

  function parseJsonResponse(response) {
    const rawText = response.text || "";
    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch (_e) {
      return {};
    }
  }

  function authUserFromPayload(data) {
    if (!data || typeof data !== "object") return null;
    if (data.user && data.user.id) return data.user;
    if (data.id && data.username) return data;
    return null;
  }

  async function refreshAccessToken() {
    const refresh = normalizeText(STATE.auth.refreshToken || "");
    if (!refresh) return false;
    const response = await backendFetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const data = parseJsonResponse(response);
    if (!response.ok || !data?.accessToken) {
      clearAuthSession();
      return false;
    }
    setAuthToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    const user = authUserFromPayload(data);
    if (user) setAuthUser(user);
    return true;
  }

  async function backendFetchAuthed(path, init = {}) {
    const headers = { ...(init.headers || {}) };
    if (STATE.auth.token) {
      headers.Authorization = `Bearer ${STATE.auth.token}`;
    }
    let response = await backendFetch(path, { ...init, headers });
    if (response.status === 401 && (await refreshAccessToken())) {
      headers.Authorization = `Bearer ${STATE.auth.token}`;
      response = await backendFetch(path, { ...init, headers });
    }
    return response;
  }

  async function verifyAuthSession() {
    if (!hasAuthToken()) return false;
    try {
      const response = await backendFetchAuthed("/auth/me");
      const data = parseJsonResponse(response);
      const user = authUserFromPayload(data);
      if (!response.ok || !user) {
        clearAuthSession();
        return false;
      }
      setAuthUser(user);
      return true;
    } catch (_e) {
      return Boolean(STATE.auth.user);
    }
  }

  async function loginToBackend(username, password) {
    const cleanUsername = normalizeText(username || "");
    if (!cleanUsername || !password) {
      throw new Error("Vui lòng nhập username và mật khẩu.");
    }

    const response = await backendFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUsername, password }),
    });
    const data = parseJsonResponse(response);

    if (!response.ok || !data?.accessToken) {
      throw new Error(
        normalizeLoginError(data?.message) ||
          `Đăng nhập thất bại (${response.status || "?"}).`,
      );
    }

    setAuthToken(data.accessToken);
    setRefreshToken(data.refreshToken || "");
    setAuthUser(data.user || null);
    return data.user || null;
  }

  async function logoutFromBackend() {
    clearAuthSession();
  }

  function buildExtensionDraftPayload() {
    return {
      capturedAt: new Date().toISOString(),
      extensionVersion: UI_VERSION,
      pageUrl: window.location.href,
      scanSource: getScanSource(),
      scanSourceLabel: getScanSourceLabel(),
      scan: {
        assetId: STATE.assetId,
        mailboxId: STATE.mailboxId,
        businessId: STATE.businessId,
        threadId: STATE.threadId,
        threadType: STATE.threadType,
        employeeUid: STATE.employeeUid,
        myPageUid: STATE.myPageUid,
        customerUid: STATE.customerUid,
        customerName: STATE.customerName,
        avatarUrl: STATE.avatarUrl,
        source: STATE.source,
        status: STATE.status,
        scanDebug: STATE.scanDebug,
      },
      chatMessages: (STATE.chatMessages || []).map((msg) => ({
        id: msg.id,
        text: msg.text,
        imageUrls: msg.imageUrls || [],
        sender: msg.sender,
        senderUid: msg.senderUid || "",
        dedupeKey: msg.dedupeKey,
      })),
    };
  }

  function captureAutoDraftSnapshot() {
    const key = buildScanKey();
    if (!key || !canTrackChatMessages()) {
      STATE.autoDraftSnapshot = null;
      return;
    }
    STATE.autoDraftSnapshot = {
      scanKey: key,
      ...buildExtensionDraftPayload(),
    };
  }

  function draftPayloadFromSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null;
    const { scanKey: _scanKey, ...payload } = snapshot;
    return payload;
  }

  function draftCustomerLabel(snapshot) {
    const name = normalizeText(snapshot?.scan?.customerName || "");
    if (name) return name;
    const uid = normalizeText(snapshot?.scan?.customerUid || snapshot?.scan?.threadId || "");
    return uid || "khách trước";
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("read_failed"));
      reader.readAsDataURL(blob);
    });
  }

  async function resolveImageUrlForBackend(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    if (value.startsWith("/img/")) return value;
    if (value.startsWith("data:")) return value;
    if (/^https?:\/\//i.test(value)) return value;
    if (!value.startsWith("blob:")) return "";

    try {
      const response = await fetch(value);
      const blob = await response.blob();
      if (!blob.type.startsWith("image/") && !blob.type.startsWith("video/")) return "";
      return await blobToDataUrl(blob);
    } catch {
      return "";
    }
  }

  function isStableMessengerMessageIdForImages(id) {
    const v = String(id || "").trim();
    return /^mid\./i.test(v) || /^\d+@msgr\./i.test(v);
  }

  async function prepareChatMessagesForBackend(messages) {
    const list = Array.isArray(messages) ? messages : [];
    const prepared = [];

    for (const msg of list) {
      const imageUrls = [];
      const hasServerImages = (msg.imageUrls || []).some((u) =>
        String(u || "").trim().startsWith("/img/imgsmessenger/"),
      );
      const stableMsgId = isStableMessengerMessageIdForImages(msg.id);

      for (const raw of msg.imageUrls || []) {
        const value = String(raw || "").trim();
        if (!value) continue;
        if (value.startsWith("/img/imgsmessenger/")) {
          imageUrls.push(value);
          continue;
        }
        // Tin đã có path server — không gửi lại data:/blob: (BE dedupe theo message-id)
        if (stableMsgId && hasServerImages && (value.startsWith("data:") || value.startsWith("blob:"))) {
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const resolved = await resolveImageUrlForBackend(raw);
        if (resolved) imageUrls.push(resolved);
      }
      prepared.push({
        ...msg,
        imageUrls,
      });
    }

    return prepared;
  }

  function payloadHasIngestCustomerUid(payload) {
    const scan = payload?.scan || {};
    const uid = normalizeText(scan.customerUid);
    const thread = normalizeText(scan.threadId);
    const source = normalizeText(payload?.scanSource || scan.scanSource);
    if (!uid) return false;
    if (source === "messenger_e2ee" && uid === thread) return false;
    return true;
  }

  async function submitDraftScanToBackend(payloadOverride) {
    if (!hasAuthToken()) {
      throw new Error("Đăng nhập CRM trước khi gửi.");
    }
    const basePayload = payloadOverride || buildExtensionDraftPayload();
    if (!payloadHasIngestCustomerUid(basePayload)) {
      throw new Error(
        "Chưa có UID Facebook của khách. Messenger mã hóa: đợi panel hiện UID rồi gửi lại.",
      );
    }

    const chatMessages = await prepareChatMessagesForBackend(basePayload.chatMessages || []);
    const payload = {
      ...basePayload,
      chatMessages,
    };

    const response = await backendFetchAuthed("/customers/from-extension", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = parseJsonResponse(response);
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || `Gửi thất bại (${response.status || "?"}).`);
    }
    return data;
  }

  async function autoSubmitDraftForPreviousCustomer(prevScanKey) {
    const prevKey = normalizeText(prevScanKey || "");
    if (!prevKey) return;

    const snap = STATE.autoDraftSnapshot;
    if (!snap || snap.scanKey !== prevKey) return;

    const payload = draftPayloadFromSnapshot(snap);
    const label = draftCustomerLabel(snap);
    if (!payloadHasIngestCustomerUid(payload)) {
      STATE.draftStatus = `Chưa có UID Facebook — «${label}» chưa gửi BE.`;
      renderPanel();
      return;
    }

    if (!hasAuthToken()) {
      STATE.draftStatus = `Chưa đăng nhập — «${label}» chưa gửi BE.`;
      renderPanel();
      return;
    }

    if (STATE.draftSubmitting) return;

    STATE.draftSubmitting = true;
    STATE.draftStatus = `Đang gửi BE tự động: ${label}…`;
    renderPanel();

    try {
      const data = await submitDraftScanToBackend(payload);
      const msgCount = Array.isArray(payload.chatMessages) ? payload.chatMessages.length : 0;
      const appended = Number(data?.messagesAppended) || 0;
      const appendHint = appended > 0 ? ` (+${appended} tin mới trên BE)` : "";
      STATE.draftStatus = data.updated
        ? `Đã gửi tự động (cập nhật #${data.id}): ${label}${msgCount ? ` — ${msgCount} tin gửi` : ""}${appendHint}.`
        : `Đã gửi tự động (#${data.id}): ${label}${msgCount ? ` — ${msgCount} tin` : ""}.`;
    } catch (error) {
      STATE.draftStatus = error?.message || `Gửi tự động thất bại: ${label}.`;
    } finally {
      STATE.draftSubmitting = false;
      renderPanel();
    }
  }

  function hydrateBackendUrl(done) {
    const finishAuth = () => {
      if (!hasAuthToken()) {
        STATE.auth.loaded = true;
        done?.();
        return;
      }
      verifyAuthSession().finally(() => {
        STATE.auth.loaded = true;
        done?.();
      });
    };

    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      STATE.backendBaseUrl = CRM_DEFAULT_API_URL;
      STATE.backendLoaded = true;
      finishAuth();
      return;
    }

    chrome.storage.local.get(
      [
        BACKEND_URL_STORAGE_KEY,
        AUTH_TOKEN_STORAGE_KEY,
        AUTH_REFRESH_STORAGE_KEY,
        AUTH_USER_STORAGE_KEY,
        LEGACY_BACKEND_URL_STORAGE_KEY,
        LEGACY_AUTH_TOKEN_STORAGE_KEY,
        LEGACY_AUTH_USER_STORAGE_KEY,
      ],
      (items) => {
        const rawUrl =
          items?.[BACKEND_URL_STORAGE_KEY] ||
          items?.[LEGACY_BACKEND_URL_STORAGE_KEY] ||
          CRM_DEFAULT_API_URL;
        const apiUrl = normalizeBackendBaseUrl(rawUrl) || CRM_DEFAULT_API_URL;
        const token =
          items?.[AUTH_TOKEN_STORAGE_KEY] || items?.[LEGACY_AUTH_TOKEN_STORAGE_KEY] || "";
        const refresh = items?.[AUTH_REFRESH_STORAGE_KEY] || "";
        const user = items?.[AUTH_USER_STORAGE_KEY] || items?.[LEGACY_AUTH_USER_STORAGE_KEY] || null;

        STATE.backendBaseUrl = apiUrl;
        STATE.backendLoaded = true;
        STATE.auth.token = normalizeText(token);
        STATE.auth.refreshToken = normalizeText(refresh);
        STATE.auth.user = user;

        const migrate = {};
        if (apiUrl && apiUrl !== items?.[BACKEND_URL_STORAGE_KEY]) {
          migrate[BACKEND_URL_STORAGE_KEY] = apiUrl;
        }
        if (!items?.[AUTH_TOKEN_STORAGE_KEY] && token) {
          migrate[AUTH_TOKEN_STORAGE_KEY] = token;
        }
        if (!items?.[AUTH_USER_STORAGE_KEY] && user) {
          migrate[AUTH_USER_STORAGE_KEY] = user;
        }
        if (Object.keys(migrate).length) {
          chrome.storage.local.set(migrate);
        }

        finishAuth();
      },
    );
  }

  async function saveBackendUrl(rawUrl) {
    const baseUrl = normalizeBackendBaseUrl(rawUrl);
    if (!baseUrl) {
      setStatus(`URL server khong hop le (vd: ${CRM_DEFAULT_API_URL}).`);
      return false;
    }
    STATE.backendSaving = true;
    renderPanel();
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ [BACKEND_URL_STORAGE_KEY]: baseUrl }, () => {
          const err = chrome.runtime?.lastError;
          if (err) reject(err);
          else resolve();
        });
      }).catch(() => {});
    }
    STATE.backendBaseUrl = baseUrl;
    STATE.backendSaving = false;
    setStatus(`Da luu server: ${baseUrl}`);
    return true;
  }

  function setStatus(message) {
    STATE.status = message;
    renderPanel();
  }

  function setDomLiveStatus(message) {
    STATE.domLiveStatus = message;
    renderPanel();
  }

  function downloadTextFile(fileName, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  function downloadTextInChunks(baseName, text, chunkSize = EXPORT_CHUNK_SIZE) {
    if (!text) return 0;
    let count = 0;
    for (let i = 0; i < text.length; i += chunkSize) {
      count += 1;
      downloadTextFile(
        `${baseName}.part${String(count).padStart(3, "0")}.txt`,
        text.slice(i, i + chunkSize),
      );
    }
    return count;
  }

  function formatDomRect(node) {
    if (!(node instanceof Element)) return "(none)";
    const rect = node.getBoundingClientRect();
    return JSON.stringify({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }

  function collectInboxLinksLeft(max = 40) {
    const scope = getThreadListScope() || document;
    const seen = new Set();
    const links = [];
    scope.querySelectorAll('a[href*="selected_item_id="]').forEach((node) => {
      if (!(node instanceof HTMLAnchorElement) || isInsidePanel(node)) return;
      if (isChannelTabInboxLink(node)) return;
      const href = node.getAttribute("href") || "";
      if (!href || seen.has(href)) return;
      if (!isInThreadListColumn(node)) return;
      seen.add(href);
      links.push(node);
    });
    return links.slice(0, max);
  }

  function collectTitleLeavesInRow(row) {
    if (!(row instanceof HTMLElement)) return [];
    return collectThreadListTitleLeaves(row)
      .slice(0, 12)
      .map((leaf, index) => ({
        index: index + 1,
        text: leaf.text,
        fontPx: leaf.fontPx,
        rect: formatDomRect(
          row.querySelector("span.xlyipyv, span[dir='auto']") || row,
        ),
      }));
  }

  function collectHeaderNameCandidates(max = 12) {
    const items = [];
    document
      .querySelectorAll('span[dir="auto"], h1, h2, [role="heading"]')
      .forEach((node) => {
        if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
        const rect = node.getBoundingClientRect();
        if (
          rect.left < window.innerWidth * 0.22 ||
          rect.left > window.innerWidth * 0.75 ||
          rect.top > window.innerHeight * 0.38
        ) {
          return;
        }
        const text = acceptThreadListTitleText(node.textContent);
        if (!text) return;
        items.push({
          text,
          fontPx: getAutoSpanFontPx(node),
          rect: formatDomRect(node),
        });
      });
    return items.sort((a, b) => b.fontPx - a.fontPx).slice(0, max);
  }

  function collectRightPanelCandidates(max = 10) {
    const items = [];
    document.querySelectorAll('span[dir="auto"], h1, h2, h3, strong').forEach((node) => {
      if (!(node instanceof HTMLElement) || isInsidePanel(node)) return;
      const rect = node.getBoundingClientRect();
      if (rect.left < window.innerWidth * RIGHT_PANEL_MIN_X_RATIO) return;
      if (rect.top > window.innerHeight * 0.5) return;
      const text = acceptThreadListTitleText(node.textContent);
      if (!text || text.length > 80) return;
      items.push({
        text,
        fontPx: getAutoSpanFontPx(node),
        rect: formatDomRect(node),
      });
    });
    return items.sort((a, b) => b.fontPx - a.fontPx).slice(0, max);
  }

  function buildDomLiveSummaryPayload() {
    scanCurrentCustomer();
    const url = window.location.href;
    let pathname = "";
    try {
      pathname = new URL(url).pathname;
    } catch (_e) {
      pathname = window.location.pathname || "";
    }
    const urlParams = getCtx()?.getUrlParamSnapshot?.() || {};
    const capturedAt = new Date().toISOString();
    const uid = getCustomerUid() || "no-uid";
    const row = findSelectedListRow(STATE.customerName);
    const main = getChatContentRoot();
    const inboxLinks = collectInboxLinksLeft();
    const titleLeaves = collectTitleLeavesInRow(row);
    const headerCandidates = collectHeaderNameCandidates();
    const rightCandidates = collectRightPanelCandidates();

    let mainHtml = main instanceof HTMLElement ? main.outerHTML : "(not found)";
    let mainNote = "";
    if (mainHtml.length > DOM_LIVE_SUMMARY_MAIN_MAX) {
      mainNote = `(truncated — full length ${mainHtml.length}, see .part*.txt)`;
      mainHtml = `${mainHtml.slice(0, DOM_LIVE_SUMMARY_MAIN_MAX)}\n<!-- TRUNCATED -->`;
    }

    const lines = [
      "PAGES FACEBOOK CRM — DOM LIVE (Business Suite Inbox)",
      `captured_at: ${capturedAt}`,
      `extension_version: ${UI_VERSION}`,
      `url: ${url}`,
      `pathname: ${pathname}`,
      "",
      "===== URL PARAMS (Business Suite) =====",
      Object.keys(urlParams).length
        ? Object.entries(urlParams)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : "(no known params on URL)",
      "",
      "===== EXTENSION SCAN (tai thoi diem quet) =====",
      `asset_id: ${STATE.assetId || "(empty)"}`,
      `mailbox_id: ${STATE.mailboxId || "(empty)"}`,
      `business_id: ${STATE.businessId || "(empty)"}`,
      `selected_item_id: ${STATE.customerUid || "(empty)"}`,
      `thread_type: ${STATE.threadType || "(empty)"}`,
      `my_page_uid (page_uri_token): ${STATE.myPageUid || "(empty)"}`,
      `customer_name: ${STATE.customerName || "(empty)"}`,
      `avatar_url: ${STATE.avatarUrl || "(empty)"}`,
      `chat_messages_count: ${STATE.chatMessages.length}`,
      `chat_message_order: document-dom (thu tu HTML trong khung chat)`,
      ...(STATE.chatMessages.length
        ? [
            "",
            "===== CHAT MESSAGES (theo thu tu HTML) =====",
            ...STATE.chatMessages.map((msg, index) => {
              const imgs = (msg.imageUrls || [])
                .map((url, i) => formatImageUrlForCopy(url, i))
                .join(" | ");
              return `${index + 1}. [${msg.sender}] ${msg.text || "(no text)"}${imgs ? ` | ${imgs}` : ""}${msg.id ? ` (id=${msg.id})` : ""}`;
            }),
          ]
        : []),
      `source: ${STATE.source || "(empty)"}`,
      `scan_debug: ${JSON.stringify(STATE.scanDebug)}`,
      "",
      "===== SELECTED LIST ROW =====",
      `found: ${Boolean(row)}`,
      `rect: ${formatDomRect(row)}`,
      row instanceof HTMLElement ? row.outerHTML : "(not found)",
      "",
      `===== TITLE LEAVES IN ROW (${titleLeaves.length}) =====`,
      titleLeaves.length
        ? titleLeaves
            .map(
              (leaf) =>
                `--- leaf_${leaf.index} font=${leaf.fontPx}px rect=${leaf.rect} ---\ntext: ${leaf.text}`,
            )
            .join("\n\n")
        : "(not found)",
      "",
      `===== INBOX LINKS LEFT (${inboxLinks.length}) =====`,
      inboxLinks.length
        ? inboxLinks
            .map((link, index) => {
              const href = link.getAttribute("href") || "";
              return `--- link_${index + 1} href=${href} rect=${formatDomRect(link)} ---\n${link.outerHTML}`;
            })
            .join("\n\n")
        : "(not found)",
      "",
      `===== CHAT HEADER CANDIDATES (${headerCandidates.length}) =====`,
      headerCandidates.length
        ? headerCandidates
            .map(
              (item, index) =>
                `--- header_${index + 1} font=${item.fontPx}px rect=${item.rect} ---\ntext: ${item.text}`,
            )
            .join("\n\n")
        : "(not found)",
      "",
      `===== RIGHT PANEL CANDIDATES (${rightCandidates.length}) =====`,
      rightCandidates.length
        ? rightCandidates
            .map(
              (item, index) =>
                `--- right_${index + 1} font=${item.fontPx}px rect=${item.rect} ---\ntext: ${item.text}`,
            )
            .join("\n\n")
        : "(not found)",
      "",
      "===== CHAT ROOT (thread_and_detail) OUTERHTML =====",
      mainNote,
      mainHtml,
    ];

    return { payload: lines.join("\n"), uid, capturedAt };
  }

  function formatMessageSenderLabel(sender) {
    if (sender === "customer") return "Khách";
    if (sender === "me") return "Tôi";
    if (sender === "page") return "Page (tôi)";
    return sender || "Không rõ";
  }

  function scanInfoClipboardLine(label, value) {
    const text = String(value || "").trim();
    return `${label}: ${text || "(empty)"}`;
  }

  function buildScanInfoClipboardPayload() {
    const capturedAt = new Date().toISOString();
    const lines = [
      "AN HƯNG LAND CRM — THÔNG TIN QUÉT",
      `copied_at: ${capturedAt}`,
      `extension_version: ${UI_VERSION}`,
      `url: ${window.location.href}`,
      "",
    ];

    if (isMessengerSource()) {
      const uidLabel =
        getScanSource() === "messenger_e2ee" ? "UID FB khách (E2EE)" : "UID FB khách";
      const e2eeUidHint =
        getScanSource() === "messenger_e2ee" && !STATE.customerUid
          ? "(chưa có — mở Chi tiết liên hệ bên phải rồi quét lại)"
          : STATE.customerUid;
      lines.push(
        scanInfoClipboardLine("Nguồn quét", getScanSourceLabel()),
        scanInfoClipboardLine("thread_id (URL)", STATE.threadId),
        scanInfoClipboardLine("thread_type", STATE.threadType),
        scanInfoClipboardLine("UID Page / nick NV (nguồn quét)", STATE.employeeUid),
        scanInfoClipboardLine(uidLabel, e2eeUidHint),
      );
      if (getScanSource() === "messenger_e2ee" && STATE.scanDebug?.e2eeCustomerUidSource) {
        lines.push(
          scanInfoClipboardLine(
            "Nguồn UID E2EE",
            `${STATE.scanDebug.e2eeCustomerUidSource} (score ${STATE.scanDebug.e2eeCustomerUidScore || 0})`,
          ),
        );
      }
      lines.push(
        scanInfoClipboardLine("Tên khách", STATE.customerName),
        scanInfoClipboardLine("Avatar khách", STATE.avatarUrl ? "Có" : ""),
      );
    } else {
      lines.push(
        scanInfoClipboardLine("Nguồn quét", getScanSourceLabel()),
        scanInfoClipboardLine("asset_id", STATE.assetId),
        scanInfoClipboardLine("mailbox_id", STATE.mailboxId),
        scanInfoClipboardLine("business_id", STATE.businessId),
        scanInfoClipboardLine("selected_item_id", STATE.customerUid),
        scanInfoClipboardLine("thread_type", STATE.threadType || "FB_MESSAGE"),
        scanInfoClipboardLine("UID Page (đồng bộ)", STATE.myPageUid),
        scanInfoClipboardLine("Tên khách", STATE.customerName),
        scanInfoClipboardLine("Avatar khách", STATE.avatarUrl ? "Có" : ""),
      );
    }

    if (STATE.avatarUrl) {
      lines.push(scanInfoClipboardLine("avatar_url", STATE.avatarUrl));
    }
    return lines.join("\n");
  }

  async function copyScanInfoToClipboard() {
    const payload = buildScanInfoClipboardPayload();
    const ok = await copyTextToClipboard(payload);
    STATE.scanInfoCopyStatus = ok
      ? "Đã copy thông tin quét — dán (Ctrl+V) gửi dev."
      : "Copy thất bại — thử bấm lại.";
    renderPanel();
    window.setTimeout(() => {
      if (STATE.scanInfoCopyStatus.includes("Đã copy")) {
        STATE.scanInfoCopyStatus = "";
        renderPanel();
      }
    }, 4500);
  }

  function buildMessagesClipboardPayload() {
    const capturedAt = new Date().toISOString();
    const url = window.location.href;
    const pathname = window.location.pathname || "";
    const msgs = STATE.chatMessages || [];

    const lines = [
      "PAGES FACEBOOK CRM — TIN NHẮN ĐÃ QUÉT",
      `copied_at: ${capturedAt}`,
      `extension_version: ${UI_VERSION}`,
      `url: ${url}`,
      `pathname: ${pathname}`,
      "",
      "===== THÔNG TIN QUÉT (tại thời điểm copy) =====",
      `scan_source: ${getScanSourceLabel()}`,
      `thread_id: ${STATE.threadId || "(empty)"}`,
      `thread_type: ${STATE.threadType || "(empty)"}`,
      `customer_name: ${STATE.customerName || "(empty)"}`,
      `customer_uid: ${STATE.customerUid || "(empty)"}`,
      `employee_uid: ${STATE.employeeUid || STATE.myPageUid || "(empty)"}`,
      `chat_messages_count: ${msgs.length}`,
      `scan_debug: ${JSON.stringify(STATE.scanDebug || {})}`,
      "",
      `===== CHAT MESSAGES (${msgs.length} tin, theo thu tu quet) =====`,
    ];

    if (!msgs.length) {
      lines.push("(chua co tin — mo khach trong danh sach va doi extension quet)");
    } else {
      msgs.forEach((msg, index) => {
        const who = formatMessageSenderLabel(msg.sender);
        const imgs = (msg.imageUrls || [])
          .map((imageUrl, i) => formatImageUrlForCopy(imageUrl, i))
          .join(" | ");
        lines.push(
          `${index + 1}. [${who}] ${msg.text || "(no text)"}${imgs ? ` | ${imgs}` : ""}${msg.id ? ` (id=${msg.id})` : ""}`,
        );
      });
    }

    return lines.join("\n");
  }

  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      /* fallback below */
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (_) {
      return false;
    }
  }

  async function copyScannedMessagesToClipboard() {
    if (!STATE.chatMessages?.length) {
      STATE.messagesCopyStatus = "Chưa có tin để copy.";
      renderPanel();
      return;
    }

    const payload = buildMessagesClipboardPayload();
    const ok = await copyTextToClipboard(payload);
    STATE.messagesCopyStatus = ok
      ? `Đã copy ${STATE.chatMessages.length} tin — dán (Ctrl+V) gửi dev.`
      : "Copy thất bại — thử bấm lại.";
    renderPanel();
    window.setTimeout(() => {
      if (STATE.messagesCopyStatus.includes("Đã copy")) {
        STATE.messagesCopyStatus = "";
        renderPanel();
      }
    }, 4500);
  }

  function exportDomLiveSnapshot() {
    if (STATE.domLiveExporting) return;
    if (!isExtensionActive()) {
      setDomLiveStatus("Khong phai trang ho tro quet.");
      return;
    }

    STATE.domLiveExporting = true;
    setDomLiveStatus("Dang gom DOM LIVE...");
    renderPanel();

    window.setTimeout(() => {
      try {
        const { payload, uid, capturedAt } = buildDomLiveSummaryPayload();
        const stamp = Date.now();
        const safeUid = uid.replace(/[^\dA-Za-z_-]/g, "") || "no-uid";
        const summaryName = `pages-fb-crm-live-dom-summary-${safeUid}-${stamp}.txt`;
        downloadTextFile(summaryName, payload);

        const fullDom = document.documentElement?.outerHTML || "";
        const fullBase = `pages-fb-crm-live-dom-full-${safeUid}-${stamp}`;
        const partCount = downloadTextInChunks(fullBase, fullDom, EXPORT_CHUNK_SIZE);

        setDomLiveStatus(
          `Da tai: ${summaryName} + ${partCount} file full DOM. Gui file cho dev.`,
        );
      } catch (error) {
        setDomLiveStatus(
          `Loi xuat DOM: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        STATE.domLiveExporting = false;
        renderPanel();
      }
    }, 80);
  }

  function stopWatching() {
    const key = buildScanKey();
    if (key) void autoSubmitDraftForPreviousCustomer(key);
    STATE.watching = false;
    STATE.lastScanKey = key;
    setStatus("Da dung quet.");
    renderPanel();
  }

  function startWatching() {
    STATE.watching = true;
    scanCurrentCustomer();
    STATE.lastScanKey = buildScanKey();
    setStatus("Dang quet — doi khach hoac doi URL.");
    renderPanel();
  }

  function installPassiveUrlPoll() {
    if (STATE.urlPollTimer) return;
    STATE.urlPollTimer = window.setInterval(() => {
      if (handleCustomerNavigation()) return;
      if (canTrackChatMessages()) {
        if (!chatScrollBound) {
          refreshChatMessagesForCurrentThread();
          if (STATE.chatMessages.length) renderPanel();
        } else if (buildScanKey() === STATE.lastMessagesKey) {
          const added = mergeChatMessagesIntoState({ render: true });
          if (added > 0) return;
        }
      }
      if (!STATE.watching) return;
      const needsRescan =
        isMessengerSource() && STATE.threadId
          ? !STATE.customerName || !STATE.avatarUrl
          : STATE.customerUid && (!STATE.customerName || !STATE.avatarUrl);
      if (needsRescan) {
        scanCurrentCustomer();
        renderPanel();
      }
    }, WATCH_INTERVAL_MS);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        top: 56px;
        right: 12px;
        left: auto;
        z-index: 2147483646;
        width: min(300px, calc(100vw - 24px));
        max-height: calc(100vh - 72px);
        overflow-y: auto;
        overflow-x: hidden;
        font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        font-size: 13px;
        color: #e2e8f0;
        background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 14px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.45);
      }
      #${PANEL_ID} .pf-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px 12px 8px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      }
      #${PANEL_ID} .pf-title { font-weight: 800; font-size: 14px; color: #f8fafc; }
      #${PANEL_ID} .pf-chip {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.25);
        color: #93c5fd;
      }
      #${PANEL_ID} .pf-body { padding: 10px 12px 12px; display: grid; gap: 10px; }
      #${PANEL_ID} .pf-card {
        padding: 10px;
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(148, 163, 184, 0.12);
      }
      #${PANEL_ID} .pf-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 6px;
      }
      #${PANEL_ID} .pf-meta { font-size: 12px; line-height: 1.45; color: #cbd5e1; word-break: break-word; }
      #${PANEL_ID} .pf-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.3);
        background: #0f172a;
        color: #f1f5f9;
        margin-bottom: 8px;
      }
      #${PANEL_ID} .pf-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      #${PANEL_ID} .pf-btn {
        flex: 1;
        min-width: 88px;
        padding: 8px 10px;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        font-size: 12px;
      }
      #${PANEL_ID} .pf-btn.primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
      #${PANEL_ID} .pf-btn.danger { background: rgba(239, 68, 68, 0.2); color: #fecaca; border: 1px solid rgba(239, 68, 68, 0.35); }
      #${PANEL_ID} .pf-btn.ghost { background: rgba(148, 163, 184, 0.15); color: #e2e8f0; }
      #${PANEL_ID} .pf-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        object-fit: cover;
        background: #334155;
        display: block;
        margin-bottom: 8px;
      }
      #${PANEL_ID} .pf-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      #${PANEL_ID} .pf-tag {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
      }
      #${PANEL_ID} .pf-scan-list { display: grid; gap: 2px; margin-top: 4px; }
      #${PANEL_ID} .pf-scan-stack {
        padding: 8px 0;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      }
      #${PANEL_ID} .pf-scan-stack:last-child { border-bottom: none; }
      #${PANEL_ID} .pf-scan-stack-label {
        font-size: 11px;
        line-height: 1.35;
        color: #94a3b8;
        margin-bottom: 4px;
      }
      #${PANEL_ID} .pf-scan-stack-value {
        font-size: 13px;
        line-height: 1.4;
        color: #e2e8f0;
        word-break: break-all;
      }
      #${PANEL_ID} .pf-scan-off .pf-scan-stack-label { opacity: 0.55; }
      #${PANEL_ID} .pf-scan-off .pf-scan-stack-value { color: #64748b; }
      #${PANEL_ID} .pf-scan-group-title {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #64748b;
        margin: 10px 0 4px;
        padding-top: 8px;
        border-top: 1px solid rgba(148, 163, 184, 0.12);
      }
      #${PANEL_ID} .pf-scan-group-title:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }
      #${PANEL_ID} .pf-auth-user {
        font-size: 13px;
        font-weight: 700;
        color: #f1f5f9;
        margin-bottom: 2px;
      }
      #${PANEL_ID} .pf-auth-meta {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 8px;
      }
      #${PANEL_ID} .pf-auth-status {
        font-size: 11px;
        line-height: 1.4;
        margin-top: 8px;
      }
      #${PANEL_ID} .pf-auth-status.ok { color: #86efac; }
      #${PANEL_ID} .pf-auth-status.err { color: #fca5a5; }
      #${PANEL_ID} .pf-msg-hint {
        font-size: 11px;
        color: #64748b;
        margin-bottom: 8px;
        line-height: 1.35;
      }
      #${PANEL_ID} .pf-msg-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      #${PANEL_ID} .pf-msg-toolbar .pf-btn {
        flex: 0 0 auto;
        min-width: auto;
        padding: 6px 12px;
      }
      #${PANEL_ID} .pf-msg-copy-status {
        font-size: 11px;
        color: #86efac;
        line-height: 1.35;
      }
      #${PANEL_ID} .pf-msg-list {
        max-height: 280px;
        overflow-y: auto;
        display: grid;
        gap: 8px;
      }
      #${PANEL_ID} .pf-msg-bubble {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.14);
        background: rgba(15, 23, 42, 0.72);
      }
      #${PANEL_ID} .pf-msg-bubble.pf-msg-customer {
        border-color: rgba(59, 130, 246, 0.28);
        background: rgba(30, 58, 138, 0.22);
      }
      #${PANEL_ID} .pf-msg-bubble.pf-msg-page {
        border-color: rgba(34, 197, 94, 0.28);
        background: rgba(20, 83, 45, 0.18);
      }
      #${PANEL_ID} .pf-msg-bubble.pf-msg-me {
        border-color: rgba(34, 197, 94, 0.28);
        background: rgba(20, 83, 45, 0.18);
      }
      #${PANEL_ID} .pf-msg-bubble-meta {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      #${PANEL_ID} .pf-msg-bubble.pf-msg-customer .pf-msg-bubble-meta { color: #93c5fd; }
      #${PANEL_ID} .pf-msg-bubble.pf-msg-page .pf-msg-bubble-meta { color: #86efac; }
      #${PANEL_ID} .pf-msg-bubble.pf-msg-me .pf-msg-bubble-meta { color: #86efac; }
      #${PANEL_ID} .pf-msg-bubble-text {
        font-size: 12px;
        line-height: 1.45;
        color: #f1f5f9;
        word-break: break-word;
        white-space: pre-wrap;
      }
      #${PANEL_ID} .pf-msg-images {
        display: grid;
        gap: 6px;
        margin-top: 6px;
      }
      #${PANEL_ID} .pf-msg-image-link {
        display: block;
        font-size: 10px;
        color: #93c5fd;
        word-break: break-all;
        text-decoration: underline;
      }
      #${PANEL_ID} .pf-msg-image-embedded {
        display: grid;
        gap: 6px;
      }
      #${PANEL_ID} .pf-msg-image-preview {
        display: block;
        max-width: 100%;
        max-height: 220px;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        object-fit: contain;
        background: rgba(15, 23, 42, 0.55);
      }
      #${PANEL_ID} .pf-msg-image-download {
        width: fit-content;
        font-size: 11px;
        padding: 4px 8px;
      }
      #${PANEL_ID} .pf-msg-image-note {
        font-size: 10px;
        color: #94a3b8;
        line-height: 1.35;
      }
      #${PANEL_ID} .pf-msg-empty {
        padding: 10px;
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.55);
        border: 1px dashed rgba(148, 163, 184, 0.2);
        color: #94a3b8;
        font-size: 12px;
        line-height: 1.45;
      }
      #${PANEL_ID}.collapsed .pf-body { display: none; }
      #${PANEL_ID} .pf-collapsible-card { padding: 0; overflow: hidden; }
      #${PANEL_ID} .pf-section-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        padding: 10px;
        border: none;
        background: transparent;
        color: #94a3b8;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        text-align: left;
      }
      #${PANEL_ID} .pf-section-toggle:hover { color: #cbd5e1; }
      #${PANEL_ID} .pf-section-toggle-label { color: inherit; }
      #${PANEL_ID} .pf-section-toggle-end {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      #${PANEL_ID} .pf-section-toggle-hint {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        color: #64748b;
      }
      #${PANEL_ID} .pf-chevron {
        flex-shrink: 0;
        font-size: 11px;
        color: #64748b;
        transition: transform 0.15s ease;
      }
      #${PANEL_ID} .pf-collapsible-card.pf-section-collapsed .pf-chevron {
        transform: rotate(-90deg);
      }
      #${PANEL_ID} .pf-section-body { padding: 0 10px 10px; }
      #${PANEL_ID} .pf-collapsible-card.pf-section-collapsed .pf-section-body {
        display: none;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function renderScanFieldStack(label, value, enabled) {
    const display = enabled
      ? value
        ? escapeHtml(value)
        : '<span style="color:#64748b">—</span>'
      : '<span style="color:#64748b">Chưa quét</span>';
    return `
      <div class="pf-scan-stack ${enabled ? "" : "pf-scan-off"}">
        <div class="pf-scan-stack-label">${enabled ? "✓" : "○"} ${escapeHtml(label)}</div>
        <div class="pf-scan-stack-value">${display}</div>
      </div>
    `;
  }

  function renderCollapsibleCard({ toggleRole, title, collapsed, bodyHtml }) {
    return `
      <div class="pf-card pf-collapsible-card ${collapsed ? "pf-section-collapsed" : ""}">
        <button type="button" class="pf-section-toggle" data-role="${escapeHtml(toggleRole)}"
          aria-expanded="${collapsed ? "false" : "true"}">
          <span class="pf-section-toggle-label">${escapeHtml(title)}</span>
          <span class="pf-section-toggle-end">
            <span class="pf-section-toggle-hint">${collapsed ? "Mo rong" : "Thu gon"}</span>
            <span class="pf-chevron" aria-hidden="true">▼</span>
          </span>
        </button>
        <div class="pf-section-body">${bodyHtml}</div>
      </div>
    `;
  }

  function renderAuthSection() {
    const user = STATE.auth.user;
    const statusClass =
      STATE.auth.status.startsWith("Đăng nhập thành") ||
      STATE.auth.status.startsWith("Đã đăng xuất")
        ? "ok"
        : STATE.auth.status
          ? "err"
          : "";

    if (hasAuthToken()) {
      const displayName =
        user?.fullName || user?.username || "Đã đăng nhập";
      return `
        <div class="pf-card">
          <div class="pf-label">Đăng nhập Extension</div>
          <div class="pf-auth-user">${escapeHtml(displayName)}</div>
          <div class="pf-auth-meta">${escapeHtml(user?.username || "")}${user?.role ? ` · ${escapeHtml(user.role)}` : ""}</div>
          <button type="button" class="pf-btn danger" data-role="auth-logout" style="width:100%">Đăng xuất</button>
          ${
            STATE.auth.status
              ? `<div class="pf-auth-status ${statusClass}">${escapeHtml(STATE.auth.status)}</div>`
              : ""
          }
        </div>
      `;
    }

    return `
      <div class="pf-card">
        <div class="pf-label">Đăng nhập Extension</div>
        <div class="pf-meta" style="margin-bottom:8px">
          Dùng user/password trong DB (cùng tài khoản đăng nhập FE).
        </div>
        <input class="pf-input" data-role="login-username" type="text" spellcheck="false"
          autocomplete="username" placeholder="Username"
          ${STATE.auth.loggingIn ? "disabled" : ""} />
        <input class="pf-input" data-role="login-password" type="password"
          autocomplete="current-password" placeholder="Mật khẩu"
          ${STATE.auth.loggingIn ? "disabled" : ""} />
        <button type="button" class="pf-btn primary" data-role="auth-login" style="width:100%"
          ${STATE.auth.loggingIn ? "disabled" : ""}>
          ${STATE.auth.loggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        ${
          STATE.auth.status
            ? `<div class="pf-auth-status ${statusClass}">${escapeHtml(STATE.auth.status)}</div>`
            : ""
        }
      </div>
    `;
  }

  function renderMessagesSectionBody() {
    const msgs = STATE.chatMessages || [];

    const listHtml = msgs.length
      ? msgs
          .map((msg, index) => {
            const who = formatMessageSenderLabel(msg.sender);
            const imageUrls = msg.imageUrls || [];
            const textHtml = msg.text
              ? `<div class="pf-msg-bubble-text">${escapeHtml(msg.text)}</div>`
              : "";
            const imagesHtml = imageUrls.length
              ? `<div class="pf-msg-images">${imageUrls
                  .map((url, imgIndex) => renderMessageImageHtml(index, imgIndex, url))
                  .join("")}</div>`
              : "";
            return `
        <div class="pf-msg-bubble pf-msg-${escapeHtml(msg.sender)}">
          <div class="pf-msg-bubble-meta">#${index + 1} · ${escapeHtml(who)}</div>
          ${textHtml}
          ${imagesHtml}
        </div>`;
          })
          .join("")
      : `<div class="pf-msg-empty">Chưa quét được nội dung tin nhắn. Chọn khách trong danh sách và đợi khung chat hiển thị — extension sẽ tự cập nhật.</div>`;

    return `
      <div class="pf-msg-toolbar">
        <button type="button" class="pf-btn ghost" data-role="copy-messages"
          ${msgs.length ? "" : "disabled"}>Copy</button>
        ${
          STATE.messagesCopyStatus
            ? `<span class="pf-msg-copy-status">${escapeHtml(STATE.messagesCopyStatus)}</span>`
            : ""
        }
      </div>
      <div class="pf-msg-hint">Nội dung quét từ khung chat (cuộn lên để load tin cũ). Copy để dán gửi dev.</div>
      <div class="pf-msg-list">${listHtml}</div>
    `;
  }

  function renderMessagesSection() {
    const msgs = STATE.chatMessages || [];
    const titleSuffix = msgs.length ? ` (${msgs.length})` : "";
    return renderCollapsibleCard({
      toggleRole: "toggle-messages-section",
      title: `Nội dung tin nhắn${titleSuffix}`,
      collapsed: STATE.messagesSectionCollapsed,
      bodyHtml: renderMessagesSectionBody(),
    });
  }

  function buildScanInfoFieldsHtml() {
    const sourceLabel = escapeHtml(getScanSourceLabel());
    if (isMessengerSource()) {
      return `
        ${renderScanFieldStack("Nguồn quét", sourceLabel, true)}
        ${renderScanFieldStack("thread_id (URL)", STATE.threadId, true)}
        ${renderScanFieldStack("thread_type", STATE.threadType, true)}
        ${renderScanFieldStack("UID Page / nick NV (nguồn quét)", STATE.employeeUid, true)}
        ${renderScanFieldStack(
          getScanSource() === "messenger_e2ee" ? "UID FB khách (E2EE)" : "UID FB khách",
          STATE.customerUid ||
            (getScanSource() === "messenger_e2ee"
              ? "(chưa có — mở Chi tiết liên hệ bên phải rồi quét lại)"
              : ""),
          true,
        )}
        ${
          getScanSource() === "messenger_e2ee" && STATE.scanDebug?.e2eeCustomerUidSource
            ? renderScanFieldStack(
                "Nguồn UID E2EE",
                `${STATE.scanDebug.e2eeCustomerUidSource} (score ${STATE.scanDebug.e2eeCustomerUidScore || 0})`,
                true,
              )
            : ""
        }
        ${renderScanFieldStack("Tên khách", STATE.customerName, true)}
        ${renderScanFieldStack("Avatar khách", STATE.avatarUrl ? "Có" : "", true)}
      `;
    }
    return `
        ${renderScanFieldStack("Nguồn quét", sourceLabel, true)}
        ${renderScanFieldStack("asset_id", STATE.assetId, true)}
        ${renderScanFieldStack("mailbox_id", STATE.mailboxId, true)}
        ${renderScanFieldStack("business_id", STATE.businessId, true)}
        ${renderScanFieldStack("selected_item_id", STATE.customerUid, true)}
        ${renderScanFieldStack("thread_type", STATE.threadType || "FB_MESSAGE", true)}
        ${renderScanFieldStack("UID Page (đồng bộ)", STATE.myPageUid, true)}
        ${renderScanFieldStack("Tên khách", STATE.customerName, true)}
        ${renderScanFieldStack("Avatar khách", STATE.avatarUrl ? "Có" : "", true)}
      `;
  }

  function renderScanInfoSection() {
    const scanBody = `
      <div class="pf-msg-toolbar">
        <button type="button" class="pf-btn ghost" data-role="copy-scan-info">Copy thông tin quét</button>
        ${
          STATE.scanInfoCopyStatus
            ? `<span class="pf-msg-copy-status">${escapeHtml(STATE.scanInfoCopyStatus)}</span>`
            : ""
        }
      </div>
      ${
        STATE.avatarUrl
          ? `<img class="pf-avatar" src="${escapeHtml(STATE.avatarUrl)}" alt="" />`
          : ""
      }
      <div class="pf-scan-list">
        ${buildScanInfoFieldsHtml()}
      </div>
    `;

    return renderCollapsibleCard({
      toggleRole: "toggle-scan-info-section",
      title: "Thông tin quét",
      collapsed: STATE.scanInfoSectionCollapsed,
      bodyHtml: scanBody,
    });
  }

  function renderPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.classList.toggle("collapsed", STATE.collapsed);
    const versionChip = panel.querySelector(".pf-chip");
    if (versionChip) versionChip.textContent = UI_VERSION;

    const serverBlock = renderCollapsibleCard({
      toggleRole: "toggle-server-section",
      title: "Server CRM",
      collapsed: STATE.serverSectionCollapsed,
      bodyHtml: `
        <input class="pf-input" data-role="server-url" type="url" spellcheck="false"
          value="${escapeHtml(STATE.backendBaseUrl)}"
          placeholder="${escapeHtml(CRM_DEFAULT_API_URL)}"
          ${STATE.backendSaving ? "disabled" : ""} />
        <button type="button" class="pf-btn ghost" data-role="save-server"
          ${STATE.backendSaving ? "disabled" : ""}>Luu</button>
      `,
    });

    const domLiveBlock = renderCollapsibleCard({
      toggleRole: "toggle-dom-live-section",
      title: "Quet DOM LIVE",
      collapsed: STATE.domLiveSectionCollapsed,
      bodyHtml: `
        <div class="pf-meta" style="margin-bottom:8px">
          Xuat snapshot trang inbox hien tai (summary + full DOM) de gui dev phan tich.
        </div>
        <button type="button" class="pf-btn ghost" data-role="export-dom-live"
          style="width:100%"
          ${STATE.domLiveExporting ? "disabled" : ""}>Quet DOM LIVE</button>
        <div class="pf-meta" style="margin-top:8px">${escapeHtml(STATE.domLiveStatus)}</div>
      `,
    });

    const body = panel.querySelector(".pf-body");
    if (body) {
      body.innerHTML = `
        ${renderAuthSection()}
        <div class="pf-card">
          <div class="pf-label">Quét · ${escapeHtml(getScanSourceLabel())}</div>
          <div class="pf-actions">
            <button type="button" class="pf-btn primary" data-role="start-watch"
              ${STATE.watching ? "disabled" : ""}>
              ${STATE.watching ? "Đang quét..." : "Bật quét"}
            </button>
            <button type="button" class="pf-btn danger" data-role="stop-watch"
              ${STATE.watching ? "" : "disabled"}>Dừng</button>
          </div>
          ${
            STATE.draftSubmitting || STATE.draftStatus
              ? `<div class="pf-meta" style="margin-top:8px">${escapeHtml(
                  STATE.draftSubmitting
                    ? STATE.draftStatus || "Đang gửi BE tự động…"
                    : STATE.draftStatus,
                )}</div>`
              : ""
          }
        </div>
        ${renderScanInfoSection()}
        ${renderMessagesSection()}
        ${serverBlock}
        ${domLiveBlock}
      `;
    }

    const toggleBtn = panel.querySelector('[data-role="toggle-panel"]');
    if (toggleBtn) {
      toggleBtn.textContent = STATE.collapsed ? "Mo rong" : "Thu gon";
    }
    hydrateMessageImagePreviews(panel);
  }

  let panelClickBound = false;

  function bindPanelClickHandlers(panel) {
    if (panelClickBound) return;
    panelClickBound = true;

    panel.addEventListener("click", async (event) => {
      const toggle = event.target.closest('[data-role="toggle-panel"]');
      if (toggle) {
        STATE.collapsed = !STATE.collapsed;
        renderPanel();
        return;
      }
      if (event.target.closest('[data-role="start-watch"]')) {
        startWatching();
        return;
      }
      if (event.target.closest('[data-role="stop-watch"]')) {
        stopWatching();
        return;
      }
      if (event.target.closest('[data-role="toggle-scan-info-section"]')) {
        STATE.scanInfoSectionCollapsed = !STATE.scanInfoSectionCollapsed;
        renderPanel();
        return;
      }
      if (event.target.closest('[data-role="toggle-messages-section"]')) {
        STATE.messagesSectionCollapsed = !STATE.messagesSectionCollapsed;
        renderPanel();
        return;
      }
      if (event.target.closest('[data-role="toggle-server-section"]')) {
        STATE.serverSectionCollapsed = !STATE.serverSectionCollapsed;
        renderPanel();
        return;
      }
      if (event.target.closest('[data-role="toggle-dom-live-section"]')) {
        STATE.domLiveSectionCollapsed = !STATE.domLiveSectionCollapsed;
        renderPanel();
        return;
      }
      if (event.target.closest('[data-role="copy-scan-info"]')) {
        await copyScanInfoToClipboard();
        return;
      }
      if (event.target.closest('[data-role="copy-messages"]')) {
        await copyScannedMessagesToClipboard();
        return;
      }
      const downloadImageBtn = event.target.closest('[data-role="download-message-image"]');
      if (downloadImageBtn) {
        downloadMessageImage(
          Number(downloadImageBtn.dataset.messageIndex),
          Number(downloadImageBtn.dataset.imageIndex),
        );
        return;
      }
      if (event.target.closest('[data-role="export-dom-live"]')) {
        exportDomLiveSnapshot();
        return;
      }
      if (event.target.closest('[data-role="save-server"]')) {
        const input = panel.querySelector('[data-role="server-url"]');
        await saveBackendUrl(input?.value || "");
        return;
      }
      if (event.target.closest('[data-role="auth-login"]')) {
        const username = panel.querySelector('[data-role="login-username"]')?.value || "";
        const password = panel.querySelector('[data-role="login-password"]')?.value || "";
        STATE.auth.loggingIn = true;
        STATE.auth.status = "";
        renderPanel();
        try {
          const user = await loginToBackend(username, password);
          STATE.auth.status = `Đăng nhập thành công: ${user?.fullName || user?.username || "OK"}.`;
        } catch (error) {
          STATE.auth.status = error?.message || "Đăng nhập thất bại.";
        } finally {
          STATE.auth.loggingIn = false;
          renderPanel();
        }
        return;
      }
      if (event.target.closest('[data-role="auth-logout"]')) {
        await logoutFromBackend();
        STATE.auth.status = "Đã đăng xuất.";
        renderPanel();
        return;
      }
    });
  }

  function createPanel() {
    injectStyles();

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.innerHTML = `
      <header class="pf-header">
        <div>
          <div class="pf-title">Anhungland Extension</div>
          <span class="pf-chip">${escapeHtml(UI_VERSION)}</span>
        </div>
        <button type="button" class="pf-btn ghost" data-role="toggle-panel" style="flex:0;min-width:auto">Thu gon</button>
      </header>
      <div class="pf-body"></div>
    `;
      document.documentElement.appendChild(panel);
    }

    bindPanelClickHandlers(panel);
    renderPanel();
  }

  function onUrlChange() {
    handleCustomerNavigation();
  }

  function installUrlWatcher() {
    const wrap = (fn) =>
      function (...args) {
        const result = fn.apply(this, args);
        queueMicrotask(onUrlChange);
        return result;
      };
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener("popstate", onUrlChange);
  }

  function boot() {
    if (!isExtensionActive()) {
      return;
    }

    installUrlWatcher();
    installPassiveUrlPoll();
    hydrateBackendUrl(() => {
      scanCurrentCustomer();
      STATE.lastScanKey = buildScanKey();
      captureAutoDraftSnapshot();
      createPanel();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
