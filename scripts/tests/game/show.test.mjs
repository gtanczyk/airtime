import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound,resolveLanding,TAU,MIN_POWER} from '../../../src/game/model.ts';
import {createShow,judgeShow,MISSIONS,ENCORE_LANDINGS,ENCORE_MULTIPLIER} from '../../../src/game/show.ts';
const result=(grade='perfect',spins=1,variety=1)=>({grade,spins,variety,points:100,err:grade==='perfect'?0.1:1});
function land(r,rot=TAU,mask=1) {
 r.rot=rot;r.spinTotal=rot;r.shapeMask=mask;r.radBy=[rot,0,0,0];return resolveLanding(r);
}
test('three consecutive perfects award one mission bonus and a single rescue',()=>{
 const r=createRound();land(r);land(r);
 const first=land(r);assert.equal(r.show.mission,1);assert.equal(r.show.safety,true);assert.equal(r.show.lastBonus,250);
 assert.ok(first.points>250);const next=land(r);assert.equal(r.show.lastBonus,0);assert.equal(r.show.mission,1);assert.ok(next.points>0);
});
test('clean and wobble break the perfect streak, and unsafe tricks never earn mission bonuses',()=>{
 const s=createShow();judgeShow(s,result(),1);judgeShow(s,result(),1);judgeShow(s,result('clean'),1);
 assert.equal(s.missionProgress,0);judgeShow(s,result(),1);judgeShow(s,result('wobble',2,4),15);
 assert.equal(s.mission,0);assert.equal(s.missionProgress,0);assert.equal(s.safety,false);
});
test('rescue consumes one earned token, breaks combo and reduces bounce power; the next crash ends the show',()=>{
 const r=createRound();land(r);land(r);land(r);r.power=900;
 assert.equal(land(r,Math.PI).grade,'save');assert.equal(r.show.safety,false);assert.equal(r.show.saves,1);
 assert.equal(r.combo,0);assert.equal(r.gradePoints,0);assert.equal(r.power,648);
 assert.equal(land(r,Math.PI).grade,'crash');assert.equal(r.show.saves,1);assert.ok(r.power>=MIN_POWER);
});
test('Encore activates at full applause and boosts exactly the next four clean landings',()=>{
 const s=createShow();s.heat=99;
 assert.equal(judgeShow(s,result(),1).multiplier,1);assert.equal(s.encore,ENCORE_LANDINGS);assert.equal(s.encoreStarted,true);
 for(let i=0;i<ENCORE_LANDINGS;i++)assert.equal(judgeShow(s,result(),1).multiplier,ENCORE_MULTIPLIER);
 assert.equal(s.encore,0);assert.equal(s.encoreLandings,4);assert.equal(s.heat,0);
 assert.equal(judgeShow(s,result(),1).multiplier,1);
});
test('a poor landing cancels Encore and cannot bank boosted points',()=>{
 const s=createShow();s.encore=4;s.heat=70;
 const reward=judgeShow(s,result('wobble',2,4),15);assert.equal(reward.multiplier,1);assert.equal(s.encore,0);assert.equal(s.heat,40);
});
test('missions require actual double flips, multiple shapes, Layout and perfect Encore landings',()=>{
 const s=createShow();for(let i=0;i<3;i++)judgeShow(s,result(),1);
 judgeShow(s,result('wobble',1,2),3);assert.equal(s.mission,1);
 assert.equal(judgeShow(s,result('clean',1,2),3).bonus,MISSIONS[1].reward);
 judgeShow(s,result('perfect',1,4),15);assert.equal(s.mission,2);
 assert.equal(judgeShow(s,result('clean',2,1),1).bonus,MISSIONS[2].reward);
 assert.equal(judgeShow(s,result('perfect',1,3),7).bonus,MISSIONS[3].reward);
 judgeShow(s,result('perfect',1,4),7);assert.equal(s.mission,4);
 assert.equal(judgeShow(s,result('perfect',1,4),15).bonus,MISSIONS[4].reward);
 s.encore=4;judgeShow(s,result(),1);judgeShow(s,result(),1);
 assert.equal(judgeShow(s,result(),1).bonus,MISSIONS[5].reward);assert.equal(s.mission,MISSIONS.length);
 for(let i=0;i<12;i++){judgeShow(s,result('perfect',2,4),15);assert.equal(s.mission,MISSIONS.length);assert.equal(s.lastBonus,0);}
});
test('new shows reset all bonuses, missions and rescue state',()=>{
 const r=createRound();land(r);land(r);land(r);const fresh=createRound();
 assert.equal(fresh.show.safety,false);assert.equal(fresh.show.mission,0);assert.equal(fresh.show.encore,0);assert.equal(fresh.score,0);
});
