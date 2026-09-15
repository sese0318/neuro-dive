import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DiveState, INPUTS, NODES, RECEPTORS, MEMORY, type DiveSnapshot } from './dive-state';

export class DiveEngine {
 model=new DiveState(Math.floor(Math.random()*3));
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(72,1,.08,90);
 renderer:THREE.WebGLRenderer;
 clock=new THREE.Clock();keys=new Set<string>();disposed=false;raf=0;tickCount=0;
 abort=new AbortController();resize:ResizeObserver;
 objects=new Map<string,THREE.Object3D>();animated:THREE.Object3D[]=[];
 brains:THREE.Group[]=[];brainLoaded=false;
 guideMarker:THREE.Sprite|null=null;signalWave:THREE.Mesh|null=null;signalParticles:THREE.Mesh[]=[];
 drag:{x:number;y:number}|null=null;
 command:{forward:number;strafe:number;jump:boolean;end:number;resolve:(state:DiveSnapshot)=>void}|null=null;
 audio:AudioContext|null=null;sound=false;lastScore=0;lastStage='input';light:THREE.PointLight;
 constructor(public host:HTMLElement,public onState:(s:DiveSnapshot)=>void,public onError:(s:string)=>void,public onModel:(ok:boolean)=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  this.renderer.setSize(host.clientWidth,host.clientHeight);
  this.renderer.setClearColor(0x06151b);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(this.renderer.domElement);this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label','脳内を探索する一人称3D画面');
  this.scene.background=new THREE.Color(0x06151b);this.scene.fog=new THREE.FogExp2(0x0c242b,.017);
  this.scene.add(new THREE.HemisphereLight(0xa0efef,0x071426,2));
  const sun=new THREE.DirectionalLight(0xe1f9dd,2.8);sun.position.set(-12,24,14);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.normalBias=.03;this.scene.add(sun);
  this.light=new THREE.PointLight(0x81ffee,4,24,1.5);this.scene.add(this.light);
  this.buildWorld();this.bind();
  this.resize=new ResizeObserver(()=>{if(this.disposed)return;const w=host.clientWidth,h=host.clientHeight;this.camera.aspect=w/Math.max(h,1);this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);});this.resize.observe(host);
  void this.loadBrain();this.frame();
 }
 material(color:number,emissive=0,metal=.25){return new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:emissive?1:0,roughness:.55,metalness:metal});}
 mesh(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.receiveShadow=true;this.scene.add(m);return m;}
 tube(points:THREE.Vector3[],radius:number,color:number){
  const curve=new THREE.CatmullRomCurve3(points);
  return this.mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*5),radius,6,false),this.material(color,color,.1));
 }
 label(text:string,color='#b3eee0',width=4){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='rgba(6,24,29,.88)';ctx.fillRect(0,0,768,128);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(4,4,760,120);ctx.fillStyle=color;ctx.font='500 40px "Noto Sans JP","Yu Gothic UI",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.scale.set(width,width/6,1);return sprite;
 }
 ring(x:number,y:number,z:number,radius:number,color:number,tilt=0){
  const m=this.mesh(new THREE.TorusGeometry(radius,.045,8,64),new THREE.MeshBasicMaterial({color}),x,y,z);m.rotation.x=tilt;return m;
 }
 platform(x:number,z:number,w:number,d:number){
  this.mesh(new THREE.BoxGeometry(w,.65,d),this.material(0x233e43,0, .65),x,-.36,z);
  this.mesh(new THREE.BoxGeometry(w,.045,d),this.material(0x3c5c60,0,.5),x,0,z);
  const line=new THREE.MeshBasicMaterial({color:0x6dd6cc});
  for(const side of [-1,1])this.mesh(new THREE.BoxGeometry(.065,.035,d),line,x+side*(w/2-.25),.04,z);
 }
 neuron(x:number,y:number,z:number,scale=1,color=0x42797c){
  const group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(scale);this.scene.add(group);
  const material=this.material(color,0x123a40,.15);
  const body=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,2),material);body.scale.set(1,1.2,.9);group.add(body);
  const nucleus=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),this.material(0x7ddfd1,0x23585c));nucleus.position.z=.85;group.add(nucleus);
  for(let j=0;j<7;j++){
   const a=j*Math.PI*2/7;
   const begin=new THREE.Vector3(Math.cos(a),Math.sin(a),0);
   const mid=new THREE.Vector3(Math.cos(a)*2.6,Math.sin(a)*2.6,Math.sin(j)*.5);
   const end=new THREE.Vector3(Math.cos(a)*4,Math.sin(a)*4,Math.cos(j)*.8);
   const curve=new THREE.CatmullRomCurve3([begin,mid,end]);
   group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.15,6,false),material));
   for(const sign of [-1,1]){
    const ea=a+sign*.34;const tip=new THREE.Vector3(end.x+Math.cos(ea)*1.8,end.y+Math.sin(ea)*1.8,end.z+sign*.4);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([mid,end,tip]),10,.07,5,false),material));
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.11,6,4),new THREE.MeshBasicMaterial({color:0x8ee8d2}));glow.position.copy(tip);group.add(glow);
   }
  }
  return group;
 }
 item(id:string,x:number,z:number,color:number,shape='crystal',label=''){
  const group=new THREE.Group();group.position.set(x,0,z);this.scene.add(group);this.objects.set(id,group);
  const stand=new THREE.Mesh(new THREE.CylinderGeometry(.68,.88,.25,6),this.material(0x1e3841,0,.7));stand.position.y=.13;group.add(stand);
  const geom=shape==='sphere'?new THREE.SphereGeometry(.43,20,14):shape==='cube'?new THREE.BoxGeometry(.57,.57,.57):new THREE.OctahedronGeometry(.53);
  const gem=new THREE.Mesh(geom,this.material(color,color,.5));gem.position.y=1.22;group.add(gem);gem.userData.spin=true;this.animated.push(gem);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.025,6,40),new THREE.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.25;group.add(ring);
  const light=new THREE.PointLight(color,2,5);light.position.y=1.1;group.add(light);
  if(label){const text=this.label(label,'#c4f7e2',2.6);text.position.set(0,2.45,0);group.add(text);}
  return group;
 }
 buildWorld(){
  this.platform(0,4.5,20,29);
  this.platform(0,-18.5,10,17);this.platform(0,-35.2,10,13.6);this.platform(0,-50.7,10,14.6);
  this.platform(0,-76.5,20,37);
  const seamMat=new THREE.MeshBasicMaterial({color:0x28494d});
  for(let z=17;z> -94;z-=2.5){if(!this.model.ground(0,z))continue;this.mesh(new THREE.BoxGeometry(z> -10||z< -58?19.4:9.4,.015,.03),seamMat,0,.035,z);}
  for(let z=13;z> -93;z-=4){if(!this.model.ground(0,z))continue;const arrow=new THREE.Shape();arrow.moveTo(-.23,.2);arrow.lineTo(0,-.18);arrow.lineTo(.23,.2);arrow.lineTo(0,.03);arrow.closePath();const a=this.mesh(new THREE.ShapeGeometry(arrow),new THREE.MeshBasicMaterial({color:0x92c8ba,side:THREE.DoubleSide}),0,.055,z);a.rotation.x=-Math.PI/2;}
  // Raised geometry, local light, and finite platforms make the traversable world readable.
  for(const [x,z] of [[-10,5],[-12,-14],[13,-28],[-13,-44],[12,-62],[-13,-82]]){
   this.neuron(x,5,z,1.1+(Math.abs(z)%4)*.1,0x3d777e);
  }
  for(const [x,z] of [[-20,-15],[20,-42],[-22,-65],[19,-85]])this.neuron(x,15,z,1.7,0x214856);
  for(const input of INPUTS)this.item(input.id,input.x,input.z,0xc8f383,'crystal','入力 +5 mV');
  for(const memory of MEMORY)this.item(memory.id,memory.x,memory.z,0xefb77e,'cube','記憶カプセル');
  for(const [index,z] of NODES.entries()){
   const ringGroup=new THREE.Group();ringGroup.position.z=z;this.scene.add(ringGroup);this.objects.set('arch-'+index,ringGroup);
   const arch=new THREE.Mesh(new THREE.TorusGeometry(4.5,.24,12,60,Math.PI),this.material(0xabc4bd,0x183539,.55));arch.position.y=.1;ringGroup.add(arch);
   const inner=new THREE.Mesh(new THREE.TorusGeometry(4.15,.045,6,60,Math.PI),new THREE.MeshBasicMaterial({color:0x87dccb}));inner.position.y=.1;ringGroup.add(inner);
   const label=this.label('RANVIER '+String(index+1).padStart(2,'0'),'#e1f9ca',4);label.position.set(0,5.1,0);ringGroup.add(label);
   this.item('node-'+index,0,z,0xd6f389,'sphere');
   for(let j=0;j<4;j++){
    const sleeve=new THREE.Mesh(new THREE.TorusGeometry(4.72,.38,8,36,Math.PI),this.material(0x35525c,0x07151e,.75));sleeve.position.set(0,.08,z-2.6-j*1.7);this.scene.add(sleeve);
   }
  }
  this.makeGate('input-gate',-10,0x99e5c4,'AXON · 発火で開く');
  this.makeGate('axon-gate',-58,0x9acbea,'SYNAPSE · 3つの絞輪を接続');
  this.makeGate('synapse-gate',-74,0xeebecf,'化学物質へバトンタッチ');
  for(const z of [-27,-28.4,-42,-43.4])this.mesh(new THREE.BoxGeometry(10,.08,.14),new THREE.MeshBasicMaterial({color:0xefb777}),0,.08,z);
  const gapSign1=this.label('SPACE · 切れ目をジャンプ','#ffd69f',3.8);gapSign1.position.set(2.5,1.35,-25);this.scene.add(gapSign1);
  const gapSign2=gapSign1.clone();gapSign2.position.z=-40;this.scene.add(gapSign2);
  this.item('calcium',-3,-64,0x94caf7,'crystal','Ca²⁺ チャネル');
  this.item('release',0,-71,0xecb5d2,'sphere','シナプス小胞');
  for(const [i,r] of RECEPTORS.entries()){
   const g=new THREE.Group();g.position.set(r.x,0,r.z);this.objects.set('receptor-'+i,g);this.scene.add(g);
   const base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.7,.4,8),this.material(0x28434b));base.position.y=.2;g.add(base);
   const rim=new THREE.Mesh(new THREE.RingGeometry(.7,1.05,r.sides),this.material(0xe8b7d0,0x743d6c,.4));rim.position.y=1.8;g.add(rim);
   const box=new THREE.Mesh(new THREE.BoxGeometry(.22,1.7,.22),this.material(0x426f74));box.position.set(0,.85,-.14);g.add(box);
   const t=this.label(r.shape+'の受容体','#ffd2e5',3);t.position.set(0,3.4,0);g.add(t);
  }
  const left= new THREE.Vector3(-10,7,-73),right=new THREE.Vector3(10,7,-73);
  for(const side of [left,right]){this.ring(side.x,side.y,side.z,5,0xac87ad);this.neuron(side.x,side.y,side.z,.6,0x8a668d);}
  const bridgeLabel=this.label('観察用ブリッジ · 実際のシナプスに通路はない','#dfbcd4',8);bridgeLabel.position.set(0,5.3,-77);this.scene.add(bridgeLabel);
  const positions=new Float32Array(450*3);for(let i=0;i<450;i++){positions[i*3]=Math.sin(i*127.1)*42;positions[i*3+1]=2+(Math.sin(i*311.7)+1)*14;positions[i*3+2]=20-(Math.cos(i*73.9)+1)*63;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xb2e8d8,size:.055,transparent:true,opacity:.6,depthWrite:false})));
  this.camera.position.set(0,1.65,15);
  this.guideMarker=this.label('▼ 次の観察ポイント','#e5ffb0',3.5);this.scene.add(this.guideMarker);
  this.signalWave=this.ring(0,1.4,-10,1.2,0xd5f3a3);
  const particleGeometry=new THREE.SphereGeometry(.09,8,6);
  const calciumMaterial=new THREE.MeshBasicMaterial({color:0x94caf7});
  const transmitterMaterial=new THREE.MeshBasicMaterial({color:0xffb9da});
  for(let i=0;i<24;i++){const particle=new THREE.Mesh(particleGeometry,i<12?calciumMaterial:transmitterMaterial);this.signalParticles.push(particle);this.scene.add(particle);}
 }
 makeGate(id:string,z:number,color:number,text:string){
  const gate=new THREE.Group();gate.position.z=z;this.scene.add(gate);this.objects.set(id,gate);
  const mat=this.material(0x174b51,0x123440,.55);
  for(const x of [-5,5]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.6,6,.6),mat);pillar.position.set(x,3,0);gate.add(pillar);}
  const beam=new THREE.Mesh(new THREE.BoxGeometry(10.6,.45,.6),mat);beam.position.y=6;gate.add(beam);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(9.5,5.7),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));panel.position.y=2.9;panel.name='barrier';gate.add(panel);
  for(let x=-4;x<=4;x+=1){const beam=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,5.7,5),new THREE.MeshBasicMaterial({color}));beam.position.set(x,2.9,0);beam.name='beam';gate.add(beam);}
  const label=this.label(text,'#b8e6e2',6);label.position.set(0,6.7,0);gate.add(label);
 }
 async loadBrain(){
  try{
   const gltf=await new GLTFLoader().loadAsync('/models/hra-brain.glb');
   if(this.disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});return;}
   gltf.scene.updateMatrixWorld(true);
   const geometries:THREE.BufferGeometry[]=[];
   gltf.scene.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
    for(const attribute of Object.keys(geometry.attributes))if(attribute!=='position'&&attribute!=='normal')geometry.deleteAttribute(attribute);
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    geometries.push(geometry.index?geometry.toNonIndexed():geometry);
   });
   const merged=mergeGeometries(geometries,false);
   for(const g of geometries)g.dispose();
   gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
   if(!merged)throw Error('Brain geometry missing');
   merged.computeBoundingBox();const box=merged.boundingBox!;const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());merged.translate(-center.x,-center.y,-center.z);merged.scale(1/Math.max(size.x,size.y,size.z),1/Math.max(size.x,size.y,size.z),1/Math.max(size.x,size.y,size.z));
   const material=new THREE.MeshStandardMaterial({color:0x80bdb3,emissive:0x163c3d,emissiveIntensity:.6,roughness:.52,metalness:.28});
   for(const [x,y,z,scale] of [[7.8,6.7,-1,8],[0,7,-96,10]]){
    const group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(scale);const mesh=new THREE.Mesh(merged,material);group.add(mesh);this.scene.add(group);this.brains.push(group);
    this.ring(x,y-4.2,z,4.6,0x4edac4,Math.PI/2);
    const label=this.label('HUMAN REFERENCE ATLAS','#c2f1dc',5.4);label.position.set(x,y+5.2,z);this.scene.add(label);
   }
   this.brainLoaded=true;this.onModel(true);
  }catch{if(!this.disposed)this.onModel(false);}
 }
 bind(){
  const signal=this.abort.signal,canvas=this.renderer.domElement;
  window.addEventListener('keydown',e=>{
   if((e.target as HTMLElement)?.matches('input,textarea,select'))return;
   if(this.model.phase!=='playing'||(e.code==='Space'&&(e.target as HTMLElement)?.closest('button,a,summary')))return;
   if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft'].includes(e.code)){if(this.model.phase==='playing')e.preventDefault();this.keys.add(e.code);}
   if(e.code==='KeyE'&&!e.repeat)this.model.interact();
   if(e.code==='Escape'&&this.model.phase==='playing')this.pause();
  },{signal});
  window.addEventListener('keyup',e=>this.keys.delete(e.code),{signal});
  window.addEventListener('blur',()=>this.pause(),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();},{signal});
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement){this.keys.clear();if(this.model.phase==='playing')this.pause();}},{signal});
  document.addEventListener('pointerlockerror',()=>{this.model.tell('マウスをドラッグして視点を動かせるよ。');},{signal});
  canvas.addEventListener('pointerdown',e=>{if(this.model.phase==='playing'&&!document.pointerLockElement){this.drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}},{signal});
  canvas.addEventListener('pointermove',e=>{
   if(this.model.phase!=='playing')return;
   let dx=0,dy=0;
   if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}
   else if(this.drag){dx=e.clientX-this.drag.x;dy=e.clientY-this.drag.y;this.drag={x:e.clientX,y:e.clientY};}
   else return;
   this.model.player.yaw-=dx*.0018;this.model.player.pitch=Math.max(-1.15,Math.min(1.15,this.model.player.pitch-dy*.0018));
  },{signal});
  const release=()=>{this.drag=null;};canvas.addEventListener('pointerup',release,{signal});canvas.addEventListener('pointercancel',release,{signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.pause();if(!this.disposed)this.onError('3D描画が中断された。再読み込みして再開できる。');},{signal});
 }
 start(){this.model.start();this.emit();}
 captureMouse(){
  if(this.model.phase!=='playing')return;
  const canvas=this.renderer.domElement;canvas.focus();
  try{const result=canvas.requestPointerLock?.();if(result&&typeof result.catch==='function')void result.catch(()=>this.model.tell('ドラッグで視点を動かせるよ。'));}
  catch{this.model.tell('ドラッグで視点を動かせるよ。');}
 }
 pause(){this.model.pause();this.keys.clear();this.drag=null;if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();this.emit();}
 resume(capture=false){this.keys.clear();this.model.resume();if(capture)this.captureMouse();this.emit();}
 interact(){const ok=this.model.interact();this.emit();return ok;}
 answerLesson(choice:number){const ok=this.model.answerLesson(choice);this.emit();return ok;}
 continueLesson(){this.keys.clear();const ok=this.model.continueLesson();if(this.model.phase==='playing')this.renderer.domElement.focus();this.emit();return ok;}
 jump(){if(this.model.phase==='playing')this.model.tick(.001,{forward:0,strafe:0,jump:true,sprint:false});this.emit();}
 turn(degrees:number){this.model.player.yaw+=degrees*Math.PI/180;this.emit();}
 step(direction:string){void this.move(direction,.23);}
 move(direction:string,seconds:number,jump=false){
  if(this.command)throw Error('A movement is already active');
  if(this.model.phase!=='playing')throw Error('Start or resume the game first');
  const movement:{[key:string]:[number,number]}={forward:[1,0],backward:[-1,0],left:[0,-1],right:[0,1]};
  if(!movement[direction]||!Number.isFinite(seconds)||seconds<.05||seconds>2||typeof jump!=='boolean')throw Error('Use forward, backward, left or right, with seconds from 0.05 to 2 and an optional boolean jump');
  const [forward,strafe]=movement[direction];
  return new Promise<DiveSnapshot>(resolve=>{this.command={forward,strafe,jump,end:performance.now()+seconds*1000,resolve};});
 }
 soundEffect(){
  if(!this.sound)return;
  try{const ctx=this.audio??new AudioContext();this.audio=ctx;void ctx.resume();const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(480,ctx.currentTime);oscillator.frequency.exponentialRampToValueAtTime(920,ctx.currentTime+.2);gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.35);}catch{}
 }
 emit(){this.onState(this.model.snapshot());}
 frame=()=>{
  if(this.disposed)return;
  this.raf=requestAnimationFrame(this.frame);
  const dt=Math.min(this.clock.getDelta(),.05),time=this.clock.elapsedTime;
  if(this.model.phase==='playing'){
   if(this.keys.has('ArrowLeft'))this.model.player.yaw+=dt*1.35;
   if(this.keys.has('ArrowRight'))this.model.player.yaw-=dt*1.35;
  }
  const forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+(this.command?.forward??0);
  const strafe=(this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0)+(this.command?.strafe??0);
  this.model.tick(dt,{forward,strafe,jump:this.keys.has('Space')||(this.command?.jump??false),sprint:this.keys.has('ShiftLeft')});
  if(this.command)this.command.jump=false;
  const p=this.model.player;
  this.camera.position.set(p.x,p.y+1.65,p.z);this.camera.rotation.set(p.pitch,p.yaw,0,'YXZ');
  this.light.position.set(p.x,p.y+2.7,p.z);
  for(const o of this.animated){o.rotation.y+=dt*.55;o.position.y=1.22+Math.sin(time*1.5+o.id)*.09;}
  for(const brain of this.brains)brain.rotation.y=Math.sin(time*.05)*.35;
  for(const a of INPUTS)this.objects.get(a.id)!.visible=!this.model.collected.has(a.id);
  for(const a of MEMORY)this.objects.get(a.id)!.visible=!this.model.memories.has(a.id);
  for(let i=0;i<3;i++){this.objects.get('node-'+i)!.visible=i>=this.model.nodes;const g=this.objects.get('arch-'+i)!;g.children[1].visible=i<this.model.nodes;}
  for(const [id,open] of [['input-gate',this.model.stage!=='input'],['axon-gate',this.model.stage==='synapse'],['synapse-gate',this.model.released]] as const){
   const gate=this.objects.get(id)!;for(const c of gate.children)if(c.name==='barrier'||c.name==='beam')c.visible=!open;
  }
  this.objects.get('calcium')!.visible=!this.model.calcium;this.objects.get('release')!.visible=!this.model.released;
  const target=this.model.target();
  this.guideMarker!.visible=this.model.phase==='playing';
  this.guideMarker!.position.set(target.x,3.7+Math.sin(time*2)*.12,target.z);
  this.signalWave!.visible=this.model.phase==='playing'&&this.model.stage==='axon'&&this.model.pulse>0;
  this.signalWave!.position.z=(this.model.nodes?NODES[this.model.nodes-1]:-10)-(1.8-this.model.pulse)*7;
  for(let i=0;i<this.signalParticles.length;i++){
   const particle=this.signalParticles[i],t=(time*.35+(i%12)/12)%1;
   particle.visible=this.model.phase==='playing'&&(i<12?this.model.calcium&&!this.model.released:this.model.released);
   if(i<12)particle.position.set(-3+3*t,1.3+Math.sin(t*Math.PI)*.6,-64-7*t);
   else particle.position.set(RECEPTORS[this.model.receptor].x*t+Math.sin(i*2+t*8)*.55,1.5+Math.sin(i+t*6)*.45,-71-15*t);
  }
  this.light.color.set(this.model.released?0xffc1e0:0x96fce7);this.light.intensity=4+this.model.pulse*2;
  if(this.model.score>this.lastScore){this.lastScore=this.model.score;this.soundEffect();}
  if(this.model.phase!=='playing'){this.keys.clear();this.drag=null;if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();}
  this.renderer.render(this.scene,this.camera);
  if(this.command&&(performance.now()>=this.command.end||this.model.phase!=='playing')){const command=this.command;this.command=null;this.emit();command.resolve(this.model.snapshot());}
  if(++this.tickCount%8===0)this.emit();
 };
 dispose(){
  this.disposed=true;cancelAnimationFrame(this.raf);this.abort.abort();this.resize.disconnect();this.keys.clear();
  if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();
  if(this.command){this.command.resolve(this.model.snapshot());this.command=null;}
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  this.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}if(o instanceof THREE.Sprite)materials.add(o.material);});
  for(const g of geometries)g.dispose();for(const m of materials){const mat=m as THREE.MeshStandardMaterial;mat.map?.dispose();m.dispose();}
  this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();void this.audio?.close();
 }
}
