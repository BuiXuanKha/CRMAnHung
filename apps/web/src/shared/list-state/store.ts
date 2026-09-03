import {
  captureListScroll,
  LIST_ROW_ATTR,
  restoreListScroll,
  type ListScrollSnapshot,
} from './scroll';

const registeredKeys = new Set<string>();

export function registerListStateKey(key: string) {
  registeredKeys.add(key);
}

export function clearAllListStates() {
  if (typeof window === 'undefined') return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('crmanhung:') && key.endsWith('-list-state')) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      sessionStorage.removeItem(key);
    }
    for (const key of registeredKeys) {
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

function readRaw(key: string): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function storedScroll(key: string): ListScrollSnapshot {
  const raw = readRaw(key);
  return {
    anchorId: typeof raw?.anchorId === 'string' ? raw.anchorId : null,
    scrollTop: Number(raw?.scrollTop) || 0,
  };
}

function writeRaw(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export type ListStateStoreConfig<TFields extends Record<string, unknown>> = {
  /** sessionStorage key, e.g. `crmanhung:lodat-list-state` */
  key: string;
  version?: number;
  /** Parse feature fields from stored JSON (search, filters, …). */
  parseFields: (raw: Record<string, unknown>) => TFields;
  /** DOM attribute on rows; default `data-list-row-id`. */
  rowAttr?: string;
};

export type ListSavedState<TFields extends Record<string, unknown>> = ListScrollSnapshot &
  TFields & {
    selectedId: string | null;
  };

/**
 * Per-list sessionStorage store: filters + selected row + scroll.
 * Register key so logout can `clearAllListStates()`.
 */
export function createListStateStore<TFields extends Record<string, unknown>>(
  config: ListStateStoreConfig<TFields>,
) {
  const version = config.version ?? 1;
  const rowAttr = config.rowAttr ?? LIST_ROW_ATTR;
  registerListStateKey(config.key);

  return {
    key: config.key,
    rowAttr,

    peek(): ListSavedState<TFields> | null {
      if (typeof window === 'undefined') return null;
      const parsed = readRaw(config.key);
      if (!parsed) return null;
      try {
        const fields = config.parseFields(parsed);
        return {
          ...fields,
          anchorId: typeof parsed.anchorId === 'string' ? parsed.anchorId : null,
          scrollTop: Number(parsed.scrollTop) || 0,
          selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : null,
        };
      } catch {
        return null;
      }
    },

    save(
      root: HTMLElement | null,
      fields: TFields & { selectedId: string | null },
    ) {
      if (typeof window === 'undefined') return;
      // Unmount cleanup runs in the passive phase, after React nulls the refs,
      // so `root` is null there. Capturing then would store scrollTop 0 and wipe
      // the position saved right before `router.push`.
      const scroll = root ? captureListScroll(root, rowAttr) : storedScroll(config.key);
      writeRaw(config.key, {
        version,
        ...scroll,
        ...fields,
      });
    },

    clear() {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.removeItem(config.key);
      } catch {
        /* ignore */
      }
    },

    restoreScroll(root: HTMLElement | null, snapshot: ListScrollSnapshot) {
      restoreListScroll(root, snapshot, rowAttr);
    },
  };
}
