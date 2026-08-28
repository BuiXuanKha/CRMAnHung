import { lotGptContentResultSchema, type LotGptContentResult } from '@crmanhung/shared';

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
  /** On-page H1 — GPT h1 */
  title: string;
  /** Document title — GPT seoTitle */
  seoTitle: string;
  bodyHtml: string;
  slug: string;
  metaDescription: string;
};

export function lotGptToEditorPrefill(result: LotGptContentResult): LotGptEditorPrefill {
  const h1 = (result.h1?.trim() || result.seoTitle?.trim() || '').slice(0, 160);
  const seoTitle = (result.seoTitle?.trim() || h1).slice(0, 160);
  return {
    title: h1,
    seoTitle,
    bodyHtml: result.bodyHtml.trim(),
    slug: result.slug.trim(),
    metaDescription: result.metaDescription.trim(),
  };
}
