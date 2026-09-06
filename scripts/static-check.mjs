import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const allowedText = new Set(['.js', '.mjs', '.json', '.html', '.css', '.md', '.txt', '.xml', '.kts']);
const excluded = new Set(['.git', 'node_modules', 'dist', 'blender/renders']);
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

async function walk(dir) {
  const files = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const rel = relative(root, full).replaceAll('\\', '/');
    if ([...excluded].some((item) => rel === item || rel.startsWith(item + '/'))) continue;
    const info = await stat(full);
    if (info.isDirectory()) files.push(...await walk(full));
    else if (info.isFile() && allowedText.has(extname(name).toLowerCase())) files.push(full);
  }
  return files;
}

const problems = [];
for (const file of await walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const content = await readFile(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) problems.push(`${rel}: looks like a committed secret`);
  }
}

const vercel = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const headerValues = new Map(
  (vercel.headers?.[0]?.headers || []).map((item) => [String(item.key).toLowerCase(), String(item.value)])
);
for (const required of ['strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) {
  if (!headerValues.has(required)) problems.push(`vercel.json: missing ${required}`);
}

const manifest = await readFile(join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
if (!manifest.includes('android:allowBackup="false"')) problems.push('AndroidManifest.xml: learner-state backup is not disabled');
if (!manifest.includes('android:usesCleartextTraffic="false"')) problems.push('AndroidManifest.xml: cleartext traffic is not disabled');

const tutor = await readFile(join(root, 'api/tutor.js'), 'utf8');
if (!tutor.includes("res.status(503)") || !tutor.includes("res.status(502)")) {
  problems.push('api/tutor.js: AI provider/configuration failures are not visibly fail-closed');
}
if (!tutor.includes("Cache-Control', 'no-store")) problems.push('api/tutor.js: no-store response policy missing');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Static production-safety checks passed.');
