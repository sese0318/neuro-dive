export type DivePhase='ready'|'playing'|'paused'|'complete';
export type DiveStage='input'|'axon'|'synapse';
export type MoveInput={forward:number;strafe:number;jump:boolean;sprint:boolean};
export const INPUTS=[{id:'input-1',x:-3,z:9},{id:'input-2',x:3,z:4},{id:'input-3',x:-2,z:-2}];
export const NODES=[-20,-35,-50];
export const RECEPTORS=[{shape:'丸',x:-4,z:-86,sides:32},{shape:'三角',x:0,z:-86,sides:3},{shape:'六角',x:4,z:-86,sides:6}];
export const MEMORY=[{id:'memory-1',x:7,z:4,name:'樹状突起',text:'枝分かれした樹状突起は、主に他の神経細胞から入力を受け取る。'},{id:'memory-2',x:3.3,z:-37,name:'髄鞘',text:'髄鞘は軸索を包む絶縁性の構造。活動電位はランビエ絞輪で再生され、速く伝わる。'},{id:'memory-3',x:-7,z:-78,name:'海馬',text:'海馬は新しい出来事の記憶づくりや、場所を覚えることに関わる。'}];
export class DiveState{
 phase:DivePhase='ready';stage:DiveStage='input';
 player={x:0,y:0,z:15,yaw:0,pitch:0};vy=0;
 collected=new Set<string>();memories=new Set<string>();nodes=0;calcium=false;released=false;
 receptor=2;elapsed=0;score=0;falls=0;wrong=0;cooldown=0;
 message='樹状突起の庭へようこそ。';messageTime=0;lastFact='';pulse=0;
 constructor(receptor=2){this.receptor=Math.max(0,Math.min(2,receptor));}
 start(){if(this.phase==='ready'){this.phase='playing';this.tell('光る入力を3つ集めよう。近づいて E で取り込める。');}}
 pause(){if(this.phase==='playing')this.phase='paused';}
 resume(){if(this.phase==='paused')this.phase='playing';}
 tell(text:string,fact=''){this.message=text;this.messageTime=7;if(fact)this.lastFact=fact;}
 potential(){return -70+this.collected.size*5;}
 target(){if(this.stage==='input'){const target=INPUTS.find(i=>!this.collected.has(i.id))!;return {...target,label:'入力 '+(this.collected.size+1),description:'光る入力を3つ取り込み、発火の閾値へ。'};}
 if(this.stage==='axon')return {x:0,z:NODES[Math.min(this.nodes,2)],id:'node-'+this.nodes,label:'ランビエ絞輪 '+(this.nodes+1),description:'次の絞輪に近づいて E。活動電位を再生しよう。'};
 if(!this.calcium)return {id:'calcium',x:-3,z:-64,label:'カルシウムチャネル',description:'終末でCa²⁺の流入を起こそう。'};
 if(!this.released)return {id:'release',x:0,z:-71,label:'シナプス小胞',description:'E で伝達物質を放出し、次の細胞へ。'};
 return {...RECEPTORS[this.receptor],id:'receptor',label:RECEPTORS[this.receptor].shape+'の受容体',description:RECEPTORS[this.receptor].shape+'の伝達物質を、同じ形の受容体へ届けよう。'};}
 ground(x:number,z:number){
 if(z>19||z< -96)return false;
 if(z>= -10)return Math.abs(x)<=10;
 if(z> -58)return Math.abs(x)<=5&&!((z< -27&&z> -28.4)||(z< -42&&z> -43.4));
 return Math.abs(x)<=10;
 }
 tick(dt:number,input:MoveInput){
  if(this.phase!=='playing')return;
  dt=Math.min(.05,Math.max(0,dt));this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.messageTime=Math.max(0,this.messageTime-dt);this.pulse=Math.max(0,this.pulse-dt);
  const length=Math.hypot(input.forward,input.strafe)||1;
  const speed=(input.sprint?7.8:5.2)*dt;
  const sx=(Math.cos(this.player.yaw)*input.strafe-Math.sin(this.player.yaw)*input.forward)/Math.max(1,length);
  const sz=(-Math.sin(this.player.yaw)*input.strafe-Math.cos(this.player.yaw)*input.forward)/Math.max(1,length);
  this.player.x=Math.max(-15,Math.min(15,this.player.x+sx*speed));
  let nextZ=Math.max(-95,Math.min(19,this.player.z+sz*speed));
  if(this.stage==='input'&&nextZ< -9)nextZ=-9;
  if(this.stage==='axon'&&nextZ< -57)nextZ=-57;
  if(this.stage==='synapse'&&!this.released&&nextZ< -73)nextZ=-73;
  this.player.z=nextZ;
  const onGround=this.ground(this.player.x,this.player.z);
  if(input.jump&&this.player.y===0&&onGround)this.vy=6.1;
  const previousY=this.player.y;this.vy-=15*dt;this.player.y+=this.vy*dt;
  if(onGround&&previousY>=0&&this.player.y<=0&&this.vy<=0){this.player.y=0;this.vy=0;}
  if(this.player.y< -8)this.respawn();
 }
 respawn(){
  this.falls++;this.score=Math.max(0,this.score-25);
  this.player={x:0,y:0,z:this.stage==='input'?15:this.stage==='axon'?(this.nodes===0?-12:NODES[this.nodes-1]-2):-60,yaw:0,pitch:0};this.vy=0;
  this.tell('チェックポイントから再開。Spaceで切れ目を飛び越えよう。');
 }
 nearby(){
  const {x,z}=this.player;
  const near=(a:{x:number;z:number})=>Math.hypot(x-a.x,z-a.z)<2.4;
  if(this.player.y>2.6||this.player.y<-.2)return null;
  const memory=MEMORY.find(m=>!this.memories.has(m.id)&&near(m));if(memory)return {id:memory.id,label:'記憶カプセルを読む',kind:'memory'};
  if(this.stage==='input'){const a=INPUTS.find(a=>!this.collected.has(a.id)&&near(a));if(a)return {id:a.id,label:'入力を取り込む',kind:'input'};}
  if(this.stage==='axon'&&near({x:0,z:NODES[this.nodes]}))return {id:'node-'+this.nodes,label:'活動電位を再生',kind:'node'};
  if(this.stage==='synapse'){
   if(!this.calcium&&near({x:-3,z:-64}))return {id:'calcium',label:'Ca²⁺を流入させる',kind:'calcium'};
   if(this.calcium&&!this.released&&near({x:0,z:-71}))return {id:'release',label:'神経伝達物質を放出',kind:'release'};
   if(this.released){const closest=RECEPTORS.map((r,i)=>({r,i,distance:Math.hypot(x-r.x,z-r.z)})).filter(c=>c.distance<2.4).sort((a,b)=>a.distance-b.distance)[0];if(closest)return {id:'receptor-'+closest.i,label:closest.r.shape+'の受容体に接続',kind:'receptor'};}
  }
  return null;
 }
 interact(){
  if(this.phase!=='playing')return false;
  const item=this.nearby();
  if(!item){this.tell('対象にもう少し近づこう。');return false;}
  if(item.kind==='memory'){const m=MEMORY.find(m=>m.id===item.id)!;this.memories.add(m.id);this.score+=50;this.tell(m.name+'。'+m.text+' +50 XP',m.text);return true;}
  if(item.kind==='input'){
   this.collected.add(item.id);this.score+=100;this.pulse=.8;
   this.tell('入力を受け取った。膜電位 '+this.potential()+' mV');
   if(this.collected.size===3){this.stage='axon';this.score+=100;this.cooldown=1.2;this.pulse=1.8;this.tell('閾値に到達。発火して軸索の扉が開いた！','入力の統合で閾値を超えると活動電位が生じる。発火は全か無かで、入力に比例して大きくなるわけではない。');}
   return true;
  }
  if(item.kind==='node'){
   if(this.cooldown>0){this.tell('不応期。すぐには再発火できない。');return false;}
   this.nodes++;this.score+=150;this.cooldown=1.2;this.pulse=1.8;
   this.tell('絞輪 '+this.nodes+' を接続。活動電位が再生された。','髄鞘の間にあるランビエ絞輪で活動電位が再生される。この伝わり方を跳躍伝導と呼ぶ。');
   if(this.nodes===3){this.stage='synapse';this.tell('軸索終末に到着。次は化学物質で橋渡ししよう。','典型的な化学シナプスでは、細胞内の電気的な信号から、細胞間を渡る化学物質へ情報を受け渡す。');}
   return true;
  }
  if(item.kind==='calcium'){this.calcium=true;this.score+=100;this.tell('Ca²⁺が流入。小胞から伝達物質を放出できる。','活動電位の到着に伴うカルシウム流入が、小胞と膜の融合を引き起こす。');return true;}
  if(item.kind==='release'){this.released=true;this.score+=100;this.pulse=1.5;this.tell('伝達物質を放出。'+RECEPTORS[this.receptor].shape+'の受容体へ届けよう。','神経伝達物質は細胞間のすき間を拡散して受容体に結びつく。歩ける橋は観察用の演出で、実際のシナプスに通路はない。');return true;}
  if(item.kind==='receptor'){
   if(item.id!=='receptor-'+this.receptor){this.wrong++;this.tell('この受容体とは結びつかない。'+RECEPTORS[this.receptor].shape+'の形を探そう。');return false;}
   this.score+=250;this.phase='complete';this.tell('接続完了。ひとつの信号が、次の細胞に届いた。','伝達物質と受容体の組み合わせにより、次の細胞は発火しやすくも、しにくくもなる。受け取ったから必ず発火するわけではない。');return true;
  }
  return false;
 }
 snapshot(){
  const target=this.phase==='complete'?{x:0,z:-90,id:'complete',label:'接続完了',description:'信号の旅をクリア。'}:this.target();
  return {phase:this.phase,stage:this.stage,player:{...this.player},inputs:this.collected.size,nodes:this.nodes,calcium:this.calcium,released:this.released,receptor:RECEPTORS[this.receptor].shape,memories:this.memories.size,elapsed:this.elapsed,score:this.score,falls:this.falls,wrong:this.wrong,potential:this.potential(),cooldown:this.cooldown,message:this.messageTime>0?this.message:'',fact:this.lastFact,target,distance:Math.hypot(this.player.x-target.x,this.player.z-target.z),nearby:this.nearby()};
 }
}
export type DiveSnapshot=ReturnType<DiveState['snapshot']>;
