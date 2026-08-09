import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = process.cwd();
const out = join(root, 'dist');
const allowed = new Set(['.html', '.css', '.js', '.webmanifest', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.json']);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const name of await readdir(root)) {
  if (['dist', 'api', 'android', 'blender', 'node_modules', '.git', '.github', 'public', 'assets'].includes(name)) continue;
  const full = join(root, name);
  const info = await stat(full);
  if (info.isFile() && allowed.has(extname(name).toLowerCase())) {
    await cp(full, join(out, name));
  }
}

for (const dir of ['public', 'assets']) {
  try {
    await cp(join(root, dir), dir === 'public' ? out : join(out, dir), { recursive: true });
  } catch {
    // optional static directory
  }
}

console.log('Prepared Genius Academy static site in dist/ with static assets.');
