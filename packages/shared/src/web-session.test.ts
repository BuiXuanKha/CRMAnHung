import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAdminOnlyCrmPath,
  isCrmAppPath,
  staffDashboardFallbackPath,
} from './web-session.js';

describe('isAdminOnlyCrmPath', () => {
  it('treats all dashboard as admin-only', () => {
    assert.equal(isAdminOnlyCrmPath('/dashboard'), true);
    assert.equal(isAdminOnlyCrmPath('/dashboard/bai-viet'), true);
    assert.equal(isAdminOnlyCrmPath('/dashboard/lo-dat'), true);
    assert.equal(isAdminOnlyCrmPath('/lo-dat'), false);
    assert.equal(isAdminOnlyCrmPath('/quan-tri/nguoi-dung'), true);
  });
});

describe('isCrmAppPath + fallback', () => {
  it('includes core CRM paths', () => {
    assert.equal(isCrmAppPath('/lo-dat'), true);
    assert.equal(isCrmAppPath('/khach-hang'), true);
    assert.equal(isCrmAppPath('/dashboard'), true);
  });

  it('falls STAFF dashboard hits to CRM home (khach-hang)', () => {
    assert.equal(staffDashboardFallbackPath(), '/khach-hang');
  });
});
