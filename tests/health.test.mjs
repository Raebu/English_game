import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/health.js';

function responseHarness() {
  return {
    statusCode: 200,
    headers: new Map(),
    body: undefined,
    setHeader(name, value) { this.headers.set(name.toLowerCase(), String(value)); },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('health endpoint is no-store and reports deployment identity safely', () => {
  const oldSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.VERCEL_GIT_COMMIT_SHA = 'abc123';
  delete process.env.OPENAI_API_KEY;
  try {
    const res = responseHarness();
    handler({}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(res.body, {
      ok: true,
      service: 'genius-academy',
      commit: 'abc123',
      aiTutorConfigured: false,
    });
  } finally {
    if (oldSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
    else process.env.VERCEL_GIT_COMMIT_SHA = oldSha;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
