import {readFile,writeFile} from 'node:fs/promises';
const file='CHANGELOG.md';
const text=await readFile(file,'utf8');
const current=(await readFile('VERSION','utf8')).trim();
if(!/^\d+\.\d+\.\d+$/.test(current)) throw new Error('Invalid VERSION');
const match=text.match(/^## Unreleased\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
if(!match) throw new Error('Missing Unreleased');
const body=match[1];
const categories={};
for(const m of body.matchAll(/^### (Breaking|Added|Fixed|Internal)\r?\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)) categories[m[1]]=m[2].trim();
const has=k=>/^[-*] \S/m.test(categories[k]??'');
const parts=current.split('.').map(Number);
if(has('Breaking')) {parts[0]++;parts[1]=0;parts[2]=0;}
else if(has('Added')) {parts[1]++;parts[2]=0;}
else if(has('Fixed')) parts[2]++;
const next=['Breaking','Added','Fixed'].some(has)?parts.join('.'):'none';
const [command,version]=process.argv.slice(2);
if(command==='next') console.log(next);
else if(command==='cut') {
  if(next==='none') throw new Error('Nothing to release');
  const notes=Object.entries(categories).filter(([,v])=>v).map(([k,v])=>'### '+k+'\n'+v).join('\n\n');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const replacement='## Unreleased\n\n### Breaking\n\n### Added\n\n### Fixed\n\n### Internal\n\n## '+next+' — '+today+'\n\n'+notes+'\n\n';
  await writeFile(file,text.replace(match[0],replacement));
  await writeFile('VERSION',next+'\n');
} else if(command==='notes') {
  if(!/^\d+\.\d+\.\d+$/.test(version??'')) throw new Error('Invalid version');
  const section=text.split('\n## ').find(s=>s.startsWith(version+' — '));
  if(!section) throw new Error('Version missing from changelog');
  console.log(section.slice(section.indexOf('\n')+1).trim());
} else throw new Error('Use next, cut or notes VERSION');
