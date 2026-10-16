import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound,resolveLanding,TAU,MAX_POWER,COMBO_CAP,comboMultiplier} from '../../../src/game/model.ts';
import {stepFlight,landingCue} from '../../../src/game/flight.ts';
import {cameraAltitude,stagePoint} from '../../../src/game/coaching.ts';

function flight(rot=TAU,shape=0) {
 const r=createRound(false);r.rot=rot;r.spinTotal=rot;r.radBy[shape]=rot;r.shapeMask=1<<shape;return r;
}

test('incomplete upside-down rotations crash instead of receiving a free reset',()=>{
 for(const rot of [1.4,Math.PI,4.7])assert.equal(resolveLanding(flight(rot)).grade,'crash');
 assert.equal(resolveLanding(flight(0)).grade,'flat');
 assert.equal(resolveLanding(flight(1)).grade,'wobble');
});
test('landing windows award points, grow power, and reset combo on a wobble',()=>{
 const r=flight(TAU+.1);const result=resolveLanding(r);
 assert.equal(result.grade,'perfect');assert.equal(result.points,210);assert.equal(r.combo,1);assert.equal(r.power,580);
 r.rot=TAU+1;r.spinTotal=TAU+1;r.radBy[0]=TAU+1;r.shapeMask=1;
 assert.equal(resolveLanding(r).grade,'wobble');assert.equal(r.combo,0);assert.ok(r.score>210);
});
test('holding through a bounce registers the first grab and shape on the next flight',()=>{
 const r=flight();r.holding=true;resolveLanding(r);for(let i=0;i<4;i++)stepFlight(r,true,1/30);
 assert.equal(r.grabs,1);assert.equal(r.shapeIndex,0);assert.equal(r.shapeMask,1);
});
test('a brief regrab does not farm variety and cannot skip the release delay',()=>{
 const r=createRound();r.saltos=12;stepFlight(r,true,.05);stepFlight(r,false,.05);stepFlight(r,true,.01);
 assert.equal(r.shapeIndex,0);
 for(let i=0;i<3;i++)stepFlight(r,false,.05);
 stepFlight(r,true,.01);assert.equal(r.shapeIndex,1);assert.equal(r.shapeMask,1);
 stepFlight(r,true,.05);assert.equal(r.shapeMask,3);
});
test('pure routine earns every shape and respects power and multiplier caps',()=>{
 const r=createRound();
 for(let i=0;i<30;i++){
  r.rot=TAU;r.spinTotal=TAU;r.radBy=[TAU,0,0,0];r.shapeMask=1;
  assert.equal(resolveLanding(r).grade,'perfect');
 }
 assert.equal(r.saltos,30);assert.equal(r.combo,30);assert.equal(r.power,MAX_POWER);
 assert.equal(comboMultiplier(r.combo),1+COMBO_CAP*.5);
});
test('release guidance is reserved for completed flips and matches landing windows',()=>{
 const r=createRound();assert.equal(landingCue(r),'hold');
 r.rot=TAU-.15;r.spinTotal=r.rot;r.spinning=true;assert.equal(landingCue(r),'release');
 r.spinning=false;assert.equal(landingCue(r),'safe');
 r.rot=Math.PI;r.vy=-500;r.alt=20;assert.equal(landingCue(r),'danger');
});
test('camera follows altitude at constant scale and returns to the trampoline in both orientations',()=>{
 const r=createRound();
 for(const height of [400,640])for(let alt=0;alt<=MAX_POWER**2/1800;alt+=5){
  r.alt=alt;r.camAlt=cameraAltitude(r,height);
  const y=stagePoint(r,height,alt);
  assert.ok(y-43>=44,`halo inside playfield at ${height}/${alt}`);
  assert.equal(stagePoint(r,height,0)-y,alt,'world distances do not shrink');
  assert.equal(stagePoint(r,height,alt+20),y-20,'camera translates without scaling');
  if(alt>400)assert.ok(r.camAlt>0,'camera follows high jumps');
 }
 for(const height of [400,640]){r.alt=0;r.camAlt=cameraAltitude(r,height);assert.equal(r.camAlt,0);assert.equal(stagePoint(r,height,0),height-102);}
});
