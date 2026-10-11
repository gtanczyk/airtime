import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const slug = 'airtime';
const dryRun = process.argv.includes('--dry-run');
const allowed = new Set(['SPEC.md', 'GAME.json', 'game.ts', 'style.css', 'CAPTURE.json', 'ACCEPTANCE.json', 'AGENT.json', 'EDITOR.json', 'EDITOR.content.json', 'music.json']);
async function collect(dir = root) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (entry.isDirectory() && relative === 'game') files.push(...await collect(absolute));
    else if (entry.isDirectory() && relative.startsWith('game/')) files.push(...await collect(absolute));
    else if (entry.isFile() && (allowed.has(relative) || /^game\/[\w/-]+\.(ts|json)$/.test(relative))) {
      files.push({ path: relative, content: await readFile(absolute, 'utf8') });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
const files = await collect();
for (const required of ['SPEC.md', 'GAME.json', 'game.ts']) {
  if (!files.some(file => file.path === required)) throw new Error(`Missing ${required}`);
}
const manifest = JSON.parse(files.find(file => file.path === 'GAME.json').content);
for (const field of ['goal', 'hint']) {
  for (const locale of ['en', 'pl']) {
    if (!manifest.howToPlay?.[field]?.[locale]?.trim()) throw new Error(`Missing howToPlay.${field}.${locale}`);
  }
}
if (dryRun) {
  console.log(`Validated ${files.length} source files:\n${files.map(file => file.path).join('\n')}`);
  process.exit(0);
}
const key = process.env.GAMEDEV_CREATOR_KEY?.trim();
if (!key) throw new Error('Set GitHub Actions secret GAMEDEV_CREATOR_KEY to your Gamedev.pl creator key.');
let id = 0;
let transportSession;
async function rpc(method, params) {
  const response = await fetch('https://www.gamedev.pl/api/mcp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-03-26',
      ...(transportSession ? { 'Mcp-Session-Id': transportSession } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
    signal: AbortSignal.timeout(120_000),
  });
  transportSession = response.headers.get('mcp-session-id') ?? transportSession;
  if (!response.ok) throw new Error(`Gamedev.pl HTTP ${response.status} during ${method}`);
  const text = await response.text();
  const body = response.headers.get('content-type')?.includes('text/event-stream')
    ? JSON.parse(text.split('\n').filter(line => line.startsWith('data:')).at(-1).slice(5))
    : JSON.parse(text);
  if (body.error) throw new Error(`MCP error ${body.error.code} during ${method}`);
  return body.result;
}
async function tool(name, args) {
  const result = await rpc('tools/call', { name, arguments: args });
  const data = result.structuredContent ?? JSON.parse(result.content.find(item => item.type === 'text').text);
  if (result.isError || data.error || data.rejected || data.ok === false) {
    // Do not dump replies: they may include capabilities or bearer credentials.
    const reason = String(data.error ?? data.reason ?? data.rejected ?? 'unknown refusal')
      .replaceAll(key, '[redacted]')
      .replace(/(?:mcp2_|gdpl_|member1_|creator1_)[A-Za-z0-9_.-]+/g, '[redacted]');
    throw new Error(`Gamedev.pl refused ${name}: ${reason.slice(0, 500)}`);
  }
  if (data.pendingMessages?.length) throw new Error('Creator messages are pending; handle them in Studio before deploying.');
  if (data.stop && name !== 'end') throw new Error(`Gamedev.pl requested stop during ${name}.`);
  return data;
}
await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'airtime-github-actions', version: '1.0.0' } });
await tool('open_round', { slug, feedback: `Deploy Airtime from GitHub commit ${process.env.GITHUB_SHA ?? 'local'}.` });
const session = await tool('start', { slug });
const sessionKey = session.sessionKey;
console.log(`::add-mask::${sessionKey}`);
try {
  await tool('report_progress', { sessionKey, step: 'testing', locale: 'pl', text: 'Deploying Airtime from GitHub.', textLocalized: 'Wdrażam Airtime z GitHuba.' });
  const kit = await tool('get_kit', { sessionKey });
  for (const file of files) await tool('stage_source_file', { sessionKey, ...file });
  const delivery = await tool('submit_sources', { sessionKey, fromStaged: true, mode: 'preview', kitEngineRef: kit.engineRef, note: `GitHub ${process.env.GITHUB_SHA ?? 'local'}` });
  if (!delivery.gateStarted) throw new Error('Sources were accepted, but the build did not start. Review Studio before retrying.');
  console.log(`Preview build started: ${delivery.deliveryId}. Verdict: https://www.gamedev.pl/studio/airtime`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `Airtime preview build started: \`${delivery.deliveryId}\`.\n\n[Build verdict and preview](https://www.gamedev.pl/studio/airtime). Acceptance is not a successful build verdict.\n`);
  }
} finally {
  await tool('end', { sessionKey });
}
