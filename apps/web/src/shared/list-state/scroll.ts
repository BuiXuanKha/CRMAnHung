/** Attribute on each list row/card for scroll anchor restore. */
export const LIST_ROW_ATTR = 'data-list-row-id';

export type ListScrollSnapshot = {
  anchorId: string | null;
  scrollTop: number;
};

export function getActiveListScrollEl(
  desktop: HTMLElement | null,
  mobile: HTMLElement | null,
): HTMLElement | null {
  const desktopVisible = desktop && desktop.offsetParent !== null;
  const mobileVisible = mobile && mobile.offsetParent !== null;
  const preferred = desktopVisible ? desktop : mobileVisible ? mobile : desktop || mobile;
  if (!preferred) return null;
  if (preferred.scrollHeight > preferred.clientHeight + 2) return preferred;
  return preferred;
}

export function captureListScroll(
  root: HTMLElement | null,
  rowAttr: string = LIST_ROW_ATTR,
): ListScrollSnapshot {
  if (!root) return { anchorId: null, scrollTop: 0 };
  const rows = root.querySelectorAll(`[${rowAttr}]`);
  const rootRect = root.getBoundingClientRect();
  let anchorId: string | null = null;
  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (rect.bottom > rootRect.top + 1) {
      anchorId = row.getAttribute(rowAttr);
      break;
    }
  }
  if (!anchorId && rows.length) {
    anchorId = rows[0].getAttribute(rowAttr);
  }
  return { anchorId, scrollTop: root.scrollTop };
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

export function restoreListScroll(
  root: HTMLElement | null,
  snapshot: ListScrollSnapshot,
  rowAttr: string = LIST_ROW_ATTR,
) {
  if (!root) return;
  const apply = () => {
    if (Number.isFinite(snapshot.scrollTop)) {
      root.scrollTop = Math.min(snapshot.scrollTop, maxListScrollTop(root));
      return;
    }
    if (!snapshot.anchorId) return;
    const row = root.querySelector(
      `[${rowAttr}="${CSS.escape(snapshot.anchorId)}"]`,
    );
    if (!(row instanceof HTMLElement)) return;
    const rootRect = root.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    root.scrollTop += rowRect.top - rootRect.top;
  };
  apply();
  requestAnimationFrame(apply);
}
