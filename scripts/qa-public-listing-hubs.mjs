#!/usr/bin/env node
/**
 * Slice E — QA SEO hub lô + catalog path (chạy local trước deploy).
 * Usage: pnpm qa:public-hubs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_LISTING_PATH,
  PUBLIC_LISTING_HUB_SEGMENT,
  listingCommuneHubPath,
  listingPlaceHubPath,
  toPublicSlug,
  seoImageFileName,
  seoLotImageObjectKey,
  seoImageExt,
  isSeoNamedImageKey,
  PUBLIC_SEO_IMAGE_EXT,
} from '../packages/shared/dist/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(msg) {
  console.log(`  OK  ${msg}`);
}
function bad(msg) {
  console.log(` FAIL ${msg}`);
  failed += 1;
}

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

console.log('QA public listing hubs (Slice E)\n');

console.log('Path constants');
if (PUBLIC_LISTING_PATH === '/mua-ban-nha-dat-huyen-nam-sach') {
  ok(`PUBLIC_LISTING_PATH = ${PUBLIC_LISTING_PATH}`);
} else {
  bad(`PUBLIC_LISTING_PATH unexpected: ${PUBLIC_LISTING_PATH}`);
}

const communePath = listingCommuneHubPath('nam-trung');
const placePath = listingPlaceHubPath('nam-trung', 'kdt-tay-nam-sach');
const expectedCommune = `${PUBLIC_LISTING_PATH}/${PUBLIC_LISTING_HUB_SEGMENT}/nam-trung`;
const expectedPlace = `${expectedCommune}/kdt-tay-nam-sach`;

if (communePath === expectedCommune) ok(`commune hub path ${communePath}`);
else bad(`commune hub path: got ${communePath}, want ${expectedCommune}`);

if (placePath === expectedPlace) ok(`place hub path ${placePath}`);
else bad(`place hub path: got ${placePath}, want ${expectedPlace}`);

if (!communePath.startsWith('/du-an') && !placePath.startsWith('/du-an')) {
  ok('hub paths không trùng prefix bài viết /du-an');
} else {
  bad('hub path bắt đầu bằng /du-an — trùng CMS');
}

if (communePath.startsWith(PUBLIC_LISTING_PATH) && placePath.startsWith(PUBLIC_LISTING_PATH)) {
  ok('hub paths nằm dưới catalog lô');
} else {
  bad('hub paths không nằm dưới PUBLIC_LISTING_PATH');
}

console.log('\nrobots.txt source');
const robotsSrc = read('apps/web/app/robots.ts');
if (robotsSrc.includes("allow: '/'")) ok('robots allow /');
else bad('robots thiếu allow /');

const crmBlocks = ['/login', '/khach-hang', '/lo-dat', '/dashboard', '/quan-tri', '/api'];
for (const p of crmBlocks) {
  if (robotsSrc.includes(`'${p}'`) || robotsSrc.includes(`"${p}"`)) ok(`robots disallow ${p}`);
  else bad(`robots thiếu disallow ${p}`);
}

if (robotsSrc.includes('mua-ban-nha-dat-huyen-nam-sach') && robotsSrc.includes('disallow')) {
  bad('robots có thể chặn nhầm catalog path mới');
} else {
  ok('robots không disallow catalog mới');
}

if (
  robotsSrc.includes('isPublicSearchIndexEnabled') &&
  robotsSrc.includes('sitemap:')
) {
  ok('robots chỉ gắn Sitemap khi PUBLIC_SEO_INDEX bật');
} else {
  bad('robots.ts thiếu cổng sitemap theo PUBLIC_SEO_INDEX');
}

console.log('\nCRM noindex');
const crmLayout = read('apps/web/app/(crm)/layout.tsx');
if (
  crmLayout.includes('index: false') &&
  crmLayout.includes('follow: false')
) {
  ok('(crm)/layout robots noindex,nofollow');
} else {
  bad('CRM layout thiếu noindex');
}

console.log('\nHub 404 / noindex metadata');
const hubSeo = read('apps/web/src/features/public/listing-hub-seo.ts');
if (hubSeo.includes('index: false') && hubSeo.includes('unpublishedHubMetadata')) {
  ok('unpublishedHubMetadata noindex');
} else {
  bad('hub SEO thiếu unpublished noindex');
}

console.log('\nCatalog path (no legacy redirects)');
const nextConfig = read('apps/web/next.config.ts');
if (
  !nextConfig.includes("source: '/mua-ban-nha-dat'") &&
  !nextConfig.includes("source: '/san-pham'")
) {
  ok('next.config không redirect /mua-ban-nha-dat hay /san-pham');
} else {
  bad('next.config vẫn còn redirect path cũ');
}

console.log('\nPublic search-index gate');
const searchIndexSrc = read('apps/web/src/features/public/search-index.ts');
if (
  searchIndexSrc.includes('PUBLIC_SEO_INDEX') &&
  searchIndexSrc.includes('isPublicSearchIndexEnabled') &&
  searchIndexSrc.includes('publicSearchRobots')
) {
  ok('search-index.ts cổng PUBLIC_SEO_INDEX');
} else {
  bad('thiếu apps/web/src/features/public/search-index.ts');
}

const publicLayout = read('apps/web/app/(public)/layout.tsx');
if (publicLayout.includes('publicSearchRobots')) {
  ok('(public)/layout robots theo cờ index');
} else {
  bad('public layout chưa dùng publicSearchRobots');
}

console.log('\nSitemap includes hub segments');
const sitemapSrc = read('apps/web/app/sitemap.ts');
if (sitemapSrc.includes('isPublicSearchIndexEnabled') && sitemapSrc.includes('return []')) {
  ok('sitemap rỗng khi PUBLIC_SEO_INDEX tắt');
} else {
  bad('sitemap.ts thiếu early return khi cờ index tắt');
}
if (sitemapSrc.includes('listCommuneHubs') && sitemapSrc.includes('listPlaceHubs')) {
  ok('sitemap gọi listCommuneHubs + listPlaceHubs');
} else {
  bad('sitemap thiếu hub lists');
}

if (
  sitemapSrc.includes('listingSeoImageUrls') &&
  sitemapSrc.includes('postSeoImageUrls') &&
  sitemapSrc.includes('images')
) {
  ok('sitemap gắn image:loc lô + bài');
} else {
  bad('sitemap thiếu listingSeoImageUrls / postSeoImageUrls');
}

console.log('\nImage SEO helpers');
const imageSeo = read('apps/web/src/features/public/listing-image-seo.ts');
if (imageSeo.includes('uniqueAbsolutePublicImageUrls') && imageSeo.includes('isBrandOgFallback')) {
  ok('listing-image-seo lọc URL + bỏ og-default');
} else {
  bad('listing-image-seo thiếu uniqueAbsolutePublicImageUrls');
}

const listingSeo = read('apps/web/src/features/public/listing-seo.ts');
if (listingSeo.includes('ImageObject') && listingSeo.includes('listingImageAltText')) {
  ok('JSON-LD lô dùng ImageObject + caption');
} else {
  bad('listing-seo thiếu ImageObject');
}

const gallerySrc = read('apps/web/src/features/public/product-detail-client.tsx');
if (gallerySrc.includes('pd-gallery-slides') && gallerySrc.includes('alts')) {
  ok('gallery SSR mọi URL + alt');
} else {
  bad('gallery chưa SSR đủ ảnh / alt');
}

function extractHtmlImageSrcs(html) {
  const out = [];
  const re = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;
  while ((match = re.exec(html))) {
    const src = (match[1] ?? match[2] ?? '').trim();
    if (src) out.push(src);
  }
  return out;
}

const extracted = extractHtmlImageSrcs(
  '<p><img src="https://cdn.anhungland.com/a.jpg"><img alt="x" src=\'https://cdn.anhungland.com/b.png\'></p>',
);
if (
  extracted[0] === 'https://cdn.anhungland.com/a.jpg' &&
  extracted[1] === 'https://cdn.anhungland.com/b.png'
) {
  ok('extractHtmlImageSrcs lấy src cover + body');
} else {
  bad(`extractHtmlImageSrcs: ${JSON.stringify(extracted)}`);
}

console.log('\nSlug helper (xã / KĐT)');
const xaSlug = toPublicSlug('Nam Trung', 60, 'xa');
const kdtSlug = toPublicSlug('KĐT Tây Nam Sách', 60, 'khu');
if (xaSlug === 'nam-trung') ok(`toPublicSlug xã → ${xaSlug}`);
else bad(`toPublicSlug xã: ${xaSlug}`);

if (kdtSlug.includes('kdt') && kdtSlug.includes('nam-sach')) ok(`toPublicSlug KĐT → ${kdtSlug}`);
else bad(`toPublicSlug KĐT: ${kdtSlug}`);

console.log('\nSEO image filename at upload');
const jpegName = seoImageFileName({
  title: 'Lô nhà cấp 4 mới 113,8m²',
  location: 'KĐT Tây Nam Sách, Nam Trung',
  index: 1,
  ext: seoImageExt('IMG_4521.JPG', 'image/jpeg'),
});
if (jpegName.endsWith('-anh-1.jpg')) ok(`seoImageExt JPEG nguồn → ${jpegName.split('-anh-1')[1]}`);
else bad(`seoImageExt JPEG unexpected: ${jpegName}`);

const seoName = seoImageFileName({
  title: 'Lô nhà cấp 4 mới 113,8m²',
  location: 'KĐT Tây Nam Sách, Nam Trung',
  index: 1,
  ext: PUBLIC_SEO_IMAGE_EXT,
});
const seoKey = seoLotImageObjectKey('clxyz123', seoName);
if (seoName.includes('lo-nha-cap-4') && seoName.includes('nam-trung') && seoName.endsWith('-anh-1.webp')) {
  ok(`seoImageFileName public → ${seoName}`);
} else {
  bad(`seoImageFileName unexpected: ${seoName}`);
}
if (seoName.includes('img') || seoName.includes('4521')) {
  bad('seoImageFileName còn tên file điện thoại');
} else {
  ok('seoImageFileName không dùng IMG_4521');
}
if (seoKey.startsWith('lodats/clxyz123/') && seoKey.endsWith(seoName)) {
  ok('seoLotImageObjectKey dưới lodats/{id}/');
} else {
  bad(`seoLotImageObjectKey: ${seoKey}`);
}

if (isSeoNamedImageKey(seoName) && !isSeoNamedImageKey('lodats/x/IMG_4521.jpg')) {
  ok('isSeoNamedImageKey nhận slug-anh-n, bỏ IMG_');
} else {
  bad('isSeoNamedImageKey sai');
}

const addImageSrc = read('apps/api/src/modules/lodats/lodats.service.ts');
if (addImageSrc.includes('uniqueSeoLotImageKey') && addImageSrc.includes('copyPublicImageToSeoLotKey')) {
  ok('upload lô + ảnh chat dùng key SEO');
} else {
  bad('lodats.service chưa gắn uniqueSeoLotImageKey');
}

const seoScript = resolve(root, 'apps/api/scripts/seo-copy-lot-images.ts');
if (existsSync(seoScript)) ok('script images:seo-copy');
else bad('thiếu scripts/seo-copy-lot-images.ts');

const addrSeoScript = resolve(root, 'apps/api/scripts/seo-copy-orphan-addresses.ts');
if (existsSync(addrSeoScript)) ok('script images:seo-copy-addresses');
else bad('thiếu scripts/seo-copy-orphan-addresses.ts');

const listingSeoSrc = read('apps/web/src/features/public/listing-seo.ts');
if (
  listingSeoSrc.includes('isPublicAddressImageUrl') &&
  listingSeoSrc.includes('placeLabel')
) {
  ok('alt ảnh dự án dùng tên dự án (placeLabel)');
} else {
  bad('listing-seo chưa tách alt ảnh /addresses/');
}

const publishSeoSrc = read('apps/api/src/modules/public-content/public-content.service.ts');
if (
  publishSeoSrc.includes('projectAddressSeoFields') &&
  !publishSeoSrc.includes("lodat.projectLot?.title?.trim() || addr.detail")
) {
  ok('Đăng web đặt key ảnh dự án theo Address.detail');
} else {
  bad('ensureSeoImageKeysForLodat còn lấy tên lô cho ảnh dự án');
}

const webpHelper = read('apps/api/src/storage/to-public-webp.ts');
if (
  webpHelper.includes('toPublicWebp') &&
  webpHelper.includes('.webp(') &&
  webpHelper.includes('PUBLIC_WEBP_MAX_EDGE')
) {
  ok('sharp toPublicWebp (WebP + max edge)');
} else {
  bad('thiếu apps/api/src/storage/to-public-webp.ts');
}

const storageUpload = read('apps/api/src/storage/storage.service.ts');
if (
  storageUpload.includes('preparePublicRaster') &&
  storageUpload.includes('toPublicWebp') &&
  storageUpload.includes('async uploadPrivate')
) {
  ok('upload public convert WebP; private không convert');
} else {
  bad('StorageService chưa convert WebP ở upload public');
}

const seoCopySrc = read('apps/api/src/modules/lodats/lodat-seo-image-upload.ts');
if (
  seoCopySrc.includes('PUBLIC_SEO_IMAGE_EXT') &&
  seoCopySrc.includes('isWebpObjectKey') &&
  seoCopySrc.includes('toPublicWebp')
) {
  ok('SEO copy đích .webp + encode WebP');
} else {
  bad('lodat-seo-image-upload chưa khóa WebP');
}

console.log('\nRoute files');
const routes = [
  'apps/web/app/(public)/mua-ban-nha-dat-huyen-nam-sach/page.tsx',
  'apps/web/app/(public)/mua-ban-nha-dat-huyen-nam-sach/[slug]/page.tsx',
  'apps/web/app/(public)/mua-ban-nha-dat-huyen-nam-sach/xa/[commune]/page.tsx',
  'apps/web/app/(public)/mua-ban-nha-dat-huyen-nam-sach/xa/[commune]/[place]/page.tsx',
];
for (const r of routes) {
  if (existsSync(resolve(root, r))) ok(`route ${r.split('/').slice(-2).join('/')}`);
  else bad(`thiếu ${r}`);
}

console.log(`\n${failed === 0 ? 'PASS' : `FAIL (${failed} checks)`}`);
process.exit(failed === 0 ? 0 : 1);
