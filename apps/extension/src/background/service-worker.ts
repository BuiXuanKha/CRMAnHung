const STORAGE_KEYS = {
  apiUrl: 'crmanhung_ext_api_url',
  accessToken: 'crmanhung_ext_access_token',
  refreshToken: 'crmanhung_ext_refresh_token',
  user: 'crmanhung_ext_user',
} as const;

chrome.runtime.onInstalled.addListener(() => {
  console.info('[crmanhung-ext] installed');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'API_FETCH') {
    void handleApiFetch(message).then(sendResponse);
    return true;
  }
  return false;
});

async function handleApiFetch(message: {
  path: string;
  init?: RequestInit;
}) {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.apiUrl,
    STORAGE_KEYS.accessToken,
  ]);
  const apiUrl = (stored[STORAGE_KEYS.apiUrl] as string) || 'http://localhost:5050/api/v1';
  const token = stored[STORAGE_KEYS.accessToken] as string | undefined;

  const headers = new Headers(message.init?.headers);
  if (message.init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${apiUrl}${message.path}`, {
      ...message.init,
      headers,
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}

export {};
