import {
  lotGptContentResultSchema,
  type LotGptContentResult,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { listingCanonicalUrl } from '@/features/public/site';

/** Parse GPT response JSON (tolerates markdown code fences). */
export function parseLotGptContentResult(raw: string): LotGptContentResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  const inner = (fenced?.[1] ?? trimmed).trim();
  try {
    const parsed = lotGptContentResultSchema.safeParse(JSON.parse(inner));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Map GPT output → editor prefill (title capped at 160). */
export type LotGptEditorPrefill = {
  title: string;
  bodyHtml: string;
  slug: string;
  metaDescription: string;
};

export function lotGptToEditorPrefill(result: LotGptContentResult): LotGptEditorPrefill {
  const title = (result.h1?.trim() || result.seoTitle?.trim() || '').slice(0, 160);
  return {
    title,
    bodyHtml: result.bodyHtml.trim(),
    slug: result.slug.trim(),
    metaDescription: result.metaDescription.trim(),
  };
}

/** Slug for share URL — GPT output first, then existing lot overlay. */
export function lotGptShareSlug(result: LotGptContentResult, lot: PublicWebStaffLotRow): string {
  return result.slug.trim() || lot.slug?.trim() || '';
}

/** Absolute listing URL for Facebook paste when slug is known. */
export function lotGptSharePageUrl(result: LotGptContentResult, lot: PublicWebStaffLotRow): string | null {
  const slug = lotGptShareSlug(result, lot);
  return slug ? listingCanonicalUrl(slug) : null;
}
