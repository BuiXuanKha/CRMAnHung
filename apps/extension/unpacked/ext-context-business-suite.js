/**
 * Context cho Meta Business Suite Inbox — load trước content-inbox.js
 * Page ID (asset): asset_id / mailbox_id trên URL
 * UID page của tôi: page_uri_token / profile_plus trong DOM (hoặc page_id URL)
 * UID khách: selected_item_id (param URL Business Suite)
 */
(function () {
  "use strict";

  function getSearchParams() {
    try {
      return new URL(window.location.href).searchParams;
    } catch (_e) {
      return new URLSearchParams(window.location.search || "");
    }
  }

  function firstParam(params, keys) {
    for (const key of keys) {
      const value = String(params.get(key) || "").trim();
      if (value) return value;
    }
    return "";
  }

  function resolveAssetId() {
    return firstParam(getSearchParams(), ["asset_id"]);
  }

  function resolveMailboxId() {
    const params = getSearchParams();
    return firstParam(params, ["mailbox_id"]) || firstParam(params, ["asset_id"]);
  }

  function resolveBusinessId() {
    return firstParam(getSearchParams(), ["business_id"]);
  }

  function resolveThreadType() {
    return firstParam(getSearchParams(), ["thread_type"]) || "FB_MESSAGE";
  }

  /** @deprecated alias — dùng resolveAssetId */
  function resolvePageId() {
    return resolveAssetId() || resolveMailboxId();
  }

  /** UID Page Facebook (page_uri_token / profile_plus) — khác asset_id Business Suite. */
  function resolveMyPageUid() {
    const params = getSearchParams();
    return firstParam(params, ["page_id"]);
  }

  function resolveCustomerUid() {
    const params = getSearchParams();
    return firstParam(params, ["selected_item_id"]);
  }

  function getUrlParamSnapshot() {
    const params = getSearchParams();
    const keys = [
      "asset_id",
      "mailbox_id",
      "page_id",
      "selected_item_id",
      "selected_thread_id",
      "thread_type",
      "business_id",
    ];
    const out = {};
    for (const key of keys) {
      const value = String(params.get(key) || "").trim();
      if (value) out[key] = value;
    }
    return out;
  }

  function isBusinessInboxPath() {
    try {
      return /\/latest\/inbox\b/i.test(new URL(window.location.href).pathname);
    } catch (_e) {
      return /\/latest\/inbox\b/i.test(window.location.pathname || "");
    }
  }

  window.__ANHUNGLAND_EXT_CONTEXT__ = {
    source: "business_suite",
    businessSuiteInbox: true,
    isActivePath: isBusinessInboxPath,
    isBusinessInboxPath,
    buildScanKey() {
      return [resolveAssetId(), resolveCustomerUid()].filter(Boolean).join("::");
    },
    resolveAssetId,
    resolveMailboxId,
    resolveBusinessId,
    resolveThreadType,
    resolvePageId,
    resolveMyPageUid,
    resolveCustomerUid,
    getUrlParamSnapshot,
  };
})();
