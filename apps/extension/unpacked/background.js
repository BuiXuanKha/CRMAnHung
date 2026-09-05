const API_FETCH_TYPE = 'ANHUNGLAND_EXT_API_FETCH';
const LEGACY_API_FETCH_TYPE = 'FACEBOOK_CRM_API_FETCH';

function handleApiFetch(message, sendResponse) {
  const payload = message.payload || {};
  const url = payload.url;
  const init = payload.init || {};
  fetch(url, init)
    .then(async (response) => {
      const text = await response.text();
      sendResponse({ ok: response.ok, status: response.status, text });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: String(error?.message || error) });
    });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === API_FETCH_TYPE || message?.type === LEGACY_API_FETCH_TYPE) {
    handleApiFetch(message, sendResponse);
    return true;
  }
  return undefined;
});
