/* Mission quality layer: prevents repeat questions in a 10-question run and aligns fact concepts with subject skill labels. */
(() => {
  const originalChoose = window.chooseAdaptiveQuestion;
  if (typeof originalChoose !== 'function') return;

  const recentBySubject = new Map();

  const skillRules = {
    pe: [
      [/warm-up|cool-down|heart rate|recovery|hydration|stamina/i,'Fitness'],
      [/coordination/i,'Coordination'],
      [/balance|movement/i,'Movement'],
      [/fair play|teamwork/i,'Games'],
      [/swim|water/i,'Swimming safety'],
      [/healthy|habit|nutrition/i,'Healthy habits']
    ],
    science: [
      [/solid|liquid|gas|evaporation|condensation|freezing|melting/i,'States of matter'],
      [/vibration|pitch|volume|sound/i,'Sound'],
      [/circuit|conductor|insulator|electric/i,'Electricity'],
      [/digestive|tooth|incisor|molar|animal|vertebrate|invertebrate/i,'Animals including humans'],
      [/habitat|producer|living/i,'Living things']
    ],
    computing: [
      [/algorithm|sequence|decomposition/i,'Algorithms'],
      [/program|loop|variable|sprite|event/i,'Programming'],
      [/debug/i,'Debugging'],
      [/network/i,'Networks'],
      [/internet|browser|search engine/i,'Internet'],
      [/data|input|output/i,'Data'],
      [/password|phishing|personal information/i,'Digital safety']
    ],
    geography: [
      [/England|Scotland|Wales|Northern Ireland/i,'UK geography'],
      [/France|Spain|Italy|Germany/i,'Europe'],
      [/source|mouth|tributary|river/i,'Rivers'],
      [/latitude|longitude|contour/i,'Maps'],
      [/mountain/i,'Mountains'],
      [/urban|rural|settlement/i,'Settlements'],
      [/climate|equator/i,'Climate']
    ],
    history: [
      [/chronology|AD 43|1066/i,'Chronology'],
      [/Roman|emperor|legion|aqueduct|Boudica|Hadrian/i,'Romans'],
      [/Anglo-Saxon/i,'Anglo-Saxons'],
      [/Viking|longship/i,'Vikings'],
      [/primary source|secondary source|archaeology|artefact/i,'Evidence & sources']
    ],
    art: [
      [/primary colours|secondary colours|tone|colour/i,'Colour'],
      [/texture|pattern/i,'Pattern'],
      [/sketch|drawing/i,'Drawing'],
      [/sculpture/i,'Sculpture'],
      [/portrait|landscape|composition/i,'Evaluate & improve']
    ],
    design: [
      [/prototype|criteria|user/i,'Design'],
      [/evaluate/i,'Evaluate'],
      [/structure/i,'Structures'],
      [/mechanism|lever|linkage/i,'Mechanisms'],
      [/nutrition|hygiene|food/i,'Food & nutrition']
    ],
    music: [
      [/pulse/i,'Pulse'],[/rhythm|bar/i,'Rhythm'],[/pitch|melody|harmony/i,'Pitch'],
      [/tempo|dynamics|listening/i,'Listening'],[/rest|notation/i,'Notation'],[/composer|composition/i,'Composition']
    ],
    life: [
      [/budget|need|want|saving/i,'Money sense'],[/risk/i,'Safety'],[/empathy|assertive/i,'Communication'],
      [/priority/i,'Organisation'],[/evidence|reliable source/i,'Critical thinking']
    ]
  };

  function alignSkill(q) {
    const rules = skillRules[q.subject];
    if (!rules) return q;
    const haystack = `${q.prompt || ''} ${q.answer || ''} ${q.explain || ''}`;
    const match = rules.find(([re]) => re.test(haystack));
    return match ? { ...q, skill: match[1] } : q;
  }

  window.chooseAdaptiveQuestion = function(subject) {
    const recent = recentBySubject.get(subject) || [];
    let q = null;
    for (let tries = 0; tries < 80; tries++) {
      q = alignSkill(originalChoose(subject));
      const fingerprint = `${String(q.prompt).trim()}|${String(q.answer).trim()}`;
      if (!recent.includes(fingerprint)) {
        recent.push(fingerprint);
        if (recent.length > 10) recent.shift();
        recentBySubject.set(subject, recent);
        return q;
      }
    }
    throw new Error(`Unable to generate a unique ${subject} question after 80 attempts`);
  };

  window.__resetMissionQuestionHistory = function(subject) {
    if (subject) recentBySubject.delete(subject); else recentBySubject.clear();
  };

  const originalStart = window.startLevel;
  if (typeof originalStart === 'function') {
    window.startLevel = function(subject, options) {
      window.__resetMissionQuestionHistory(subject);
      return originalStart(subject, options);
    };
  }
})();