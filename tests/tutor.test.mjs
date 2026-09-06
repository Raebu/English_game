import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/tutor.js';

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

test('rejects non-POST requests and advertises POST', async () => {
  const res = responseHarness();
  await handler({ method: 'GET', body: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.get('allow'), 'POST');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('rejects empty and oversized child messages before provider access', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const empty = responseHarness();
    await handler({ method: 'POST', body: { message: '   ' } }, empty);
    assert.equal(empty.statusCode, 400);

    const large = responseHarness();
    await handler({ method: 'POST', body: { message: 'x'.repeat(1501) } }, large);
    assert.equal(large.statusCode, 413);
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = original;
  }
});

test('fails closed when the AI provider credential is absent', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const res = responseHarness();
    await handler({ method: 'POST', body: { message: 'Help with fractions', childName: 'A', year: 4 } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.mode, 'unavailable');
    assert.match(res.body.reply, /Year 4/);
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = original;
  }
});

test('sanitises child context and returns provider output without leaking failures', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  let providerBody;
  globalThis.fetch = async (_url, init) => {
    providerBody = JSON.parse(init.body);
    return {
      ok: true,
      async json() { return { output_text: 'Try splitting the number into equal parts.' }; },
    };
  };
  try {
    const res = responseHarness();
    await handler({
      method: 'POST',
      body: {
        message: '  Explain fractions  ',
        childName: 'A'.repeat(100),
        year: 99,
        weakSkills: Array.from({ length: 10 }, (_, i) => ({ skill: 'skill-' + i, mastery: 150 })),
      },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.mode, 'ai');
    assert.equal(res.body.reply, 'Try splitting the number into equal parts.');
    assert.equal(providerBody.input[1].content, 'Explain fractions');
    assert.match(providerBody.input[0].content, /Year 4/);
    assert.ok(providerBody.input[0].content.includes('A'.repeat(80)));
    assert.equal((providerBody.input[0].content.match(/skill-/g) || []).length, 5);
    assert.match(providerBody.input[0].content, /100% mastery/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('provider failure returns 502 with a safe unavailable response', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  globalThis.fetch = async () => ({ ok: false, async json() { return { error: { message: 'secret provider detail' } }; } });
  try {
    const res = responseHarness();
    await handler({ method: 'POST', body: { message: 'Hello' } }, res);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.mode, 'unavailable');
    assert.equal(res.body.error, 'AI tutor is temporarily unavailable.');
    assert.doesNotMatch(JSON.stringify(res.body), /secret provider detail/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
