export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, childName = 'Learner', weakSkills = [], year = 4 } = req.body || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Please ask a question.' });

  const focus = weakSkills.slice(0, 5).map(x => `${x.skill} (${x.mastery}% mastery)`).join(', ') || 'No mastery data yet';
  const fallback = `I can help with that. Start by telling me what part feels hardest. I’ll explain it in small Year ${year} steps, then give you one practice question.`;
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ reply: fallback, mode: 'offline-fallback' });

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TUTOR_MODEL || 'gpt-5.6-luna',
        max_output_tokens: 500,
        input: [
          {
            role: 'developer',
            content: `You are Genius Academy's safe, encouraging UK primary tutor for a Year ${year} child. Teach for mastery, not speed alone. Use British English. Keep explanations short, concrete and age-appropriate. Never shame mistakes. Ask at most one question at a time. Prefer worked examples, retrieval practice and hints before giving an answer. Do not discuss adult, sexual, violent, self-harm, drug, gambling or other age-inappropriate topics; redirect to a trusted adult when needed. The child's current priority skills are: ${focus}. The child is called ${childName}.`
          },
          { role: 'user', content: message.slice(0, 1500) }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'AI request failed');
    const reply = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join('\n').trim();
    return res.status(200).json({ reply: reply || fallback, mode: 'ai' });
  } catch (error) {
    console.error('Tutor error:', error);
    return res.status(200).json({ reply: fallback, mode: 'fallback' });
  }
}
