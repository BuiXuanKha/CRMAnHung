#!/usr/bin/env node
/** One-off test: lot GPT prompt + sample payload → OpenAI response */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, 'apps/api/.env');
const envText = readFileSync(envPath, 'utf8');
const apiKey = envText.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim();
const model = envText.match(/^OPENAI_MODEL=(.+)$/m)?.[1]?.trim() || 'gpt-5.6-sol';

if (!apiKey) {
  console.error('Missing OPENAI_API_KEY in apps/api/.env');
  process.exit(1);
}

const { LOT_GPT_SYSTEM_PROMPT } = await import(
  '../apps/api/dist/modules/public-content/lot-gpt-prompt.js'
).catch(async () => {
  const src = readFileSync(
    resolve(root, 'apps/api/src/modules/public-content/lot-gpt-prompt.ts'),
    'utf8',
  );
  const match = src.match(/export const LOT_GPT_SYSTEM_PROMPT = `([\s\S]*?)`;/);
  return { LOT_GPT_SYSTEM_PROMPT: match?.[1] ?? '' };
});

const payload = {
  title: 'Lô 33 đấu giá Mạn Đê Nam Trung',
  location: {
    village: 'Mạn Đê',
    commune: 'Nam Trung',
    district: 'Nam Sách',
    province: 'Hải Dương',
  },
  area: 83,
  residentialArea: null,
  frontage: 4.5,
  direction: 'Bắc',
  price: null,
  priceText: '2 tỷ xxx',
  kind: 'DAT',
  excerpt:
    'Lô 33 đấu giá Mạn Đê Nam Trung tại Mạn Đê, Nam Trung, Nam Sách, Hải Dương. Đất · DT 83 m² · MT 4,5 m · hướng Bắc. Pháp lý rõ, hỗ trợ xem đất thực tế. Liên hệ hotline An Hưng Land 0977.656.280.',
  slug: 'lo-33-dau-gia-man-de-nam-trung-man-de-nam-trung-nam-sach-hai-duong',
  extraDescription:
    'Lô góc, nằm sát mẫu giáo nam trung, bên cạnh đang có khu dân cư mở rộng, vỉa hè 3m, đèn cao áp, trung tâm xã nam trung cũ',
};

console.log('Model:', model);
console.log('--- REQUEST JSON ---');
console.log(JSON.stringify(payload, null, 2));
console.log('--- CALLING OPENAI ---');

const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: LOT_GPT_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(payload, null, 2) },
    ],
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error('OpenAI error', res.status, data.error?.message ?? data);
  process.exit(2);
}

let raw = data.choices?.[0]?.message?.content?.trim() ?? '';
const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
if (fenced) raw = fenced[1].trim();

console.log('--- RAW RESPONSE ---');
console.log(raw);

try {
  const parsed = JSON.parse(raw);
  console.log('--- PARSED KEYS ---');
  console.log(Object.keys(parsed).join(', '));
  console.log('--- SEO CHECK ---');
  console.log('seoTitle:', parsed.seoTitle);
  console.log('h1:', parsed.h1);
  console.log('metaDescription len:', parsed.metaDescription?.length);
  console.log('slug:', parsed.slug);
  console.log('excerpt len:', parsed.excerpt?.length);
  console.log('bodyHtml len:', parsed.bodyHtml?.length);
  console.log('facebookPost len:', parsed.facebookPost?.length);
  const badPhrases = ['pháp lý rõ', 'sổ đỏ', 'đầu tư sinh lời', 'tiềm năng tăng giá'];
  const haystack = JSON.stringify(parsed).toLowerCase();
  const found = badPhrases.filter((p) => haystack.includes(p));
  console.log('forbidden phrases found:', found.length ? found : 'none');
} catch (e) {
  console.error('JSON parse failed:', e.message);
  process.exit(3);
}
