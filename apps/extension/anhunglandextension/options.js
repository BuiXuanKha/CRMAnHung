const statusEl = document.getElementById('status');
const input = document.getElementById('apiUrl');
const saveBtn = document.getElementById('saveBtn');
const versionLine = document.getElementById('versionLine');

if (versionLine) {
  versionLine.textContent = `v${CRM_EXTENSION_VERSION}`;
}

function setStatus(text) {
  statusEl.textContent = text || '';
}

function pickApiUrl(items) {
  return (
    items?.[BACKEND_URL_STORAGE_KEY] ||
    items?.[LEGACY_BACKEND_URL_STORAGE_KEY] ||
    CRM_DEFAULT_API_URL
  );
}

chrome.storage.local.get(
  [BACKEND_URL_STORAGE_KEY, LEGACY_BACKEND_URL_STORAGE_KEY],
  (items) => {
    input.value = pickApiUrl(items);
  },
);

saveBtn.addEventListener('click', () => {
  let value = String(input.value || '').trim() || CRM_DEFAULT_API_URL;
  try {
    const url = new URL(value);
    let path = (url.pathname || '').replace(/\/+$/, '');
    if (!path || path === '/') path = '/api/v1';
    if (path === '/api') path = '/api/v1';
    if (url.host.toLowerCase() === 'crm.anhungland.com') {
      value = CRM_DEFAULT_API_URL;
    } else {
      value = `${url.protocol}//${url.host}${path}`;
    }
  } catch (_e) {
    value = CRM_DEFAULT_API_URL;
  }
  chrome.storage.local.set({ [BACKEND_URL_STORAGE_KEY]: value }, () => {
    input.value = value;
    setStatus('Đã lưu API URL.');
  });
});
