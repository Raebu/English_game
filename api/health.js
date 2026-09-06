export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).json({
    ok: true,
    service: 'genius-academy',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    aiTutorConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
}
