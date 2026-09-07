/**
 * Next sets NEXT_PHASE while collecting page data during `next build`.
 * Guest Nest may be down in CI — callers may soft-fail only in this phase.
 */
export function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
