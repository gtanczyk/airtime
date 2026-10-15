import test from 'node:test';import assert from 'node:assert/strict';
import {createRound,TAU,resolveLanding} from '../../../src/game/model.ts';
import {createShow,judgeShow,dareRewardFor} from '../../../src/game/show.ts';
import {stepFlight} from '../../../src/game/flight.ts';
import {guideBox,cameraAltitude,stagePoint} from '../../../src/game/coaching.ts';
const clean=(spins=1,variety=1,releaseAir=2)=>({grade:'perfect',spins,variety,points:100,err:.1,releaseAir});
function finale(){const s=createShow();s.mission=6;s.dare=0;return s;}
test('crowd calls reward a clean Tuck double once and advance to a different decision',()=>{
 const s=finale();judgeShow(s,clean(2,2),3);assert.equal(s.dare,0);assert.equal(s.dareFlights,2);
 const reward=judgeShow(s,clean(2),1);assert.equal(reward.bonus,2000);assert.equal(s.daresWon,1);assert.equal(s.dare,1);assert.equal(s.dareFlights,3);
 judgeShow(s,clean(2),1);assert.equal(s.daresWon,1);assert.equal(s.dareReward,0);
});
test('ignoring a call expires after three flights without taking earned points or cancelling combo',()=>{
 const r=createRound();r.show=finale();r.combo=10;r.score=10000;
 for(let i=0;i<3;i++){r.rot=TAU;r.spinTotal=TAU;r.radBy=[TAU,0,0,0];r.shapeMask=1;resolveLanding(r);}
 assert.equal(r.show.dare,1);assert.equal(r.show.dareExpired,true);assert.equal(r.show.daresWon,0);assert.equal(r.combo,13);assert.ok(r.score>10000);
});
test('late release bonus requires a perfect landing and an actual release in the final 0.4 seconds',()=>{
 const s=finale();s.dare=3;
 judgeShow(s,clean(1,1,.41),1);assert.equal(s.daresWon,0);
 const reward=judgeShow(s,clean(1,1,.35),1);assert.equal(reward.bonus,2000);assert.equal(s.dare,0);assert.equal(s.daresWon,1);
 const bad=finale();bad.dare=3;judgeShow(bad,{...clean(1,1,.3),grade:'wobble'},1);assert.equal(bad.daresWon,0);
});
test('optional rewards have a bounded tier and do not compound with Encore',()=>{
 const s=finale();s.daresWon=100;s.encore=4;const reward=judgeShow(s,clean(2),1);
 assert.equal(reward.bonus,3500);assert.equal(reward.multiplier,1.5);assert.equal(dareRewardFor(s),1750);
});
test('release timing and shape-learning are recorded from the actual hold/release input',()=>{
 const r=createRound();r.saltos=2;r.alt=160;r.vy=-300;stepFlight(r,true,.01);stepFlight(r,false,.05);
 assert.ok(r.releaseAir>0&&r.releaseAir<.4);for(let i=0;i<2;i++)stepFlight(r,false,.05);stepFlight(r,true,.03);assert.equal(r.learnedShapes,true);
});
test('coaching cluster stays inside the playfield and clear of the athlete in desktop and portrait',()=>{
 for(const [w,h] of [[640,400],[480,640]])for(let alt=0;alt<534;alt+=20){
  const r=createRound();r.alt=alt;r.camAlt=cameraAltitude(r,h);
  const b=guideBox(r,w,h);assert.ok(b.x>=0&&b.x+b.w<=w);assert.ok(b.y>=44&&b.y+b.h+32<=h);
  if(h>w)assert.ok(b.y>=224||b.y<stagePoint(r,h,alt));
 }
});
test('guided practice stops upright and waits for release without advancing physics',()=>{
 const r=createRound();for(let i=0;i<80;i++)stepFlight(r,true,1/60);
 assert.equal(r.practiceLocked,true);assert.equal(r.rot,TAU);const alt=r.alt;
 for(let i=0;i<60;i++)stepFlight(r,true,1/60);assert.equal(r.alt,alt);
 for(let i=0;i<100&&r.jumps===0;i++)stepFlight(r,false,1/60);
 assert.equal(r.grade,'perfect');assert.equal(r.practice,false);assert.equal(r.score,210);assert.equal(r.show.safety,false);
});
test('a beginner can retry an unsafe partial turn without ending or spending rescue',()=>{
 const r=createRound();for(let i=0;i<21;i++)stepFlight(r,true,1/60);
 for(let i=0;i<80&&r.jumps===0;i++)stepFlight(r,false,1/60);
 assert.equal(r.grade,'retry');assert.equal(r.started,false);assert.equal(r.practice,true);assert.equal(r.practiceTries,1);assert.equal(r.score,0);assert.equal(r.show.saves,0);
});
test('failure advice distinguishes incomplete, early, late and still-held landings',()=>{
 for(const [rot,holding,hint] of [[Math.PI,false,'unfinished'],[TAU-1.4,false,'unfinished'],[TAU+1.4,false,'late'],[TAU+1.4,true,'holding'],[TAU-.9,false,'early']]){
  const r=createRound(false);r.rot=rot;r.spinTotal=rot;r.radBy=[rot,0,0,0];r.shapeMask=1;r.holding=holding;resolveLanding(r);assert.equal(r.failureHint,hint);
 }
});
