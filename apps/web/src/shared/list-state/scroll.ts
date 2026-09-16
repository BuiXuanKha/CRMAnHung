/** Attribute on each list row/card for scroll anchor restore. */
export const LIST_ROW_ATTR = 'data-list-row-id';

/** Same breakpoint as CRM mobile card lists. */
export const CRM_MOBILE_LIST_MQ = '(max-width: 767px)';

export type ListScrollSnapshot = {
  anchorId: string | null;
  /** Anchor row top relative to the scroller top — usually negative (row partly cut). */
  anchorOffset: number;
  scrollTop: number;
};

/** Snapshot currently being restored — persist must not save a layout-reset 0. */
let restoreTarget: ListScrollSnapshot | null = null;

function isVerticallyScrollable(el: HTMLElement | null): boolean {
  if (!el) return false;
  return el.scrollHeight > el.clientHeight + 2;
}

function canScrollY(el: HTMLElement): boolean {
  const oy = getComputedStyle(el).overflowY;
  return oy === 'auto' || oy === 'scroll' || oy === 'overlay';
}

export function getActiveListScrollEl(
  desktop: HTMLElement | null,
  mobile: HTMLElement | null,
): HTMLElement | null {
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia(CRM_MOBILE_LIST_MQ).matches;
  const preferred = isMobile ? mobile || desktop : desktop || mobile;
  if (isVerticallyScrollable(preferred)) return preferred;

  let node = preferred?.parentElement ?? null;
  while (node) {
    if (isVerticallyScrollable(node) && canScrollY(node)) return node;
    node = node.parentElement;
  }
  return preferred;
}

export function captureListScroll(
  root: HTMLElement | null,
  rowAttr: string = LIST_ROW_ATTR,
): ListScrollSnapshot {
  if (!root) return { anchorId: null, anchorOffset: 0, scrollTop: 0 };
  const rows = root.querySelectorAll(`[${rowAttr}]`);
  const rootRect = root.getBoundingClientRect();
  let anchorId: string | null = null;
  let anchorOffset = 0;
  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (rect.bottom > rootRect.top + 1) {
      anchorId = row.getAttribute(rowAttr);
      anchorOffset = rect.top - rootRect.top;
      break;
    }
  }
  if (!anchorId && rows.length) {
    const first = rows[0];
    anchorId = first.getAttribute(rowAttr);
    anchorOffset = first.getBoundingClientRect().top - rootRect.top;
  }
  return { anchorId, anchorOffset, scrollTop: root.scrollTop };
}

/** Prefer the in-flight restore target so a layout jump to 0 is not persisted. */
export function scrollSnapshotForSave(
  root: HTMLElement | null,
  rowAttr: string = LIST_ROW_ATTR,
): ListScrollSnapshot | null {
  if (restoreTarget) return restoreTarget;
  if (!root) return null;
  return captureListScroll(root, rowAttr);
}

export function maxListScrollTop(root: HTMLElement | null): number {
  if (!root) return 0;
  return Math.max(0, root.scrollHeight - root.clientHeight);
}

export function needsMoreListScrollHeight(
  root: HTMLElement | null,
  scrollTop: number,
): boolean {
  if (!root || !Number.isFinite(scrollTop)) return false;
  return scrollTop > maxListScrollTop(root) + 2;
}

/**
 * Restore exact pixels, then re-apply across layout frames.
 * Layout / `overflow: hidden` on body often resets descendant `scrollTop` to 0
 * *after* the first apply — that is not user scroll, so keep putting it back
 * until the user actually wheels / touches the list.
 */
export function restoreListScroll(
  root: HTMLElement | null,
  snapshot: ListScrollSnapshot,
  rowAttr: string = LIST_ROW_ATTR,
): void {
  if (!root) return;
  restoreTarget = snapshot;
  let userTouched = false;
  let frames = 0;
  const maxFrames = 16;

  const markTouched = () => {
    userTouched = true;
  };
  root.addEventListener('wheel', markTouched, { passive: true });
  root.addEventListener('touchmove', markTouched, { passive: true });
  root.addEventListener('pointerdown', markTouched);

  const apply = () => {
    // Exact pixels first: the list is normally unchanged, and re-aligning the
    // anchor row to the top would drop the partially scrolled row, which reads
    // as a small jump right after the list appears.
    if (Number.isFinite(snapshot.scrollTop) && snapshot.scrollTop <= maxListScrollTop(root)) {
      root.scrollTop = snapshot.scrollTop;
      return;
    }
    // Content changed above the anchor (rows added/removed) — keep the anchor
    // row at the very offset it had, not glued to the top edge.
    if (snapshot.anchorId) {
      const row = root.querySelector(
        `[${rowAttr}="${CSS.escape(snapshot.anchorId)}"]`,
      );
      if (row instanceof HTMLElement) {
        const rootRect = root.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const offset = Number.isFinite(snapshot.anchorOffset) ? snapshot.anchorOffset : 0;
        root.scrollTop += rowRect.top - rootRect.top - offset;
        return;
      }
    }
    if (Number.isFinite(snapshot.scrollTop)) {
      root.scrollTop = Math.min(snapshot.scrollTop, maxListScrollTop(root));
    }
  };

  const run = () => {
    if (userTouched) return;
    apply();
  };

  const cleanup = () => {
    root.removeEventListener('wheel', markTouched);
    root.removeEventListener('touchmove', markTouched);
    root.removeEventListener('pointerdown', markTouched);
    if (restoreTarget === snapshot) restoreTarget = null;
  };

  run();
  const tick = () => {
    frames += 1;
    run();
    if (!userTouched && frames < maxFrames) {
      requestAnimationFrame(tick);
      return;
    }
    window.setTimeout(cleanup, 80);
  };
  requestAnimationFrame(tick);
  // Swapping the web font re-measures card titles and can change row heights
  // after the list is already visible.
  document.fonts?.ready.then(run).catch(() => {});
}

/**
 * «Đổi lọc → cuộn về 0» must not run on the same layout pass as scroll restore.
 * Warm React Query cache finishes loading immediately, so both effects used to
 * run together and wipe the restored position.
 */
export function resetListScrollIfFiltersChanged(
  root: HTMLElement | null,
  restoredFiltersKey: { current: string | null },
  filtersKey: string,
  canReset: boolean,
) {
  if (!canReset) return;
  if (restoredFiltersKey.current === filtersKey) return;
  restoredFiltersKey.current = filtersKey;
  if (root) root.scrollTop = 0;
}
