import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DiveState,INPUTS,NODES,RECEPTORS,MEMORY} from '../lib/dive-state.ts';
import {LESSONS} from '../lib/dive-learning.ts';
const idle={forward:0,strafe:0,jump:false,sprint:false};
test('intro explains role before movement and cannot be bypassed with resume or interact',()=>{
 const g=new DiveState();g.start();assert.equal(g.lesson,'intro');
 const before=g.snapshot();g.resume();g.pause();g.tick(.05,{...idle,forward:1,jump:true});
 assert.equal(g.phase,'learning');assert.deepEqual(g.player,before.player);assert.equal(g.elapsed,0);assert.equal(g.interact(),false);
 assert.equal(g.answerLesson(0),false);assert.equal(g.continueLesson(),true);assert.equal(g.phase,'playing');
});
test('check requires understanding, gives specific feedback, and blocks duplicate scoring',()=>{
 const g=new DiveState();begin(g);for(const p of INPUTS){position(g,p);g.interact();}
 assert.equal(g.lesson,'threshold');assert.equal(g.continueLesson(),false);const score=g.score;
 assert.equal(g.answerLesson(1),true);assert.equal(g.continueLesson(),false);assert.match(LESSONS.threshold.choices[g.answer].feedback,/3個はこのゲーム/);
 assert.equal(g.answerLesson(9),false);assert.equal(g.answerLesson(NaN),false);g.resume();assert.equal(g.interact(),false);
 const elapsed=g.elapsed;walk(g,3,{forward:1});assert.equal(g.elapsed,elapsed);
 assert.equal(g.answerLesson(0),true);assert.equal(g.answerLesson(0),false);assert.equal(g.score,score);assert.equal(g.attempts,2);
 assert.equal(g.continueLesson(),true);assert.equal(g.lesson,'axon');assert.equal(g.continueLesson(),true);assert.equal(g.continueLesson(),false);
 assert.equal(g.phase,'playing');assert.deepEqual(g.snapshot().mastered,['threshold']);
});
test('input observation persists beyond toast and distinguishes voltage change from firing',()=>{
 const g=new DiveState();begin(g);position(g,INPUTS[0]);g.interact();walk(g,8);
 const v=g.snapshot();assert.equal(v.message,'');assert.equal(v.observation.before,'-70 mV');assert.equal(v.observation.after,'-65 mV');assert.match(v.observation.why,/生まれていない/);
});
test('new run resets mastery and heading-relative directions point at the visible target',()=>{
 const g=new DiveState();begin(g);assert.ok(g.snapshot().bearing<0);g.player.yaw=Math.PI/2;assert.ok(g.snapshot().bearing>0);
 const fresh=new DiveState();assert.deepEqual(fresh.snapshot().mastered,[]);assert.equal(fresh.attempts,0);assert.equal(fresh.phase,'ready');
});
function walk(game,seconds,extra={}){for(let i=0;i<Math.ceil(seconds*60);i++)game.tick(1/60,{...idle,...extra});}
function position(game,p){game.player.x=p.x;game.player.z=p.z;game.player.y=0;game.vy=0;}
function begin(game){game.start();assert.equal(game.continueLesson(),true);}
function pass(game,choice){assert.equal(game.answerLesson(choice),true);assert.equal(game.continueLesson(),true);if(game.phase==='learning')assert.equal(game.continueLesson(),true);}
function openAxon(game){begin(game);for(const p of INPUTS){position(game,p);assert.equal(game.interact(),true);}pass(game,0);}
function openSynapse(game){openAxon(game);walk(game,1.3);for(const z of NODES){position(game,{x:0,z});assert.equal(game.interact(),true);walk(game,1.3);}pass(game,1);}
test('threshold gate needs all inputs and repeated interaction gives no extra points',()=>{const g=new DiveState();begin(g);position(g,{x:0,z:-8});walk(g,1,{forward:1});assert.equal(g.player.z,-9);for(const p of INPUTS){position(g,p);g.interact();const score=g.score;g.interact();assert.equal(g.score,score);}assert.equal(g.potential(),-55);assert.equal(g.stage,'axon');assert.equal(g.score,400);});
test('nodes are ordered and refractory period prevents immediate reactivation',()=>{const g=new DiveState();openAxon(g);position(g,{x:0,z:NODES[1]});assert.equal(g.interact(),false);position(g,{x:0,z:NODES[0]});assert.equal(g.interact(),false);walk(g,1.3);assert.equal(g.interact(),true);position(g,{x:0,z:NODES[1]});assert.equal(g.interact(),false);walk(g,1.3);assert.equal(g.interact(),true);});
test('walking into gap falls and returns to current checkpoint without losing learned inputs',()=>{const g=new DiveState();openAxon(g);walk(g,1.3);position(g,{x:0,z:NODES[0]});g.interact();position(g,{x:0,z:-26});walk(g,2,{forward:1});assert.equal(g.falls,1);assert.equal(g.collected.size,3);assert.equal(g.nodes,1);assert.equal(g.stage,'axon');assert.ok(g.player.z>-27);});
test('jump can cross gap without fall and land on platform',()=>{const g=new DiveState();openAxon(g);position(g,{x:0,z:-25.8});g.tick(1/60,{...idle,jump:true,forward:1});walk(g,.7,{forward:1});walk(g,.4);assert.equal(g.falls,0);assert.ok(g.player.z< -28.4);assert.equal(g.player.y,0);});
test('pause freezes movement, time, and interaction',()=>{const g=new DiveState();begin(g);position(g,INPUTS[0]);g.pause();const before={...g.player};walk(g,4,{forward:1});assert.deepEqual(g.player,before);assert.equal(g.elapsed,0);assert.equal(g.interact(),false);});
test('chemical transmission requires calcium, release and matching receptor',()=>{const g=new DiveState(2);openSynapse(g);position(g,{x:0,z:-71});assert.equal(g.interact(),false);position(g,{x:-3,z:-64});g.interact();position(g,{x:0,z:-71});g.interact();assert.equal(g.released,true);position(g,RECEPTORS[0]);g.interact();assert.equal(g.phase,'playing');assert.equal(g.wrong,1);position(g,RECEPTORS[2]);g.interact();assert.equal(g.phase,'learning');pass(g,2);assert.equal(g.phase,'complete');const score=g.score;assert.equal(g.interact(),false);assert.equal(g.score,score);assert.equal(g.score,1300);});

test('interactions cannot reach up through the floor while falling',()=>{const g=new DiveState();begin(g);position(g,INPUTS[0]);g.player.y=-1;assert.equal(g.nearby(),null);assert.equal(g.interact(),false);assert.equal(g.score,0);});
test('overlapping receptor ranges select the nearest receptor',()=>{const g=new DiveState(2);openSynapse(g);position(g,{x:-3,z:-64});g.interact();position(g,{x:0,z:-71});g.interact();position(g,{x:2.3,z:-86});assert.equal(g.nearby().id,'receptor-2');g.interact();assert.equal(g.phase,'learning');pass(g,2);assert.equal(g.phase,'complete');});
test('memory capsule explains the concept visibly and cannot be scored twice',()=>{const g=new DiveState();begin(g);position(g,MEMORY[0]);assert.equal(g.interact(),true);assert.ok(g.snapshot().message.includes(MEMORY[0].text));assert.equal(g.score,50);assert.equal(g.interact(),false);assert.equal(g.score,50);});
