import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {applySnapshot} from './sync-from-gamedev.mjs';
const snapshot=(version,code='old')=>({version,files:[{path:'SPEC.md',content:'spec'},{path:'GAME.json',content:'{}'},{path:'game.ts',content:code}]});
async function fixture(t){const repo=await mkdtemp(path.join(tmpdir(),'airtime-sync-'));t.after(()=>rm(repo,{recursive:true,force:true}));const root=path.join(repo,'src');await mkdir(root);return {repo,root,state:path.join(repo,'.github/gamedev-sync.json')};}
test('first sync records the source baseline and accepts subsequent Studio changes',async t=>{
 const f=await fixture(t);assert.equal(await applySnapshot(f.root,snapshot('v1')),true);
 const state=JSON.parse(await readFile(f.state,'utf8'));assert.match(state.sourceHash,/^[a-f0-9]{64}$/);
 assert.equal(await applySnapshot(f.root,snapshot('v2','studio edit')),true);
 assert.equal(await readFile(path.join(f.root,'game.ts'),'utf8'),'studio edit');
});
test('a new Studio version cannot roll back repository edits or update the sync marker',async t=>{
 const f=await fixture(t);await applySnapshot(f.root,snapshot('v1'));
 await writeFile(path.join(f.root,'game.ts'),'fixed camera');
 assert.equal(await applySnapshot(f.root,snapshot('v2')),false);
 assert.equal(await readFile(path.join(f.root,'game.ts'),'utf8'),'fixed camera');
 assert.equal(JSON.parse(await readFile(f.state,'utf8')).version,'v1');
});
test('matching deployed sources reconcile the baseline and allow later Studio edits',async t=>{
 const f=await fixture(t);await applySnapshot(f.root,snapshot('v1'));
 await writeFile(path.join(f.root,'game.ts'),'fixed camera');
 assert.equal(await applySnapshot(f.root,snapshot('v2','fixed camera')),true);
 assert.equal(await applySnapshot(f.root,snapshot('v3','next Studio edit')),true);
});
test('legacy version-only markers use Git history to preserve newer source edits',async t=>{
 const f=await fixture(t);await applySnapshot(f.root,snapshot('v1'));
 await writeFile(f.state,JSON.stringify({version:'v1'}));
 const git=(...args)=>execFileSync('git',args,{cwd:f.repo,stdio:'pipe'});
 git('init');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Baseline');
 await writeFile(path.join(f.root,'game.ts'),'fixed camera');
 assert.equal(await applySnapshot(f.root,snapshot('v2')),false);
 assert.equal(await readFile(path.join(f.root,'game.ts'),'utf8'),'fixed camera');
});
test('legacy markers still accept Studio changes when repository sources are unchanged',async t=>{
 const f=await fixture(t);await applySnapshot(f.root,snapshot('v1'));
 await writeFile(f.state,JSON.stringify({version:'v1'}));
 const git=(...args)=>execFileSync('git',args,{cwd:f.repo,stdio:'pipe'});
 git('init');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Baseline');
 assert.equal(await applySnapshot(f.root,snapshot('v2','studio edit')),true);
});
