import extensionManifest from '../../../../extension/manifest.json';

/**
 * Chrome extension zip for staff and visitors.
 * Filename includes apps/extension/manifest.json version so the saved
 * file is an-hung-land-crm-extension-<version>.zip (not latest.zip).
 * The extension README repeats this URL as a static string — update that
 * href when the manifest version changes.
 */
const EXTENSION_VERSION = String(extensionManifest.version || '0.0.0').trim();

export const CHROME_EXTENSION_ZIP_NAME = `an-hung-land-crm-extension-${EXTENSION_VERSION}.zip`;

export const CHROME_EXTENSION_DOWNLOAD_URL = `https://github.com/BuiXuanKha/CRMAnHung/raw/main/apps/extension/release/${CHROME_EXTENSION_ZIP_NAME}`;

export function PublicExtensionNavLink() {
  return (
    <a href={CHROME_EXTENSION_DOWNLOAD_URL} download={CHROME_EXTENSION_ZIP_NAME}>
      Tải extension
    </a>
  );
}
