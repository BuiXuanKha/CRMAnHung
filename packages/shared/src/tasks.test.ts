import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TaskTargetType } from './enums.js';
import { formatTaskDueOn, taskContextLine, taskDueCountdown, ymdInVietnam } from './tasks.js';

describe('taskContextLine', () => {
  it('names the source entity', () => {
    assert.equal(
      taskContextLine(TaskTargetType.CUSTOMER, 'Tuyet Anh'),
      'Công việc này cho Khách hàng Tuyet Anh',
    );
    assert.equal(
      taskContextLine(TaskTargetType.LODAT, 'LK12'),
      'Công việc này cho Lô đất LK12',
    );
    assert.equal(
      taskContextLine(TaskTargetType.TITLE_SERVICE, 'Anh Nam'),
      'Công việc này cho dịch vụ sổ đỏ của khách Anh Nam',
    );
    assert.equal(
      taskContextLine(TaskTargetType.TRANSACTION, 'GD-1'),
      'Công việc này cho Giao dịch GD-1',
    );
    assert.equal(taskContextLine(TaskTargetType.NONE, ''), 'Ghi chú cá nhân');
  });
});

describe('formatTaskDueOn', () => {
  it('formats YYYY-MM-DD as D/M/YYYY', () => {
    assert.equal(formatTaskDueOn('2026-09-09'), '9/9/2026');
  });
});

describe('ymdInVietnam', () => {
  it('returns an ISO calendar date', () => {
    assert.match(ymdInVietnam(0), /^\d{4}-\d{2}-\d{2}$/);
    assert.match(ymdInVietnam(1), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('taskDueCountdown', () => {
  it('labels today, remaining days, and overdue', () => {
    assert.deepEqual(taskDueCountdown('2026-09-08', '2026-09-08'), {
      days: 0,
      label: 'Hôm nay',
      tone: 'amber',
    });
    assert.deepEqual(taskDueCountdown('2026-09-11', '2026-09-08'), {
      days: 3,
      label: '3 ngày',
      tone: 'green',
    });
    assert.deepEqual(taskDueCountdown('2026-09-05', '2026-09-08'), {
      days: -3,
      label: 'Quá hạn 3 ngày',
      tone: 'red',
    });
  });
});
