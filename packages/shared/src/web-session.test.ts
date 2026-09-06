import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAdminOnlyCrmPath, isStaffLotWebPath } from './web-session.js';

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
  });
});
