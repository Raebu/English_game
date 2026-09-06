import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function loadQuestionSafety() {
  const source = await readFile(new URL('../question-safety.js', import.meta.url), 'utf8');
  const window = {
    choiceQuestion(subject, skill, prompt, answer, choices, explain, difficulty = 1) {
      return { subject, skill, prompt, answer, choices, explain, difficulty };
    },
    generateQuestion() {
      return {
        subject: 'maths',
        skill: 'Statistics',
        prompt: 'A chart shows 9 red books and 7 blue books. How many books altogether?',
        answer: '16',
        choices: ['9', '7', '2', '17'],
        explain: '9 + 7 = 16.',
      };
    },
  };
  vm.runInNewContext(source, {
    window,
    console: { error() {}, info() {} },
    Math,
    Date,
    String,
    Set,
    Error,
    setTimeout() {},
  });
  return window;
}

test('choice builder always includes exactly one correct answer', async () => {
  const window = await loadQuestionSafety();
  const q = window.choiceQuestion('english', 'Grammar', 'Choose it', 'correct', ['wrong', 'correct', 'wrong', 'other'], 'Because.');
  assert.equal(q.choices.filter((value) => value === 'correct').length, 1);
  assert.equal(new Set(q.choices).size, q.choices.length);
});

test('generated maths questions repair a missing correct option and retain verified arithmetic', async () => {
  const window = await loadQuestionSafety();
  const q = window.generateQuestion('maths');
  assert.equal(q.answer, '16');
  assert.equal(q.choices.includes('16'), true);
  assert.equal(q.choices.filter((value) => value === '16').length, 1);
});
