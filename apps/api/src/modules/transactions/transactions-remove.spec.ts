import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import {
  TRANSACTION_HAS_WORK_TASKS_MESSAGE,
  TransactionsService,
} from './transactions.service';

const kha: RequestUser = {
  id: 'emp-kha',
  username: 'kha',
  fullName: 'Kha',
  role: 'STAFF',
};

type RemoveRow = {
  id: string;
  status: string;
  createdByEmployeeId: string;
  lodatCustomerMapId: string;
};

function foreignKey(meta: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
    code: 'P2003',
    clientVersion: 'test',
    meta,
  });
}

function harness(options: {
  row: RemoveRow | null;
  taskCount?: number;
  deleteError?: unknown;
}) {
  const calls = { count: 0, deleted: 0, mapRead: 0 };
  const tx = {
    workTask: {
      count: async () => {
        calls.count += 1;
        return options.taskCount ?? 0;
      },
    },
    transaction: {
      delete: async () => {
        calls.deleted += 1;
        if (options.deleteError) throw options.deleteError;
      },
    },
    lodatCustomerMap: {
      findUnique: async () => {
        calls.mapRead += 1;
        return null;
      },
      update: async () => {
        throw new Error('map status must stay unchanged in this test');
      },
    },
  };
  const prisma = {
    transaction: {
      findUnique: async () => options.row,
    },
    $transaction: async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
  };
  const service = new TransactionsService(
    prisma as never,
    {} as never,
    {} as never,
  );
  return { service, calls };
}

const openRow: RemoveRow = {
  id: 'tx-1',
  status: 'DA_COC',
  createdByEmployeeId: kha.id,
  lodatCustomerMapId: 'map-1',
};

describe('TransactionsService.remove work tasks', () => {
  it('returns 409 and does not delete when a work task is still linked', async () => {
    const { service, calls } = harness({ row: openRow, taskCount: 1 });
    await assert.rejects(
      () => service.remove(kha, openRow.id),
      (err: unknown) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.getStatus(), 409);
        assert.equal(err.message, TRANSACTION_HAS_WORK_TASKS_MESSAGE);
        return true;
      },
    );
    assert.equal(calls.count, 1);
    assert.equal(calls.deleted, 0);
    assert.equal(calls.mapRead, 0);
  });

  it('deletes when no work task remains', async () => {
    const { service, calls } = harness({ row: { ...openRow, status: 'HUY' }, taskCount: 0 });
    await service.remove(kha, openRow.id);
    assert.equal(calls.count, 1);
    assert.equal(calls.deleted, 1);
    assert.equal(calls.mapRead, 0);
  });

  it('still syncs the lot listing when an open transaction has no work tasks', async () => {
    const { service, calls } = harness({ row: openRow, taskCount: 0 });
    await service.remove(kha, openRow.id);
    assert.equal(calls.mapRead, 1);
    assert.equal(calls.deleted, 1);
  });

  it('turns a work-task foreign key error into the same 409', async () => {
    const { service, calls } = harness({
      row: { ...openRow, status: 'HUY' },
      taskCount: 0,
      deleteError: foreignKey({ field_name: 'WorkTask_transactionId_fkey (index)' }),
    });
    await assert.rejects(
      () => service.remove(kha, openRow.id),
      (err: unknown) => {
        assert.ok(err instanceof ConflictException);
        assert.equal(err.getStatus(), 409);
        assert.equal(err.message, TRANSACTION_HAS_WORK_TASKS_MESSAGE);
        return true;
      },
    );
    assert.equal(calls.deleted, 1);
  });

  it('does not hide a different foreign key as a work-task message', async () => {
    const { service } = harness({
      row: { ...openRow, status: 'HUY' },
      taskCount: 0,
      deleteError: foreignKey({ field_name: 'Other_model_fkey', modelName: 'Other' }),
    });
    await assert.rejects(
      () => service.remove(kha, openRow.id),
      (err: unknown) => {
        assert.equal(err instanceof ConflictException, false);
        assert.ok(err instanceof Prisma.PrismaClientKnownRequestError);
        assert.equal(err.code, 'P2003');
        return true;
      },
    );
  });

  it('still returns 404 when the transaction is missing', async () => {
    const { service, calls } = harness({ row: null });
    await assert.rejects(() => service.remove(kha, 'missing'), NotFoundException);
    assert.equal(calls.count, 0);
    assert.equal(calls.deleted, 0);
  });
});
