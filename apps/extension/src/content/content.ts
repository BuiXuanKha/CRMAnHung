/**
 * Content script stub — P1 sẽ port scanner từ AnhunglandExtension.
 * Hiện chỉ đánh dấu trang Meta đã gắn CRMAnHung.
 */
const markerId = 'crmanhung-ext-marker';
if (!document.getElementById(markerId)) {
  const el = document.createElement('div');
  el.id = markerId;
  el.textContent = 'CRMAnHung Extension (stub)';
  el.style.cssText =
    'position:fixed;z-index:999999;right:12px;bottom:12px;background:#123528;color:#e7f2ec;padding:8px 12px;border-radius:8px;font:12px/1.4 system-ui;opacity:0.85;';
  document.documentElement.appendChild(el);
}

export {};
