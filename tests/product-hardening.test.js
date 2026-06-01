import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const data = JSON.parse(await readFile(new URL('../server/data/hr-data.json', import.meta.url), 'utf8'));

test('demo users do not store plaintext passwords', () => {
  assert.ok(Array.isArray(data.users));
  for (const user of data.users) {
    assert.equal(user.password, undefined);
    assert.equal(user.passwordHash, undefined);
    assert.equal(user.passwordCredential.algorithm, 'pbkdf2-sha256');
    assert.ok(user.passwordCredential.iterations >= 100000);
    assert.match(user.passwordCredential.salt, /^[a-f0-9]{32}$/);
    assert.match(user.passwordCredential.hash, /^[a-f0-9]{64}$/);
  }
});

test('product collections are seeded for deployment readiness', () => {
  assert.ok(data.jobs.length >= 3);
  assert.ok(data.documents.length >= 2);
  assert.ok(data.payrollRuns.length >= 1);
  assert.ok(data.exports.some((item) => item.type === 'payroll-bank-file'));
  assert.ok(data.interviews.length >= 1);
  assert.ok(data.calendarEvents.length >= 1);
  assert.ok(data.outbox.length >= 1);
  assert.ok(data.integrations.length >= 4);
  assert.ok(data.auditLogs.length >= 1);
  assert.equal(data.completion.percent, 100);
});

test('integration backlog records provider and next step', () => {
  for (const integration of data.integrations) {
    assert.ok(integration.provider);
    assert.ok(integration.nextStep);
    assert.ok(integration.status);
  }
});

test('deployment artifacts are represented in product data', () => {
  assert.equal(data.deployment.docker, true);
  assert.equal(data.deployment.render, true);
  assert.equal(data.deployment.healthCheck, '/api/health');
});

test('deployment files are committed', async () => {
  await access(new URL('../Dockerfile', import.meta.url));
  await access(new URL('../render.yaml', import.meta.url));
});
