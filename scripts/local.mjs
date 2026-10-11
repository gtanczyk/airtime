import {access,readFile,writeFile,mkdir,rm,rename} from 'node:fs/promises';
import {watch} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {loadEnvFile} from 'node:process';

const root=fileURLToPath(new URL('../',import.meta.url));
const runtime=path.join(root,'.gamedev/local');
try{loadEnvFile(path.join(root,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}
const command=process.argv[2]??'dev';
if(!['setup','dev','verify'].includes(command))throw new Error('Use setup, dev or verify');
const exists=p=>access(p).then(()=>true,()=>false);
const childEnv={...process.env};
delete childEnv.GAMEDEV_CREATOR_KEY;delete childEnv.GAMEDEV_PAT;
function run(executable,args,cwd=runtime,extra={}) {
 return new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{cwd,stdio:'inherit',env:{...childEnv,...extra},shell:false});
  child.on('error',reject);
  child.on('exit',code=>code===0?resolve():reject(new Error(executable+' exited with '+code)));
 });
}
async function preview(cli,args) {
 return new Promise((resolve,reject)=>{
  let output='';
  const child=spawn(process.execPath,[cli,...args],{cwd:runtime,env:childEnv,stdio:['inherit','pipe','inherit']});
  child.stdout.on('data',chunk=>{output+=chunk;process.stdout.write(chunk);});
  child.on('error',reject);
  child.on('exit',code=>code===0?resolve(output):reject(new Error('gamedevpl exited with '+code)));
 });
}
async function overlay() {
 await run(process.execPath,[path.join(root,'scripts/prepare-verify.mjs')],root,{VERIFY_ROOT:runtime});
}
async function setup() {
 if(!await exists(path.join(runtime,'.ready'))) {
  const temporary=path.join(root,'.gamedev/local-preparing');
  await mkdir(path.dirname(temporary),{recursive:true});
  await rm(temporary,{recursive:true,force:true});await mkdir(temporary);
  try {
   let archive;
   if(process.env.GAMEDEV_WORKSPACE_ARCHIVE)archive=await readFile(process.env.GAMEDEV_WORKSPACE_ARCHIVE);
   else {
    const token=(process.env.GAMEDEV_PAT??process.env.GAMEDEV_CREATOR_KEY??'').trim();
    if(!/^gdpl_pat_[a-f0-9]{16}_[A-Za-z0-9_-]{43}$/.test(token))
     throw new Error('First launch needs GAMEDEV_PAT in .env (create a PAT at https://www.gamedev.pl/studio/airtime/connect).');
    console.log('Downloading official Airtime workspace…');
    const response=await fetch('https://www.gamedev.pl/api/me/studio/games/airtime/workspace',{
     headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(120000)
    });
    if(!response.ok)throw new Error('Workspace download: HTTP '+response.status);
    archive=Buffer.from(await response.arrayBuffer());
   }
   const archivePath=path.join(temporary,'workspace.tgz');
   await writeFile(archivePath,archive);
   await run('tar',['-xzf',archivePath,'-C',temporary],temporary);
   await rm(archivePath);
   if(await exists(path.join(temporary,'setup.mjs')))await run(process.execPath,['setup.mjs'],temporary);
   else if(await exists(path.join(temporary,'workspace-setup.mjs')))await run(process.execPath,['workspace-setup.mjs','--force'],temporary);
   await run(process.platform==='win32'?'npm.cmd':'npm',['ci'],temporary);
   await writeFile(path.join(temporary,'.gamedev-slug'),'airtime\n');
   await writeFile(path.join(temporary,'.ready'),'ready\n');
   await rm(runtime,{recursive:true,force:true});
   await rename(temporary,runtime);
  } catch(error) {await rm(temporary,{recursive:true,force:true});throw error;}
 }
 await overlay();
}
await setup();
if(command==='setup')console.log('Local GameKit ready.');
else if(command==='verify') {
 const scripts=JSON.parse(await readFile(path.join(runtime,'verify-scripts.json'),'utf8'));
 for(const name of [scripts.typecheck,scripts.checkStatic])
  await run(process.platform==='win32'?'npm.cmd':'npm',['run',name]);
} else {
 const cliPackagePath=path.join(root,'node_modules/gamedevpl/package.json');
 const cliPackage=JSON.parse(await readFile(cliPackagePath,'utf8'));
 const bin=typeof cliPackage.bin==='string'?cliPackage.bin:cliPackage.bin.gamedevpl;
 if(!bin)throw new Error('gamedevpl executable missing; run npm install');
 const cli=path.resolve(path.dirname(cliPackagePath),bin);
 const smoke=process.argv.includes('--smoke');
 const output=await preview(cli,['play','--preview','--detach','airtime',...(smoke||process.argv.includes('--no-open')?['--no-open']:[])]);
 if(smoke) {
  try {
   const url=output.match(/http:\/\/127\.0\.0\.1:\d+\/[A-Za-z0-9]+\//)?.[0];
   if(!url)throw new Error('Preview URL missing');
   let passed=false;
   for(let attempt=0;attempt<120;attempt++){
    const state=await fetch(url+'status').then(r=>r.json());
    if(state.revision&&!state.busy){
     if(state.error)throw new Error(state.error);
     const html=await fetch(url+'game').then(r=>r.text());
     if(!html.includes('<canvas'))throw new Error('No game canvas in preview');
     console.log('PASS local preview builds Airtime and serves its canvas.');passed=true;break;
    }
    await new Promise(resolve=>setTimeout(resolve,500));
   }
   if(!passed)throw new Error('Preview did not finish building');
  } finally {await run(process.execPath,[cli,'play','--stop','airtime']);}
 } else {
 let timer,queue=Promise.resolve();
 const watcher=watch(path.join(root,'src'),{recursive:true},()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>{queue=queue.then(overlay).catch(error=>console.error(error.message));},200);
 });
 let closing=false;
 async function close(){
  if(closing)return;closing=true;watcher.close();clearTimeout(timer);await queue;
  try{await run(process.execPath,[cli,'play','--stop','airtime']);}finally{process.exit();}
 }
 process.on('SIGINT',close);process.on('SIGTERM',close);
 console.log('Watching src/. Press Ctrl+C to stop.');
 }
}
