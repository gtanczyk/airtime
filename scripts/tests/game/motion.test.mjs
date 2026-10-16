import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound,resolveLanding,TAU,BOUNCE_TIME} from '../../../src/game/model.ts';
import {stepFlight,timeToLand} from '../../../src/game/flight.ts';
import {animatePose,acrobatPixels} from '../../../src/game/poses.ts';
function landed(){const r=createRound(false);r.rot=TAU;r.spinTotal=TAU;r.radBy=[TAU,0,0,0];r.shapeMask=1;resolveLanding(r);return r;}
test('spring compresses without rotating and held input starts the next flight at both frame rates',()=>{
 for(const fps of [30,60]){const r=landed();const score=r.score;assert.equal(r.bounceRemaining,BOUNCE_TIME);assert.ok(timeToLand(r)>2*r.power/900);
 for(let i=0;i<fps*BOUNCE_TIME-1;i++){stepFlight(r,true,1/fps);animatePose(r,1/fps);assert.equal(r.alt,0);assert.equal(r.rot,0);assert.equal(r.score,score);assert.equal(r.poseTo,'landing');}
 for(let i=0;i<3;i++){stepFlight(r,true,1/fps);animatePose(r,1/fps)}assert.equal(r.bounceRemaining,0);assert.ok(r.alt>0);assert.equal(r.grabs,1);assert.equal(r.shapeIndex,0);assert.equal(r.flex,0);}
});
test('sub-frame spring release spends only the remaining frame time in flight',()=>{
 const r=landed();r.bounceRemaining=.01;stepFlight(r,true,.03);assert.ok(Math.abs(r.rot-7.5*r.speedScale*.02)<1e-9);assert.ok(r.alt>0);assert.equal(r.grabs,1);
});
test('pose animation changes neither landing angle nor points and settles after release',()=>{
 const r=createRound(false);r.spinning=true;r.rot=1;r.score=500;animatePose(r,.02);assert.equal(r.poseTo,'tuck');assert.equal(r.poseFrom,null);
 r.spinning=false;animatePose(r,.02);assert.equal(r.poseTo,null);assert.equal(r.poseFrom,'tuck');animatePose(r,.2);assert.equal(r.rot,1);assert.equal(r.score,500);
 assert.deepEqual(acrobatPixels(null,0,'tuck',6),acrobatPixels(null,0));
});
test('transition frames remain pixel aligned and differ from both end poses',()=>{
 const mid=acrobatPixels('pike',5,'tuck',3);assert.notDeepEqual(mid,acrobatPixels('tuck',5));assert.notDeepEqual(mid,acrobatPixels('pike',5));
 for(const p of mid)assert.ok(Number.isInteger(p.x/2)&&Number.isInteger(p.y/2)&&Number.isInteger(p.w/2));
});
test('safe descent prepares the knees before contact while the impact retains its original tilt',()=>{
 const r=createRound(false);r.alt=15;r.vy=-500;r.rot=TAU+.18;r.spinTotal=r.rot;r.radBy=[r.rot,0,0,0];r.shapeMask=1;
 animatePose(r,.02);assert.equal(r.poseTo,'landing');assert.equal(r.bounceRemaining,0);assert.equal(r.rot,TAU+.18);
 resolveLanding(r);assert.ok(Math.abs(r.landingTilt-.18)<1e-9);assert.equal(r.rot,0);assert.equal(r.bounceRemaining,BOUNCE_TIME);
});
