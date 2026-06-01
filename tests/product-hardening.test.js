import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const data = JSON.parse(await readFile(new URL('../server/data/hr-data.json', import.meta.url), 'utf8'));

test('demo users do not store plaintext passwords', () => {
  assert.ok(Array.isArray(data.users));
  for (const user of data.users) {
    assert.equal(user.password, undefined);
    assert.match(user.passwordHash, /^[a-f0-9]{64}$/);
  }
});

test('product collections are seeded for deployment readiness', () => {
  assert.ok(data.jobs.length >= 3);
  assert.ok(data.documents.length >= 2);
  assert.ok(data.payrollRuns.length >= 1);
  assert.ok(data.integrations.length >= 4);
  assert.ok(data.auditLogs.length >= 1);
});

test('integration backlog records provider and next step', () => {
  for (const integration of data.integrations) {
    assert.ok(integration.provider);
    assert.ok(integration.nextStep);
    assert.ok(integration.status);
  }
});
