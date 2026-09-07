/**
 * BUG-072 — focused checks for guest catalog error semantics + build gate.
 * Run from repo root:
 *   node --test apps/web/src/features/public-content/bug-072-guest-api-errors.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const apiTs = readFileSync(join(root, 'src/features/public-content/api.ts'), 'utf8');
const publishedTs = readFileSync(
  join(root, 'src/features/public/published-listings.ts'),
  'utf8',
);
const buildTs = readFileSync(
  join(root, 'src/features/public/next-production-build.ts'),
  'utf8',
);

/** Mirrors ApiError + getPublishedCatalogBySlug / getPublicLotSlugRedirect catch. */
class ApiError extends Error {
  constructor(status, message = 'error') {
    super(message);
    this.status = status;
  }
}

function nullIfNotFound(err) {
  if (err instanceof ApiError && err.status === 404) return null;
  throw err;
}

describe('BUG-072 guest catalog error semantics', () => {
  it('listPublishedCatalog source no longer swallows errors into []', () => {
    const start = apiTs.indexOf('export async function listPublishedCatalog');
    const end = apiTs.indexOf('export async function getPublishedCatalogBySlug');
    assert.ok(start >= 0 && end > start);
    const body = apiTs.slice(start, end);
    assert.doesNotMatch(body, /catch/);
    assert.doesNotMatch(body, /return \[\]/);
    assert.match(body, /return res\.items/);
  });

  it('getPublishedCatalogBySlug only maps HTTP 404 to null', () => {
    assert.equal(nullIfNotFound(new ApiError(404)), null);
    assert.throws(() => nullIfNotFound(new ApiError(500)), ApiError);
    assert.throws(() => nullIfNotFound(new ApiError(503)), ApiError);
    assert.throws(() => nullIfNotFound(new Error('network')), /network/);
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    assert.throws(() => nullIfNotFound(abort), /aborted/);
    assert.match(
      apiTs,
      /getPublishedCatalogBySlug[\s\S]*err instanceof ApiError && err\.status === 404[\s\S]*throw err/,
    );
  });

  it('getPublicLotSlugRedirect only maps HTTP 404 to null', () => {
    assert.match(
      apiTs,
      /getPublicLotSlugRedirect[\s\S]*err instanceof ApiError && err\.status === 404[\s\S]*throw err/,
    );
  });

  it('build soft-fail stays on callers, not shared catalog getters', () => {
    assert.match(buildTs, /NEXT_PHASE/);
    assert.match(publishedTs, /isNextProductionBuild/);
    assert.match(apiTs, /listPublishedPublicLots[\s\S]*isNextProductionBuild/);
  });
});
