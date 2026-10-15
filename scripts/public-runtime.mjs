import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';

export async function readKitPin(root) {
 const pin=JSON.parse(await readFile(path.join(root,'.github/gamedev-kit.json'),'utf8'));
 if(!/^[a-f0-9]{40}$/.test(pin.engineRef)||!/^[a-f0-9]{64}$/.test(pin.kitSha256))
  throw new Error('gamedev-kit.json must pin a full engineRef and kitSha256.');
 return {engineRef:pin.engineRef,kitSha256:pin.kitSha256};
}

export async function preparePublicRuntime(destination,pin,run) {
 const kitUrl=`https://www.gamedev.pl/api/kit/${pin.engineRef}.tgz`;
 console.log('Downloading public Airtime GameKit '+pin.engineRef+'…');
 const response=await fetch(kitUrl,{signal:AbortSignal.timeout(120000)});
 if(!response.ok) {
  const hint=response.status===404
   ? ' Ask Grzegorz to check PUBLIC_KIT_DOWNLOAD=true and deploy, or confirm that the pinned ref is still supported.'
   : '';
  throw new Error('Public GameKit download: HTTP '+response.status+'.'+hint);
 }
 const archive=Buffer.from(await response.arrayBuffer());
 if(createHash('sha256').update(archive).digest('hex')!==pin.kitSha256)
  throw new Error('Public GameKit SHA-256 mismatch; nothing was installed. Check gamedev-kit.json.');

 const kitDirectory=path.join(destination,'.kit');
 const archivePath=path.join(destination,'kit.tgz');
 await mkdir(kitDirectory);
 await writeFile(archivePath,archive);
 await run('tar',['-xzf',archivePath,'--strip-components=1','-C',kitDirectory],destination);
 const readJson=async name=>JSON.parse(await readFile(path.join(kitDirectory,name),'utf8'));
 const pkg=await readJson('package.json');
 const lock=await readJson('package-lock.json');
 const kit=await readJson('kit.json');
 const tsconfig=await readJson('tsconfig.json');
 if(pkg.name!=='@gamedevpl/gamekit'||kit.engineRef!==pin.engineRef)
  throw new Error('The public kit does not match the pinned GameKit.');
 if(lock.lockfileVersion!==3||!lock.packages?.[''])
  throw new Error('Unsupported GameKit lockfile.');

 // Match workspace-setup.mjs, using the stable public URL instead of a local tarball.
 const scripts=Object.fromEntries(Object.entries(pkg.scripts).map(([name,script])=>[
  name,script.includes('--max-old-space-size=8192')
   ? `node --max-old-space-size=8192 node_modules/@gamedevpl/gamekit/bin/gamekit.mjs ${name}`
   : `gamedev-kit ${name}`
 ]));
 const devDependencies={'@gamedevpl/gamekit':kitUrl};
 if(pkg.dependencies?.['@gamedevpl/cli'])devDependencies['@gamedevpl/cli']=pkg.dependencies['@gamedevpl/cli'];
 const runtimePackage={name:'airtime-local',private:true,type:'module',scripts,devDependencies};
 const runtimeLock={...lock,name:runtimePackage.name,packages:{
  ...Object.fromEntries(Object.entries(lock.packages).map(([name,entry])=>[name,{...entry,dev:true}])),
  '':{name:runtimePackage.name,devDependencies},
  'node_modules/@gamedevpl/gamekit':{
   version:pkg.version,resolved:kitUrl,
   integrity:'sha512-'+createHash('sha512').update(archive).digest('base64'),
   dev:true,dependencies:pkg.dependencies,bin:pkg.bin,license:pkg.license
  }
 }};
 tsconfig.compilerOptions.rootDirs=['.','node_modules/@gamedevpl/gamekit'];
 tsconfig.include=['node_modules/@gamedevpl/gamekit/shared/game-kit.d.ts','games/**/*.ts'];
 tsconfig.exclude=[];
 for(const [name,value] of Object.entries({
  'package.json':runtimePackage,'package-lock.json':runtimeLock,
  'tsconfig.json':tsconfig,'kit.json':{...kit,installation:'npm'},
  'gamedev.lock':{slug:'airtime',...pin,kitUrl},'public-kit.json':pin
 }))await writeFile(path.join(destination,name),JSON.stringify(value,null,2)+'\n');
 await rm(kitDirectory,{recursive:true,force:true});
 await rm(archivePath);
}
