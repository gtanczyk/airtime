import test from 'node:test';
import assert from 'node:assert/strict';
import {acrobatPixels} from '../../../src/game/poses.ts';
test('every pose and rotation stays on a bounded two-pixel sprite grid',()=>{
 for(const shape of [null,'tuck','pike','straddle','layout'])for(let frame=0;frame<64;frame++){
  const pixels=acrobatPixels(shape,frame);assert.ok(pixels.length>25&&pixels.length<500);
  for(const p of pixels){assert.ok(Number.isInteger(p.x/2)&&Number.isInteger(p.y/2)&&Number.isInteger(p.w/2));assert.ok(p.w>0);assert.ok(Math.abs(p.x)<=50&&Math.abs(p.y)<=50);assert.match(p.color,/^#[0-9a-f]{6}$/i);}
 }
});
test('pixel poses remain distinct and cached rotation frames wrap without affecting physics',()=>{
 const shapes=['tuck','pike','straddle','layout'].map(s=>JSON.stringify(acrobatPixels(s,0)));
 assert.equal(new Set(shapes).size,4);assert.strictEqual(acrobatPixels('tuck',0),acrobatPixels('tuck',64));assert.strictEqual(acrobatPixels('tuck',63),acrobatPixels('tuck',-1));assert.notDeepEqual(acrobatPixels('tuck',0),acrobatPixels('tuck',16));
});
