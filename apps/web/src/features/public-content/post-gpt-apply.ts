import {
  PublicPostCategory,
  postGptContentResultSchema,
  type PostGptContentResult,
  type PostGptRequestPayload,
} from '@crmanhung/shared';
import type { ComposePostPrefill } from './components/compose-post-dialog';

export function formatPostGptRequestJson(
  projectName: string,
  extraNotes?: string,
): string {
  const payload: PostGptRequestPayload = {
    projectName: projectName.trim(),
    category: PublicPostCategory.DU_AN,
    site: 'An Hưng Land',
    locale: 'Nam Sách, Hải Dương',
    ...(extraNotes?.trim() ? { extraNotes: extraNotes.trim() } : {}),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parsePostGptContentResult(raw: string): PostGptContentResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  const inner = (fenced?.[1] ?? trimmed).trim();
  try {
    const parsed = postGptContentResultSchema.safeParse(JSON.parse(inner));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function postGptToComposePrefill(result: PostGptContentResult): ComposePostPrefill {
  const h1 = (result.h1?.trim() || result.seoTitle?.trim() || '').slice(0, 160);
  return {
    title: h1,
    category: PublicPostCategory.DU_AN,
    bodyHtml: result.bodyHtml.trim(),
    excerpt: result.excerpt.trim().slice(0, 320),
    metaDescription: result.metaDescription.trim().slice(0, 160),
    slug: result.slug.trim().slice(0, 80),
  };
}
