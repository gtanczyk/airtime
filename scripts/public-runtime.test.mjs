import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readKitPin,preparePublicRuntime} from './public-runtime.mjs';

const pin=JSON.parse(await readFile(new URL('../gamedev-kit.json',import.meta.url),'utf8'));

test('official CLI source-repository entry points remain regular files at the root',async()=>{
 for(const file of ['../gamedev-kit.json','../src/SPEC.md'])
  assert.ok((await stat(new URL(file,import.meta.url))).isFile(),file);
 const spec=await readFile(new URL('../src/SPEC.md',import.meta.url),'utf8');
 assert.match(spec,/^slug: airtime$/m);
});

test('only accepts full engine refs and SHA-256 pins',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'airtime-pin-'));
 try {
  await writeFile(path.join(root,'gamedev-kit.json'),JSON.stringify(pin));
  assert.deepEqual(await readKitPin(root),pin);
  for(const invalid of [{...pin,engineRef:pin.engineRef.slice(0,7)},{...pin,kitSha256:'invalid'}]) {
   await writeFile(path.join(root,'gamedev-kit.json'),JSON.stringify(invalid));
   await assert.rejects(readKitPin(root),/full engineRef and kitSha256/);
  }
 } finally {await rm(root,{recursive:true,force:true});}
});

test('404 stops at the public endpoint and explains the platform flag',async t=>{
 let requests=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  requests++;
  assert.equal(url,`https://www.gamedev.pl/api/kit/${pin.engineRef}.tgz`);
  assert.equal(options.headers,undefined);
  return new Response(null,{status:404});
 });
 await assert.rejects(preparePublicRuntime('/unused',pin,()=>assert.fail('must not install')),
  /HTTP 404.*PUBLIC_KIT_DOWNLOAD=true/);
 assert.equal(requests,1);
});

test('tampered kit fails before extraction or installation',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('not the pinned archive'));
 await assert.rejects(preparePublicRuntime('/unused',pin,()=>assert.fail('must not extract')),
  /SHA-256 mismatch; nothing was installed/);
});
