/**
 * Chrome extension zip for staff and visitors.
 * Same stable URL as apps/extension/README.md: GitHub raw on main
 * for release/an-hung-land-crm-extension-latest.zip.
 */
export const CHROME_EXTENSION_DOWNLOAD_URL =
  'https://github.com/BuiXuanKha/CRMAnHung/raw/main/apps/extension/release/an-hung-land-crm-extension-latest.zip';

export function PublicExtensionNavLink() {
  return <a href={CHROME_EXTENSION_DOWNLOAD_URL}>Tải extension</a>;
}
