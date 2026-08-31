/** GA4 measurement ID — public (có trong HTML). Mã cơ sở dán vào `<head>` layout gốc. */
export const GA4_MEASUREMENT_ID = 'G-W3L76S9YTD';

export const GA4_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;

/** Đúng snippet Google tag (gtag.js) — chạy trong `<head>`. */
export const GA4_HEAD_INLINE = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_MEASUREMENT_ID}');
`;
