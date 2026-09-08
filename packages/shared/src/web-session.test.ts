import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DANG_BAI_WEB_PATH,
  isAdminOnlyCrmPath,
  isCrmAppPath,
  isStaffDangBaiPath,
  isStaffLotWebPath,
  staffDashboardFallbackPath,
} from './web-session.js';

describe('isStaffDangBaiPath', () => {
  it('matches /dang-bai only', () => {
    assert.equal(isStaffDangBaiPath('/dang-bai'), true);
    assert.equal(isStaffDangBaiPath('/dang-bai/x'), true);
    assert.equal(isStaffDangBaiPath('/dashboard/lo-dat'), false);
    assert.equal(isStaffDangBaiPath('/dashboard'), false);
    assert.equal(isStaffDangBaiPath('/dashboard/bai-viet'), false);
  });

  it('keeps deprecated alias in sync', () => {
    assert.equal(isStaffLotWebPath('/dang-bai'), true);
    assert.equal(isStaffLotWebPath('/dashboard/lo-dat'), false);
  });
});

describe('isAdminOnlyCrmPath', () => {
  it('treats all dashboard as admin-only', () => {
    assert.equal(isAdminOnlyCrmPath('/dashboard'), true);
    assert.equal(isAdminOnlyCrmPath('/dashboard/bai-viet'), true);
    assert.equal(isAdminOnlyCrmPath('/dashboard/lo-dat'), true);
    assert.equal(isAdminOnlyCrmPath('/dang-bai'), false);
    assert.equal(isAdminOnlyCrmPath('/quan-tri/nguoi-dung'), true);
  });
});

describe('isCrmAppPath + fallback', () => {
  it('includes dang-bai', () => {
    assert.equal(isCrmAppPath('/dang-bai'), true);
  });

  it('falls STAFF dashboard hits to CRM home (khach-hang)', () => {
    assert.equal(staffDashboardFallbackPath(), '/khach-hang');
    assert.notEqual(staffDashboardFallbackPath(), DANG_BAI_WEB_PATH);
  });
});
