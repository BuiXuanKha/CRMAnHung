/**
 * One shared extension login across Messenger tabs.
 * chrome.storage.local has no compare-and-swap, so a tab writes its lock id
 * and only continues when a later read still shows that id. A tab that loses
 * the lock, or gets REFRESH_SUPERSEDED, must not clear storage. Đăng xuất is
 * a separate path and is the one that wipes the shared session.
 */
(function () {
  const SUPERSEDED_CODE = "REFRESH_SUPERSEDED";
  const DEFAULT_LOCK_TTL_MS = 8_000;
  const DEFAULT_SETTLE_MS = 120;
  const DEFAULT_POLL_MS = 150;

  function text(value) {
    return String(value || "").trim();
  }

  function sessionStamp(session) {
    return `${text(session && session.token)}\n${text(session && session.refreshToken)}`;
  }

  function classifySession(snapshot, baseline) {
    const snap = snapshot || { token: "", refreshToken: "", user: null };
    if (!text(snap.token) && !text(snap.refreshToken)) return "cleared";
    if (text(snap.token) && sessionStamp(snap) !== sessionStamp(baseline)) return "updated";
    return "same";
  }

  function lockHeldByOther(lock, lockId, now, ttlMs) {
    if (!lock || !lock.id || lock.id === lockId) return false;
    const at = Number(lock.at || 0);
    if (!Number.isFinite(at) || at <= 0) return false;
    return now - at < ttlMs;
  }

  async function waitForPeer(deps, baseline, timeoutMs) {
    const poll = Math.max(1, Number(deps.pollMs || DEFAULT_POLL_MS));
    const deadline = deps.now() + timeoutMs;
    for (;;) {
      const snapshot = await deps.readSession();
      const kind = classifySession(snapshot, baseline);
      if (kind === "updated") {
        await deps.adoptSession(snapshot);
        return "updated";
      }
      if (kind === "cleared") {
        await deps.adoptSession(snapshot);
        return "cleared";
      }
      if (deps.now() >= deadline) return "timeout";
      await deps.delay(poll);
    }
  }

  async function claimRefreshLock(deps, lockId, ttlMs, settleMs) {
    const existing = await deps.readLock();
    if (lockHeldByOther(existing, lockId, deps.now(), ttlMs)) return false;
    await deps.writeLock({ id: lockId, at: deps.now() });
    await deps.delay(settleMs);
    const current = await deps.readLock();
    return Boolean(current && current.id === lockId);
  }

  async function refreshSharedSession(deps) {
    const ttlMs = Number(deps.lockTtlMs || DEFAULT_LOCK_TTL_MS);
    const settleMs = Number(deps.settleMs == null ? DEFAULT_SETTLE_MS : deps.settleMs);
    const baseline = await deps.readSession();
    if (!text(baseline && baseline.refreshToken)) return false;

    const lockId = deps.createLockId();
    const claimed = await claimRefreshLock(deps, lockId, ttlMs, settleMs);
    if (!claimed) {
      const waited = await waitForPeer(deps, baseline, ttlMs);
      return waited === "updated";
    }

    try {
      const fresh = await deps.readSession();
      const freshRefresh = text(fresh && fresh.refreshToken);
      if (!freshRefresh) {
        await deps.adoptSession(fresh || { token: "", refreshToken: "", user: null });
        return false;
      }
      if (classifySession(fresh, baseline) === "updated") {
        await deps.adoptSession(fresh);
        return true;
      }

      const sent = {
        token: text(fresh.token),
        refreshToken: freshRefresh,
        user: fresh.user || null,
      };
      const result = await deps.postRefresh(freshRefresh);

      if (result && result.code === SUPERSEDED_CODE) {
        await deps.removeLock(lockId);
        const peer = await waitForPeer(deps, sent, ttlMs);
        return peer === "updated";
      }

      if (result && result.ok && result.accessToken) {
        const current = await deps.readSession();
        const currentRefresh = text(current && current.refreshToken);
        if (currentRefresh !== freshRefresh) {
          await deps.adoptSession(current || { token: "", refreshToken: "", user: null });
          return Boolean(text(current && current.token));
        }
        await deps.saveSession({
          token: result.accessToken,
          refreshToken: result.refreshToken || freshRefresh,
          user: result.user || fresh.user || null,
        });
        return true;
      }

      const lockNow = await deps.readLock();
      if (lockHeldByOther(lockNow, lockId, deps.now(), ttlMs)) {
        await deps.removeLock(lockId);
        const lost = await waitForPeer(deps, sent, ttlMs);
        return lost === "updated";
      }

      const grace = deps.invalidGraceMs == null ? Math.min(750, ttlMs) : Number(deps.invalidGraceMs);
      const peer = await waitForPeer(deps, sent, grace);
      if (peer === "updated") return true;
      if (peer === "cleared") return false;
      await deps.clearSession();
      return false;
    } finally {
      await deps.removeLock(lockId);
    }
  }

  const api = { SUPERSEDED_CODE, refreshSharedSession };
  const root = typeof globalThis !== "undefined" ? globalThis : this;
  root.AnhunglandRefreshLock = api;
})();
