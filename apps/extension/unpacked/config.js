const CRM_DEFAULT_API_URL = 'https://anhungland.com/api/v1';
const CRM_DEFAULT_WEB_URL = 'https://anhungland.com';
const BACKEND_URL_STORAGE_KEY = 'anhungland_ext_api_url';
const AUTH_TOKEN_STORAGE_KEY = 'anhungland_ext_jwt';
const AUTH_REFRESH_STORAGE_KEY = 'anhungland_ext_refresh';
const AUTH_USER_STORAGE_KEY = 'anhungland_ext_user';
/** @deprecated — đọc một lần để migrate cài đặt cũ */
const LEGACY_BACKEND_URL_STORAGE_KEY = 'pages_facebook_customer_crm_api_url';
const LEGACY_AUTH_TOKEN_STORAGE_KEY = 'pages_facebook_customer_crm_jwt';
const LEGACY_AUTH_USER_STORAGE_KEY = 'pages_facebook_customer_crm_user';
const API_FETCH_TYPE = 'ANHUNGLAND_EXT_API_FETCH';
/** @deprecated — background vẫn nhận message type cũ */
const LEGACY_API_FETCH_TYPE = 'FACEBOOK_CRM_API_FETCH';
/** Chỉ sửa version trong manifest.json — các file JS đọc qua getManifest(). */
function resolveExtensionVersion() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      const v = String(chrome.runtime.getManifest().version || '').trim();
      if (v) return v;
    }
  } catch (_e) {
    /* ignore */
  }
  return '2.12.0';
}

const CRM_EXTENSION_VERSION = resolveExtensionVersion();
/** Nhãn hiển thị trên panel inbox + payload copy/gửi CRM */
const CRM_EXTENSION_UI_LABEL = `v${CRM_EXTENSION_VERSION}`;
