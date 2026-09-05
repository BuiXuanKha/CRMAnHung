/**
 * Nhận diện nguồn quét theo URL — dùng chung mọi content script.
 */
(function () {
  "use strict";

  const ANHUNGLAND_SOURCES = {
    BUSINESS_SUITE: "business_suite",
    MESSENGER_STANDARD: "messenger_standard",
    MESSENGER_E2EE: "messenger_e2ee",
    UNKNOWN: "unknown",
  };

  const SOURCE_LABELS = {
    [ANHUNGLAND_SOURCES.BUSINESS_SUITE]: "Business Suite",
    [ANHUNGLAND_SOURCES.MESSENGER_STANDARD]: "Messenger (facebook.com)",
    [ANHUNGLAND_SOURCES.MESSENGER_E2EE]: "Messenger E2EE (facebook.com)",
    [ANHUNGLAND_SOURCES.UNKNOWN]: "Không xác định",
  };

  function detectSourceFromLocation(loc) {
    const href = String(loc?.href || "");
    let pathname = String(loc?.pathname || "");
    let host = String(loc?.host || "").toLowerCase();

    try {
      const url = new URL(href);
      pathname = url.pathname;
      host = url.host.toLowerCase();
    } catch (_e) {
      /* use raw values */
    }

    if (/business\.facebook\.com$/i.test(host) && /\/latest\/inbox\b/i.test(pathname)) {
      return ANHUNGLAND_SOURCES.BUSINESS_SUITE;
    }

    const isFacebookHost = /(^|\.)facebook\.com$/i.test(host);
    if (isFacebookHost) {
      if (/\/messages\/e2ee\/t\/[^/]+/i.test(pathname)) {
        return ANHUNGLAND_SOURCES.MESSENGER_E2EE;
      }
      if (/\/messages\/t\/[^/]+/i.test(pathname)) {
        return ANHUNGLAND_SOURCES.MESSENGER_STANDARD;
      }
    }

    return ANHUNGLAND_SOURCES.UNKNOWN;
  }

  function getSourceLabel(source) {
    return SOURCE_LABELS[source] || SOURCE_LABELS[ANHUNGLAND_SOURCES.UNKNOWN];
  }

  window.ANHUNGLAND_SOURCES = ANHUNGLAND_SOURCES;
  window.detectAnhunglandSource = detectSourceFromLocation;
  window.getAnhunglandSourceLabel = getSourceLabel;
})();
