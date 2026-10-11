import {readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
const root=path.join(process.cwd(),'src'), target=process.env.VERIFY_ROOT;
if(!target) throw new Error('Missing VERIFY_ROOT');
const destination=path.join(target,'games/airtime');
let generatedPage;
try{generatedPage=await readFile(path.join(destination,'index.html'));}catch{}
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
const allowed=new Set(['SPEC.md','GAME.json','game.ts','style.css','CAPTURE.json','ACCEPTANCE.json','AGENT.json','EDITOR.json','EDITOR.content.json','music.json','PLAYTEST.json','TRACE.json','index.html']);
async function copy(dir=root) {
 for(const e of await readdir(dir,{withFileTypes:true})){
  const abs=path.join(dir,e.name),rel=path.relative(root,abs).split(path.sep).join('/');
  if(e.isDirectory()&&(rel==='game'||rel.startsWith('game/'))) await copy(abs);
  else if(e.isFile()&&(allowed.has(rel)||/^game\/[\w/-]+\.(ts|json)$/.test(rel))){
   const dest=path.join(destination,rel);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,await readFile(abs));
  }
 }
}
await copy();
if(generatedPage && !await readFile(path.join(destination,'index.html')).then(()=>true,()=>false)) await writeFile(path.join(destination,'index.html'),generatedPage);
const kit=JSON.parse(await readFile(path.join(target,'kit.json'),'utf8'));
const scripts=kit.cliVerification??{typecheck:'typecheck',checkStatic:'check:static'};
for(const name of [scripts.typecheck,scripts.checkStatic]){
 if(!/^[a-z][a-z0-9:-]*$/.test(name))throw new Error('Invalid kit check name');
}
await writeFile(path.join(target,'verify-scripts.json'),JSON.stringify(scripts));
