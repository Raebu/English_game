/* Question safety layer: guarantees the correct answer is always present and audits generated questions. */
(() => {
  const g = window;
  const originalChoiceQuestion = g.choiceQuestion;
  const originalGenerateQuestion = g.generateQuestion;
  const SUBJECT_IDS = ['maths','english','science','computing','geography','history','french','art','design','music','pe','life'];

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
  const normalise = value => String(value ?? '').trim();

  // Always reserve one slot for the correct answer before selecting distractors.
  g.choiceQuestion = function(subject, skill, prompt, answer, options, explain, difficulty = 1) {
    const answerText = normalise(answer);
    const distractors = [...new Set((options || []).map(normalise))]
      .filter(x => x && x !== answerText);
    const choices = safeShuffle([answerText, ...safeShuffle(distractors).slice(0, 3)]);
    return {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      subject, skill, prompt, answer: answerText, choices, explain, difficulty
    };
  };

  function verifyMath(q) {
    if (q.subject !== 'maths') return [];
    const p = normalise(q.prompt), a = normalise(q.answer), errors = [];
    let m, expected;

    if ((m = p.match(/^What digit is in the (tens|hundreds|thousands) place in (\d+)\?$/))) {
      const n = Number(m[2]), place = {tens:10,hundreds:100,thousands:1000}[m[1]];
      expected = String(Math.floor(n / place) % 10);
    } else if ((m = p.match(/^(\d+) ([+−]) (\d+) = \?$/))) {
      expected = String(m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]));
    } else if ((m = p.match(/^(\d+) ([×÷]) (\d+) = \?$/))) {
      expected = String(m[2] === '×' ? Number(m[1]) * Number(m[3]) : Number(m[1]) / Number(m[3]));
    } else if ((m = p.match(/^Which fraction means (\d+) out of (\d+) equal parts\?$/))) {
      expected = `${m[1]}/${m[2]}`;
    } else if ((m = p.match(/^Write (\d+)\/10 as a decimal\.$/))) {
      expected = (Number(m[1]) / 10).toFixed(1);
    } else if ((m = p.match(/^You have £([\d.]+) and spend £([\d.]+)\. How much is left\?$/))) {
      expected = `£${(Number(m[1]) - Number(m[2])).toFixed(2)}`;
    } else if ((m = p.match(/^(\d+) metres equals how many centimetres\?$/))) {
      expected = `${Number(m[1]) * 100} cm`;
    } else if ((m = p.match(/^Which shape has (\d+) sides\?$/))) {
      expected = ({3:'triangle',4:'quadrilateral',5:'pentagon',6:'hexagon',8:'octagon'})[Number(m[1])];
    } else if ((m = p.match(/^A chart shows (\d+) red books and (\d+) blue books\. How many books altogether\?$/))) {
      expected = String(Number(m[1]) + Number(m[2]));
    } else if (p === 'How many minutes is 1 hour?') expected = '60 minutes';
    else if (p === 'How many minutes is 1 hour 30 minutes?') expected = '90 minutes';
    else if (p === 'How many minutes is 2 hours?') expected = '120 minutes';
    else if ((m = p.match(/^How many minutes is (\d+) minutes\?$/))) expected = `${m[1]} minutes`;

    if (expected !== undefined && a !== expected) errors.push(`maths answer mismatch: expected ${expected}, got ${a}`);
    return errors;
  }

  function validate(q) {
    const errors = [];
    if (!q || typeof q !== 'object') return ['question is not an object'];
    if (!normalise(q.prompt)) errors.push('missing prompt');
    if (!normalise(q.answer)) errors.push('missing answer');
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push('fewer than 2 answer choices');
    const choices = (q.choices || []).map(normalise), answer = normalise(q.answer);
    if (!choices.includes(answer)) errors.push(`correct answer is missing from choices: ${answer}`);
    if (choices.filter(x => x === answer).length !== 1) errors.push('correct answer appears more than once');
    if (new Set(choices).size !== choices.length) errors.push('duplicate choices');
    errors.push(...verifyMath(q));
    return errors;
  }

  g.generateQuestion = function(subject) {
    let q = originalGenerateQuestion(subject);
    let errors = validate(q);
    if (errors.some(x => x.includes('missing from choices')) && q) {
      const answer = normalise(q.answer);
      const distractors = [...new Set((q.choices || []).map(normalise))].filter(x => x && x !== answer).slice(0, 3);
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
    const failures = [];
    let checked = 0;
    SUBJECT_IDS.forEach(subject => {
      for (let i = 0; i < 1000; i++) {
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

    const regression = g.choiceQuestion('maths','Statistics','A chart shows 9 red books and 7 blue books. How many books altogether?','16',['9','7','2','17'],'9 + 7 = 16.',2);
    if (!regression.choices.includes('16')) failures.push({subject:'maths',errors:['9 + 7 regression failed'],q:regression});

    g.__questionAudit = { checked, failures, passed: failures.length === 0, ranAt: new Date().toISOString() };
    if (failures.length) console.error(`[QuestionSafety] AUDIT FAILED: ${failures.length} failures`, failures.slice(0,20));
    else console.info(`[QuestionSafety] Audit passed: ${checked} generated questions checked across ${SUBJECT_IDS.length} subjects.`);
  }

  setTimeout(audit, 0);
})();
