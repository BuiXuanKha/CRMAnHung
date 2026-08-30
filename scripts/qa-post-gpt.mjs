#!/usr/bin/env node
/** QA contract + parse for project-post GPT (no live OpenAI). */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  POST_GPT_SYSTEM_PROMPT,
  PublicPostCategory,
  postGptContentResultSchema,
  postGptRequestPayloadSchema,
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

console.log('QA post GPT (project article)\n');

if (POST_GPT_SYSTEM_PROMPT.includes('An Hưng Land') && POST_GPT_SYSTEM_PROMPT.includes('bodyHtml')) {
  ok('system prompt An Hưng Land + bodyHtml');
} else {
  bad('POST_GPT_SYSTEM_PROMPT thiếu An Hưng Land / bodyHtml');
}
if (POST_GPT_SYSTEM_PROMPT.includes('Không chắc thì BỎ')) {
  ok('prompt cấm bịa khi không chắc');
} else {
  bad('prompt chưa cấm bịa');
}

const req = postGptRequestPayloadSchema.safeParse({
  projectName: 'Khu đô thị Tây Nam Sách',
  category: PublicPostCategory.DU_AN,
  site: 'An Hưng Land',
  locale: 'Nam Sách, Hải Dương',
});
if (req.success) ok('request payload hợp lệ');
else bad(`request: ${req.error.issues[0]?.message}`);

const empty = postGptRequestPayloadSchema.safeParse({
  projectName: '  ',
  category: PublicPostCategory.DU_AN,
});
if (!empty.success) ok('tên dự án trống bị từ chối');
else bad('tên dự án trống vẫn pass');

const sample = {
  seoTitle: 'Khu đô thị Tây Nam Sách Nam Sách',
  h1: 'Khu đô thị Tây Nam Sách',
  metaDescription:
    'Khu đô thị Tây Nam Sách tại thị trấn Nam Sách, Hải Dương — vị trí trung tâm, quy mô lớn.',
  slug: 'khu-do-thi-tay-nam-sach',
  excerpt: 'Giới thiệu KĐT Tây Nam Sách, thị trấn Nam Sách.',
  bodyHtml: '<p>Mở bài.</p><h2>Vị trí và kết nối</h2><p>Thị trấn Nam Sách.</p>',
  facebookPost: 'KĐT Tây Nam Sách — Nam Sách, Hải Dương.',
  locationLabel: 'Nam Sách, Hải Dương',
};
const parsed = postGptContentResultSchema.safeParse(sample);
if (parsed.success) ok('response JSON sample parse được');
else bad(`response: ${parsed.error.issues[0]?.message}`);

const dialog = readFileSync(
  resolve(root, 'apps/web/src/features/public-content/components/post-gpt-content-dialog.tsx'),
  'utf8',
);
if (dialog.includes('Soạn bài bằng GPT AI') && dialog.includes('generatePostGptContent')) {
  ok('modal GPT trên CRM');
} else {
  bad('thiếu post-gpt-content-dialog');
}

const listPage = readFileSync(
  resolve(root, 'apps/web/src/features/public-content/public-post-list-page.tsx'),
  'utf8',
);
if (listPage.includes('PostGptContentDialog') && listPage.includes('onComposeGpt')) {
  ok('list /bai-viet gắn nút GPT');
} else {
  bad('public-post-list-page chưa gắn GPT');
}

const controller = readFileSync(
  resolve(root, 'apps/api/src/modules/public-content/admin-public-web.controller.ts'),
  'utf8',
);
if (controller.includes("posts/gpt-content") && controller.includes('PostGptService')) {
  ok('POST /admin/public-web/posts/gpt-content');
} else {
  bad('controller thiếu posts/gpt-content');
}

console.log(`\n${failed === 0 ? 'PASS' : `FAIL (${failed} checks)`}`);
process.exit(failed === 0 ? 0 : 1);
