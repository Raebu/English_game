/* Question safety layer: guarantees the correct answer is always present and audits generated questions. */
(() => {
  const g = window;
  const originalChoiceQuestion = g.choiceQuestion;
  const originalGenerateQuestion = g.generateQuestion;

  if (typeof originalChoiceQuestion !== 'function' || typeof originalGenerateQuestion !== 'function') {
    console.error('[QuestionSafety] Core generator functions were not found.');
    return;
  }

  function safeShuffle(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalise(value) {
    return String(value ?? '').trim();
  }

  // Always reserve one answer slot before selecting distractors.
  g.choiceQuestion = function(subject, skill, prompt, answer, options, explain, difficulty = 1) {
    const answerText = normalise(answer);
    const distractors = [...new Set((options || []).map(normalise))]
      .filter(x => x && x !== answerText);
    const selectedDistractors = safeShuffle(distractors).slice(0, 3);
    const choices = safeShuffle([answerText, ...selectedDistractors]);
    return {
      id: (typeof g.uid === 'function' ? g.uid() : Math.random().toString(36).slice(2) + Date.now().toString(36)),
      subject, skill, prompt, answer: answerText, choices, explain, difficulty
    };
  };

  function validate(q) {
    const errors = [];
    if (!q || typeof q !== 'object') return ['question is not an object'];
    if (!normalise(q.prompt)) errors.push('missing prompt');
    if (!normalise(q.answer)) errors.push('missing answer');
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push('fewer than 2 answer choices');
    const choices = (q.choices || []).map(normalise);
    const answer = normalise(q.answer);
    if (!choices.includes(answer)) errors.push(`correct answer is missing from choices: ${answer}`);
    if (choices.filter(x => x === answer).length !== 1) errors.push('correct answer appears more than once');
    if (new Set(choices).size !== choices.length) errors.push('duplicate choices');
    return errors;
  }

  g.generateQuestion = function(subject) {
    let q = originalGenerateQuestion(subject);
    let errors = validate(q);
    if (errors.length && q) {
      const answer = normalise(q.answer);
      const distractors = [...new Set((q.choices || []).map(normalise))]
        .filter(x => x && x !== answer)
        .slice(0, 3);
      q = { ...q, answer, choices: safeShuffle([answer, ...distractors]) };
      errors = validate(q);
    }
    if (errors.length) {
      console.error('[QuestionSafety] Invalid question blocked', subject, errors, q);
      throw new Error(`Invalid ${subject} question: ${errors.join('; ')}`);
    }
    return q;
  };

  function audit() {
    const subjects = Object.keys(g.SUBJECTS || {});
    const failures = [];
    let checked = 0;
    subjects.forEach(subject => {
      for (let i = 0; i < 750; i++) {
        try {
          const q = g.generateQuestion(subject);
          const errors = validate(q);
          checked++;
          if (errors.length) failures.push({ subject, errors, q });
        } catch (error) {
          failures.push({ subject, errors: [error.message] });
        }
      }
    });

    const regression = g.choiceQuestion(
      'maths', 'Statistics',
      'A chart shows 9 red books and 7 blue books. How many books altogether?',
      '16', ['9', '7', '2', '17'],
      '9 + 7 = 16.', 2
    );
    if (!regression.choices.includes('16')) {
      failures.push({ subject: 'maths', errors: ['9 + 7 regression failed'], q: regression });
    }

    g.__questionAudit = { checked, failures, passed: failures.length === 0, ranAt: new Date().toISOString() };
    if (failures.length) console.error(`[QuestionSafety] AUDIT FAILED: ${failures.length} failures`, failures.slice(0, 20));
    else console.info(`[QuestionSafety] Audit passed: ${checked} generated questions checked across ${subjects.length} subjects.`);
  }

  setTimeout(audit, 0);
})();
