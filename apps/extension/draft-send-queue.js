/**
 * FIFO queue for auto-send when staff leave a Facebook conversation.
 * The live scan snapshot stays separate so the next customer cannot overwrite
 * a payload that is waiting or in flight.
 */
(function (root) {
  "use strict";

  var MAX_MISSED_NOTICES = 8;

  function createDraftSendState() {
    return {
      draftSubmitting: false,
      draftActiveLabel: "",
      draftSendQueue: [],
      draftMissedNotices: [],
    };
  }

  function customerLabel(snapshot) {
    var scan = snapshot && snapshot.scan;
    var name = String((scan && scan.customerName) || "")
      .replace(/\s+/g, " ")
      .trim();
    if (name) return name;
    var uid = String((scan && (scan.customerUid || scan.threadId)) || "")
      .replace(/\s+/g, " ")
      .trim();
    return uid || "khách trước";
  }

  function cloneDraftJob(snapshot) {
    var scanSource = snapshot.scan && typeof snapshot.scan === "object" ? snapshot.scan : null;
    var scanDebug =
      scanSource && scanSource.scanDebug && typeof scanSource.scanDebug === "object"
        ? Object.assign({}, scanSource.scanDebug)
        : scanSource
          ? scanSource.scanDebug
          : undefined;
    var scan = scanSource ? Object.assign({}, scanSource, { scanDebug: scanDebug }) : scanSource;
    var chatMessages = Array.isArray(snapshot.chatMessages)
      ? snapshot.chatMessages.map(function (msg) {
          return Object.assign({}, msg, {
            imageUrls: Array.isArray(msg.imageUrls) ? msg.imageUrls.slice() : [],
          });
        })
      : [];
    var payload = Object.assign({}, snapshot, {
      scan: scan,
      chatMessages: chatMessages,
    });
    delete payload.scanKey;
    return {
      scanKey: snapshot.scanKey,
      label: customerLabel(snapshot),
      payload: payload,
    };
  }

  function didNotReachCrm(label, reason) {
    var name = String(label || "").trim() || "khách trước";
    var extra = String(reason || "").trim();
    if (!extra) return "«" + name + "» chưa lên CRM.";
    var sentence = /[.!?]$/.test(extra) ? extra : extra + ".";
    return "«" + name + "» chưa lên CRM. " + sentence;
  }

  function pushNotice(state, notice) {
    state.draftMissedNotices.push(notice);
    if (state.draftMissedNotices.length > MAX_MISSED_NOTICES) {
      state.draftMissedNotices.splice(0, state.draftMissedNotices.length - MAX_MISSED_NOTICES);
    }
  }

  /**
   * Copy the customer just left into the queue. A send already in flight does not drop this copy.
   * `checks.hasCustomerUid` / `checks.hasAuth` false: do not POST; tell staff this customer missed CRM.
   */
  function enqueueLeftCustomer(state, liveSnapshot, prevScanKey, checks) {
    var prevKey = String(prevScanKey || "").trim();
    if (!prevKey || !liveSnapshot || String(liveSnapshot.scanKey || "").trim() !== prevKey) {
      return { taken: false, queued: false, notice: null };
    }

    var job = cloneDraftJob(liveSnapshot);
    var allowUid = !checks || checks.hasCustomerUid !== false;
    var allowAuth = !checks || checks.hasAuth !== false;
    if (!allowUid) {
      var uidNotice = didNotReachCrm(job.label, "Chưa có UID Facebook");
      pushNotice(state, uidNotice);
      return { taken: true, queued: false, notice: uidNotice };
    }
    if (!allowAuth) {
      var authNotice = didNotReachCrm(job.label, "Chưa đăng nhập");
      pushNotice(state, authNotice);
      return { taken: true, queued: false, notice: authNotice };
    }

    state.draftSendQueue.push(job);
    return { taken: true, queued: true, notice: null };
  }

  function takeNextJob(state) {
    if (state.draftSubmitting) return null;
    var job = state.draftSendQueue.shift();
    if (!job) return null;
    state.draftSubmitting = true;
    state.draftActiveLabel = job.label;
    return job;
  }

  function finishSend(state, outcome) {
    state.draftSubmitting = false;
    state.draftActiveLabel = "";
    if (outcome && outcome.ok === false) {
      var notice = didNotReachCrm(outcome.label, outcome.reason || "Gửi tự động thất bại");
      pushNotice(state, notice);
      return notice;
    }
    return null;
  }

  function waitingLabels(state) {
    return state.draftSendQueue.map(function (job) {
      return job.label;
    });
  }

  function sendingStatus(label, waiting) {
    var name = String(label || "").trim() || "khách trước";
    var names = (waiting || [])
      .map(function (item) {
        return String(item || "").trim();
      })
      .filter(Boolean);
    if (!names.length) return "Đang gửi BE tự động: " + name + "…";
    return "Đang gửi BE tự động: " + name + "… Còn chờ: " + names.join(", ") + ".";
  }

  var api = {
    createDraftSendState: createDraftSendState,
    cloneDraftJob: cloneDraftJob,
    customerLabel: customerLabel,
    didNotReachCrm: didNotReachCrm,
    enqueueLeftCustomer: enqueueLeftCustomer,
    takeNextJob: takeNextJob,
    finishSend: finishSend,
    waitingLabels: waitingLabels,
    sendingStatus: sendingStatus,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.__ANHUNGLAND_DRAFT_SEND_QUEUE__ = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
