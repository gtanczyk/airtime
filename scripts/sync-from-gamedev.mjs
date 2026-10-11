import { readFile, writeFile, mkdir, readdir, rm, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const allowed = new Set(['SPEC.md','GAME.json','game.ts','style.css','CAPTURE.json','ACCEPTANCE.json','AGENT.json','EDITOR.json','EDITOR.content.json','music.json','TRACE.json','PLAYTEST.json','index.html']);
export function sourcePath(p) {
  return typeof p === 'string' && !p.split('/').some(x => x === '..' || x === '.' || !x)
    && (allowed.has(p) || /^game\/[\w/-]+\.(ts|json)$/.test(p));
}
export async function applySnapshot(root, snapshot) {
  if (snapshot.readOnly || snapshot.files?.some(f => f.stagedBy) || snapshot.deleted?.length) {
    console.log('Studio has an active round or unsent edits; skipping this check.');
    return false;
  }
  if (!snapshot.version || !Array.isArray(snapshot.files) || snapshot.files.length === 0) throw new Error('Incomplete Studio snapshot');
  const statePath = path.join(root,'../.github/gamedev-sync.json');
  const previous = await readFile(statePath,'utf8').then(JSON.parse,()=>null);
  if(previous?.version === snapshot.version) {
    console.log('Studio version already synchronized; preserving repository edits.');
    return false;
  }
  const selected = snapshot.files.filter(f => sourcePath(f.path));
  for (const p of ['SPEC.md','GAME.json','game.ts']) if (!selected.some(f => f.path === p)) throw new Error('Missing required source: '+p);
  const paths = new Set();
  for (const f of selected) {
    if (typeof f.content !== 'string' || paths.has(f.path)) throw new Error('Invalid or duplicate source');
    paths.add(f.path);
  }
  // Only game source paths are mirrored. Workflow, scripts, README and LICENSE stay local.
  async function existing(dir = root) {
    const found = [];
    for (const e of await readdir(dir, {withFileTypes:true})) {
      const abs = path.join(dir,e.name), rel = path.relative(root,abs).split(path.sep).join('/');
      if (e.isDirectory() && (rel === 'game' || rel.startsWith('game/'))) found.push(...await existing(abs));
      else if (e.isFile() && sourcePath(rel)) found.push(rel);
    }
    return found;
  }
  for (const p of await existing()) if (!paths.has(p)) await rm(path.join(root,p));
  for (const f of selected) {
    const dest = path.join(root,f.path);
    await mkdir(path.dirname(dest),{recursive:true});
    await writeFile(dest,f.content);
  }
  await mkdir(path.dirname(statePath),{recursive:true});
  await writeFile(statePath,JSON.stringify({version:snapshot.version},null,2)+'\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,'version='+String(snapshot.version).replace(/[^A-Za-z0-9_.-]/g,'')+'\n');
  console.log('Downloaded Studio version '+snapshot.version);
  return true;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.env.GAMEDEV_CREATOR_KEY?.trim() ?? '';
  const token = input.match(/gdpl_pat_[a-f0-9]{16}_[A-Za-z0-9_-]{43}/)?.[0];
  if (!token) throw new Error('GAMEDEV_CREATOR_KEY must contain the personal access token used by deployment.');
  console.log('::add-mask::'+token);
  const response = await fetch('https://www.gamedev.pl/api/me/studio/games/airtime/sources', {
    headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error('Studio source download failed: HTTP '+response.status);
  await mkdir(path.join(process.cwd(),'src'),{recursive:true});
  await applySnapshot(path.join(process.cwd(),'src'),await response.json());
}
