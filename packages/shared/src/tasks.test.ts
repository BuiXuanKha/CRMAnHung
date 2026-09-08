import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TaskTargetType } from './enums.js';
import {
  createWorkTaskSchema,
  compareWorkTasksForList,
  formatTaskDueOn,
  taskContextLine,
  taskDueCountdown,
  ymdInVietnam,
} from './tasks.js';

describe('taskContextLine', () => {
  it('formats source as uppercase TYPE | NAME', () => {
    assert.equal(
      taskContextLine(TaskTargetType.CUSTOMER, 'Tuyet Anh'),
      'KHÁCH HÀNG | TUYET ANH',
    );
    assert.equal(taskContextLine(TaskTargetType.LODAT, 'LK12'), 'LÔ ĐẤT | LK12');
    assert.equal(
      taskContextLine(TaskTargetType.TITLE_SERVICE, 'Cô Chi - Cộng Hoà'),
      'DỊCH VỤ SỔ ĐỎ | CÔ CHI - CỘNG HOÀ',
    );
    assert.equal(
      taskContextLine(TaskTargetType.TRANSACTION, 'GD-1'),
      'GIAO DỊCH | GD-1',
    );
    assert.equal(taskContextLine(TaskTargetType.NONE, ''), 'TRANG CÔNG VIỆC');
  });
});

describe('createWorkTaskSchema', () => {
  it('accepts personal notes without targetId', () => {
    assert.deepEqual(
      createWorkTaskSchema.parse({
        content: 'Chú ý hỏi lô Anh Sử',
        dueOn: '2026-09-09',
        targetType: TaskTargetType.NONE,
      }),
      {
        content: 'Chú ý hỏi lô Anh Sử',
        dueOn: '2026-09-09',
        targetType: TaskTargetType.NONE,
        targetId: '',
      },
    );
    assert.deepEqual(
      createWorkTaskSchema.parse({
        content: 'Note',
        dueOn: '2026-09-09',
        targetType: TaskTargetType.NONE,
        targetId: '',
      }),
      {
        content: 'Note',
        dueOn: '2026-09-09',
        targetType: TaskTargetType.NONE,
        targetId: '',
      },
    );
  });

  it('requires targetId when source is attached', () => {
    assert.throws(
      () =>
        createWorkTaskSchema.parse({
          content: 'Note',
          dueOn: '2026-09-09',
          targetType: TaskTargetType.CUSTOMER,
        }),
      /Chọn nguồn công việc/,
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

describe('compareWorkTasksForList', () => {
  it('orders pinned by due, then open, then completed last', () => {
    const rows = [
      {
        id: 'done-near',
        isPinned: true,
        dueOn: '2026-09-01',
        createdAt: '2026-09-01T00:00:00.000Z',
        completedAt: '2026-09-08T10:00:00.000Z',
      },
      {
        id: 'open-far',
        isPinned: false,
        dueOn: '2026-09-20',
        createdAt: '2026-09-01T00:00:00.000Z',
        completedAt: null,
      },
      {
        id: 'pin-far',
        isPinned: true,
        dueOn: '2026-09-15',
        createdAt: '2026-09-02T00:00:00.000Z',
        completedAt: null,
      },
      {
        id: 'pin-near',
        isPinned: true,
        dueOn: '2026-09-10',
        createdAt: '2026-09-01T00:00:00.000Z',
        completedAt: null,
      },
      {
        id: 'open-near',
        isPinned: false,
        dueOn: '2026-09-12',
        createdAt: '2026-09-01T00:00:00.000Z',
        completedAt: null,
      },
    ];
    const ordered = [...rows].sort(compareWorkTasksForList).map((r) => r.id);
    assert.deepEqual(ordered, ['pin-near', 'pin-far', 'open-near', 'open-far', 'done-near']);
  });
});
