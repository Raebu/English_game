import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function loadMissionQuality(generator) {
  const source = await readFile(new URL('../mission-quality.js', import.meta.url), 'utf8');
  const window = {
    chooseAdaptiveQuestion: generator,
    startLevel(subject) { return subject; },
  };
  vm.runInNewContext(source, { window, Map, Error, String, RegExp });
  return window;
}

test('produces ten unique fingerprints within a 10-question mission', async () => {
  let i = 0;
  const window = await loadMissionQuality((subject) => ({
    subject,
    skill: 'Test',
    prompt: `Question ${++i}`,
    answer: String(i),
    explain: 'Explanation',
  }));

  const seen = new Set();
  for (let n = 0; n < 10; n++) {
    const q = window.chooseAdaptiveQuestion('maths');
    const fingerprint = `${q.prompt}|${q.answer}`;
    assert.equal(seen.has(fingerprint), false);
    seen.add(fingerprint);
  }
  assert.equal(seen.size, 10);
});

test('fails explicitly if the source pool cannot produce another unique question', async () => {
  const window = await loadMissionQuality((subject) => ({
    subject,
    skill: 'Test',
    prompt: 'Only question',
    answer: 'Only answer',
    explain: 'Explanation',
  }));

  window.chooseAdaptiveQuestion('maths');
  assert.throws(
    () => window.chooseAdaptiveQuestion('maths'),
    /Unable to generate a unique maths question after 80 attempts/
  );
});

test('starting a level resets only that subject history', async () => {
  let serial = 0;
  const window = await loadMissionQuality((subject) => ({
    subject,
    skill: 'Test',
    prompt: `Question ${serial}`,
    answer: String(serial++),
    explain: 'Explanation',
  }));

  window.chooseAdaptiveQuestion('english');
  assert.equal(window.startLevel('english'), 'english');
  assert.doesNotThrow(() => window.chooseAdaptiveQuestion('english'));
});
