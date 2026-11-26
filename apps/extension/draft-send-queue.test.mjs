import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const queue = require("./draft-send-queue.js");

function snapshot(key, name, text) {
  return {
    scanKey: key,
    capturedAt: "2026-11-26T00:00:00.000Z",
    scanSource: "messenger_standard",
    scan: {
      customerUid: `100${key}`,
      customerName: name,
      threadId: key,
      scanDebug: { rowName: name },
    },
    chatMessages: [
      {
        id: `mid.${key}`,
        text,
        imageUrls: [`blob:${key}`],
        sender: "customer",
      },
    ],
  };
}

test("switching A to B to C while A is sending keeps B then C", () => {
  const state = queue.createDraftSendState();
  const snapA = snapshot("A", "An", "tin A");
  const snapB = snapshot("B", "Binh", "tin B");
  const snapC = snapshot("C", "Cuong", "tin C");

  assert.equal(
    queue.enqueueLeftCustomer(state, snapA, "A", { hasCustomerUid: true, hasAuth: true }).queued,
    true,
  );
  const jobA = queue.takeNextJob(state);
  assert.equal(jobA.label, "An");
  assert.equal(jobA.payload.scanKey, undefined);
  assert.equal(state.draftSubmitting, true);

  assert.equal(
    queue.enqueueLeftCustomer(state, snapB, "B", { hasCustomerUid: true, hasAuth: true }).queued,
    true,
  );
  assert.equal(queue.takeNextJob(state), null);

  snapB.scan.customerName = "Cuong";
  snapB.scan.scanDebug.rowName = "Cuong";
  snapB.chatMessages[0].text = "overwritten";
  snapB.chatMessages[0].imageUrls.push("extra");

  assert.equal(
    queue.enqueueLeftCustomer(state, snapC, "C", { hasCustomerUid: true, hasAuth: true }).queued,
    true,
  );
  snapC.scan.customerName = "Dung";
  snapC.chatMessages[0].text = "overwritten C";

  assert.deepEqual(queue.waitingLabels(state), ["Binh", "Cuong"]);
  assert.equal(
    queue.sendingStatus(state.draftActiveLabel, queue.waitingLabels(state)),
    "Đang gửi BE tự động: An… Còn chờ: Binh, Cuong.",
  );

  const queuedB = state.draftSendQueue[0];
  assert.equal(queuedB.payload.scan.customerName, "Binh");
  assert.equal(queuedB.payload.scan.scanDebug.rowName, "Binh");
  assert.equal(queuedB.payload.chatMessages[0].text, "tin B");
  assert.deepEqual(queuedB.payload.chatMessages[0].imageUrls, ["blob:B"]);

  queue.finishSend(state, { ok: true, label: jobA.label });
  const jobB = queue.takeNextJob(state);
  assert.equal(jobB.label, "Binh");
  assert.equal(jobB.payload.chatMessages[0].text, "tin B");

  const notice = queue.finishSend(state, {
    ok: false,
    label: jobB.label,
    reason: "Gửi thất bại (500)",
  });
  assert.equal(notice, "«Binh» chưa lên CRM. Gửi thất bại (500).");
  assert.deepEqual(state.draftMissedNotices, ["«Binh» chưa lên CRM. Gửi thất bại (500)."]);
  assert.equal(state.draftSubmitting, false);

  const jobC = queue.takeNextJob(state);
  assert.equal(jobC.label, "Cuong");
  assert.equal(jobC.payload.chatMessages[0].text, "tin C");
  assert.equal(state.draftSendQueue.length, 0);
});

test("a customer without a Facebook UID is not queued and staff are told", () => {
  const state = queue.createDraftSendState();
  const snap = snapshot("B", "Binh", "tin B");
  const result = queue.enqueueLeftCustomer(state, snap, "B", {
    hasCustomerUid: false,
    hasAuth: true,
  });
  assert.equal(result.taken, true);
  assert.equal(result.queued, false);
  assert.equal(result.notice, "«Binh» chưa lên CRM. Chưa có UID Facebook.");
  assert.equal(state.draftSendQueue.length, 0);
  assert.equal(queue.takeNextJob(state), null);
});

test("a key mismatch does not consume the live snapshot", () => {
  const state = queue.createDraftSendState();
  const snap = snapshot("C", "Cuong", "tin C");
  const result = queue.enqueueLeftCustomer(state, snap, "B", {
    hasCustomerUid: true,
    hasAuth: true,
  });
  assert.deepEqual(result, { taken: false, queued: false, notice: null });
  assert.equal(snap.scan.customerName, "Cuong");
});
