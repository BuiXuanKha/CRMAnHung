import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TaskTargetType } from './enums.js';
import { formatTaskDueOn, taskContextLine, ymdInVietnam } from './tasks.js';

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
