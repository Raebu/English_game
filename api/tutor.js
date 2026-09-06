const MAX_MESSAGE_LENGTH = 1500;
const MAX_WEAK_SKILLS = 5;

function safeWeakSkills(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_WEAK_SKILLS).map((item) => ({
    skill: typeof item?.skill === 'string' ? item.skill.slice(0, 80) : 'Unknown skill',
    mastery: Number.isFinite(Number(item?.mastery))
      ? Math.max(0, Math.min(100, Number(item.mastery)))
      : 0,
  }));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Please ask a question.' });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(413).json({ error: `Question must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
  }

  const childName = typeof body.childName === 'string' && body.childName.trim()
    ? body.childName.trim().slice(0, 80)
    : 'Learner';
  const requestedYear = Number(body.year);
  const year = Number.isInteger(requestedYear) && requestedYear >= 1 && requestedYear <= 6
    ? requestedYear
    : 4;
  const weakSkills = safeWeakSkills(body.weakSkills);
  const focus = weakSkills.map((x) => `${x.skill} (${x.mastery}% mastery)`).join(', ') || 'No mastery data yet';
  const fallback = `I can help with that. Start by telling me what part feels hardest. I’ll explain it in small Year ${year} steps, then give you one practice question.`;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI tutor is temporarily unavailable.',
      reply: fallback,
      mode: 'unavailable',
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TUTOR_MODEL || 'gpt-5.6-luna',
        max_output_tokens: 500,
        input: [
          {
            role: 'developer',
            content: `You are Genius Academy's safe, encouraging UK primary tutor for a Year ${year} child. Teach for mastery, not speed alone. Use British English. Keep explanations short, concrete and age-appropriate. Never shame mistakes. Ask at most one question at a time. Prefer worked examples, retrieval practice and hints before giving an answer. Do not discuss adult, sexual, violent, self-harm, drug, gambling or other age-inappropriate topics; redirect to a trusted adult when needed. The child's current priority skills are: ${focus}. The child is called ${childName}.`,
          },
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('AI provider request failed');
    const reply = data.output_text || data.output?.flatMap((x) => x.content || []).map((x) => x.text || '').join('\n').trim();
    if (!reply) throw new Error('AI provider returned no usable response');
    return res.status(200).json({ reply, mode: 'ai' });
  } catch (error) {
    console.error('Tutor provider failure');
    return res.status(502).json({
      error: 'AI tutor is temporarily unavailable.',
      reply: fallback,
      mode: 'unavailable',
    });
  }
}
