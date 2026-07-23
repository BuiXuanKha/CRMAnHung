const STORAGE_KEYS = {
  apiUrl: 'crmanhung_ext_api_url',
  accessToken: 'crmanhung_ext_access_token',
  refreshToken: 'crmanhung_ext_refresh_token',
  user: 'crmanhung_ext_user',
} as const;

const form = document.getElementById('form') as HTMLFormElement;
const statusEl = document.getElementById('status') as HTMLParagraphElement;
const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;

async function boot() {
  const stored = await chrome.storage.local.get([STORAGE_KEYS.apiUrl, STORAGE_KEYS.user]);
  apiUrlInput.value =
    (stored[STORAGE_KEYS.apiUrl] as string) || 'http://localhost:5050/api/v1';
  const user = stored[STORAGE_KEYS.user] as { fullName?: string } | undefined;
  if (user?.fullName) {
    statusEl.className = 'ok';
    statusEl.textContent = `Đã đăng nhập: ${user.fullName}`;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  void (async () => {
    statusEl.className = '';
    statusEl.textContent = 'Đang đăng nhập…';
    const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '');
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordInput.value,
        }),
      });
      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
        user?: { fullName: string };
        message?: string;
      };
      if (!res.ok || !data.accessToken || !data.refreshToken || !data.user) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }
      await chrome.storage.local.set({
        [STORAGE_KEYS.apiUrl]: apiUrl,
        [STORAGE_KEYS.accessToken]: data.accessToken,
        [STORAGE_KEYS.refreshToken]: data.refreshToken,
        [STORAGE_KEYS.user]: data.user,
      });
      statusEl.className = 'ok';
      statusEl.textContent = `Đã đăng nhập: ${data.user.fullName}`;
      passwordInput.value = '';
    } catch (err) {
      statusEl.className = 'err';
      statusEl.textContent = err instanceof Error ? err.message : 'Lỗi đăng nhập';
    }
  })();
});

void boot();
