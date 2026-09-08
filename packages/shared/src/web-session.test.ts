import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAdminOnlyCrmPath, isCrmAppPath, isStaffLotWebPath } from './web-session.js';
import { isTasksPath } from './tasks.js';

describe('isStaffLotWebPath', () => {
  it('matches the staff lot publish page', () => {
    assert.equal(isStaffLotWebPath('/dashboard/lo-dat'), true);
    assert.equal(isStaffLotWebPath('/dashboard/lo-dat/x'), true);
    assert.equal(isStaffLotWebPath('/dashboard'), false);
    assert.equal(isStaffLotWebPath('/dashboard/bai-viet'), false);
  });
});

describe('isAdminOnlyCrmPath', () => {
  it('keeps lot publish off the admin-only list', () => {
    assert.equal(isAdminOnlyCrmPath('/dashboard/lo-dat'), false);
    assert.equal(isAdminOnlyCrmPath('/dashboard'), true);
    assert.equal(isAdminOnlyCrmPath('/dashboard/bai-viet'), true);
    assert.equal(isAdminOnlyCrmPath('/quan-tri/nguoi-dung'), true);
    assert.equal(isAdminOnlyCrmPath('/cong-viec'), false);
  });
});

describe('isCrmAppPath', () => {
  it('treats Công việc as a logged-in CRM route', () => {
    assert.equal(isCrmAppPath('/cong-viec'), true);
    assert.equal(isCrmAppPath('/cong-viec/x'), true);
    assert.equal(isCrmAppPath('/cong-viec-x'), false);
  });
});

describe('isTasksPath', () => {
  it('matches the tasks page and nested paths', () => {
    assert.equal(isTasksPath('/cong-viec'), true);
    assert.equal(isTasksPath('/cong-viec/x'), true);
    assert.equal(isTasksPath('/khach-hang'), false);
  });
});
