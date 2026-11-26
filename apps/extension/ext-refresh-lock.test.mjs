import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(here, "ext-refresh-lock.js"), "utf8"), sandbox);

const { refreshSharedSession, SUPERSEDED_CODE } = sandbox.AnhunglandRefreshLock;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createBox() {
  return {
    session: {
      token: "access-old",
      refreshToken: "refresh-old",
      user: { id: "kha", username: "kha" },
    },
    lock: null,
    clears: 0,
    posts: [],
    saves: 0,
  };
}

function snapshot(session) {
  return {
    token: session.token,
    refreshToken: session.refreshToken,
    user: session.user,
  };
}

function depsFor(box, patch = {}) {
  return {
    async readSession() {
      return snapshot(box.session);
    },
    async readLock() {
      return box.lock ? { ...box.lock } : null;
    },
    async writeLock(lock) {
      box.lock = { ...lock };
    },
    async removeLock(lockId) {
      if (box.lock && box.lock.id === lockId) box.lock = null;
    },
    async saveSession(session) {
      box.saves += 1;
      box.session = {
        token: session.token,
        refreshToken: session.refreshToken,
        user: session.user,
      };
    },
    async clearSession() {
      box.clears += 1;
      box.session = { token: "", refreshToken: "", user: null };
      box.lock = null;
    },
    async adoptSession() {},
    delay,
    now: () => Date.now(),
    createLockId: () => `lock-${Math.random().toString(36).slice(2)}`,
    settleMs: 20,
    pollMs: 5,
    lockTtlMs: 250,
    invalidGraceMs: 0,
    ...patch,
  };
}

test("a tab that loses the lock does not clear the shared session", async () => {
  const box = createBox();
  box.lock = { id: "winner-tab", at: Date.now() };
  const pending = refreshSharedSession(depsFor(box));
  await delay(20);
  box.session = {
    token: "access-new",
    refreshToken: "refresh-new",
    user: { id: "kha", username: "kha" },
  };
  box.lock = null;
  const ok = await pending;
  assert.equal(ok, true);
  assert.equal(box.posts.length, 0);
  assert.equal(box.clears, 0);
  assert.equal(box.session.refreshToken, "refresh-new");
});

test("losing the lock without a new session does not log the profile out", async () => {
  const box = createBox();
  box.lock = { id: "winner-tab", at: Date.now() };
  const ok = await refreshSharedSession(depsFor(box, { lockTtlMs: 40 }));
  assert.equal(ok, false);
  assert.equal(box.posts.length, 0);
  assert.equal(box.clears, 0);
  assert.equal(box.session.token, "access-old");
  assert.equal(box.session.refreshToken, "refresh-old");
});

test("REFRESH_SUPERSEDED keeps the session the winning tab stored", async () => {
  const box = createBox();
  let calls = 0;
  const privateLocks = new Map();

  function isolated(name) {
    return depsFor(box, {
      async readLock() {
        const lock = privateLocks.get(name);
        return lock ? { ...lock } : null;
      },
      async writeLock(lock) {
        privateLocks.set(name, { ...lock });
      },
      async removeLock(lockId) {
        const lock = privateLocks.get(name);
        if (lock && lock.id === lockId) privateLocks.delete(name);
      },
      async postRefresh(refreshToken) {
        calls += 1;
        const mine = calls;
        box.posts.push(refreshToken);
        await delay(30);
        if (mine === 1) {
          return {
            ok: true,
            status: 200,
            code: "",
            accessToken: "access-new",
            refreshToken: "refresh-new",
            user: { id: "kha", username: "kha" },
          };
        }
        return {
          ok: false,
          status: 401,
          code: SUPERSEDED_CODE,
          accessToken: "",
          refreshToken: "",
          user: null,
        };
      },
    });
  }

  const [first, second] = await Promise.all([
    refreshSharedSession(isolated("a")),
    refreshSharedSession(isolated("b")),
  ]);

  assert.equal(first, true);
  assert.equal(second, true);
  assert.equal(box.posts.length, 2);
  assert.deepEqual(box.posts, ["refresh-old", "refresh-old"]);
  assert.equal(box.clears, 0);
  assert.equal(box.saves, 1);
  assert.equal(box.session.token, "access-new");
  assert.equal(box.session.refreshToken, "refresh-new");
});

test("a replaced refresh token is not posted again", async () => {
  const box = createBox();
  let reads = 0;
  const ok = await refreshSharedSession(
    depsFor(box, {
      async readSession() {
        reads += 1;
        if (reads === 1) return snapshot(box.session);
        return {
          token: "access-new",
          refreshToken: "refresh-new",
          user: { id: "kha", username: "kha" },
        };
      },
      async postRefresh(refreshToken) {
        box.posts.push(refreshToken);
        return { ok: false, status: 401, code: "", accessToken: "" };
      },
    }),
  );
  assert.equal(ok, true);
  assert.equal(box.posts.length, 0);
  assert.equal(box.clears, 0);
});

test("an invalid refresh while this tab holds the lock still clears the session", async () => {
  const box = createBox();
  const ok = await refreshSharedSession(
    depsFor(box, {
      async postRefresh(refreshToken) {
        box.posts.push(refreshToken);
        return { ok: false, status: 401, code: "", accessToken: "", refreshToken: "", user: null };
      },
    }),
  );
  assert.equal(ok, false);
  assert.deepEqual(box.posts, ["refresh-old"]);
  assert.equal(box.clears, 1);
  assert.equal(box.session.token, "");
  assert.equal(box.session.refreshToken, "");
});

test("two tabs that share one lock keep the winner session", async () => {
  const box = createBox();
  let calls = 0;
  function postRefresh(refreshToken) {
    calls += 1;
    const mine = calls;
    box.posts.push(refreshToken);
    return delay(25).then(() => {
      if (mine === 1) {
        return {
          ok: true,
          status: 200,
          code: "",
          accessToken: "access-new",
          refreshToken: "refresh-new",
          user: { id: "kha", username: "kha" },
        };
      }
      return {
        ok: false,
        status: 401,
        code: SUPERSEDED_CODE,
        accessToken: "",
        refreshToken: "",
        user: null,
      };
    });
  }
  const [first, second] = await Promise.all([
    refreshSharedSession(depsFor(box, { postRefresh, settleMs: 15, lockTtlMs: 400 })),
    refreshSharedSession(depsFor(box, { postRefresh, settleMs: 15, lockTtlMs: 400 })),
  ]);
  assert.equal(box.clears, 0);
  assert.ok(box.posts.length >= 1);
  assert.ok(box.posts.every((token) => token === "refresh-old"));
  assert.equal(box.session.token, "access-new");
  assert.equal(box.session.refreshToken, "refresh-new");
  assert.equal(first || second, true);
});

test("a logout that lands before save is not undone by the refresh result", async () => {
  const box = createBox();
  const ok = await refreshSharedSession(
    depsFor(box, {
      async postRefresh() {
        box.posts.push("refresh-old");
        box.session = { token: "", refreshToken: "", user: null };
        box.lock = null;
        return {
          ok: true,
          status: 200,
          code: "",
          accessToken: "access-new",
          refreshToken: "refresh-new",
          user: { id: "kha", username: "kha" },
        };
      },
    }),
  );
  assert.equal(ok, false);
  assert.equal(box.saves, 0);
  assert.equal(box.clears, 0);
  assert.equal(box.session.token, "");
  assert.equal(box.session.refreshToken, "");
});
