'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Progress } from '@/components/ui/progress';
import BrainMap from './brain-map';
import { regions, mapMissions, signalStages, sourceLinks, shuffle } from '@/lib/game-data';

type Mode='map'|'signal'|'pairs';
type Phase='home'|'brief'|'play'|'done';
type Stats={xp:number;played:number;best:Record<Mode,number>;learned:string[]};
type Feedback={ok:boolean;title:string;text:string;memory?:string};
const EMPTY:Stats={xp:0,played:0,best:{map:0,signal:0,pairs:0},learned:[]};
const STORAGE='neurolab-arcade-v1';
const modes=[
 {id:'map' as Mode,no:'01',title:'脳の地図',sub:'6つの部位へ信号を届ける',icon:'◎',heading:'脳の地図を\n取り戻そう。',intro:'小さな信号になって、6つのエリアに明かりを灯そう。部位の場所と働きが、ひとつずつつながっていく。',how:'ミッションを読み、脳の地図の部位をタップ。間違えた問題は、少し後でもう一度。'},
 {id:'signal' as Mode,no:'02',title:'シグナル・リレー',sub:'神経の情報ルートをつなぐ',icon:'↝',heading:'ひとつの信号を、\n次の細胞へ。',intro:'入力を受け取り、電気信号を送り、化学物質で橋渡し。7つの接続を修復して、情報を届けよう。',how:'ヒントを手掛かりに、ルートの次のパーツを選ぼう。正解すると信号の経路がつながる。'},
 {id:'pairs' as Mode,no:'03',title:'記憶のペア',sub:'部位と働きをそろえる',icon:'▧',heading:'場所と働きを、\nペアにしよう。',intro:'カードをめくって、脳の部位と代表的な働きをそろえよう。配置は毎回変わるので、何度でも挑戦できる。',how:'部位カードと働きカードを1枚ずつめくる。違うペアなら解説を読んでから閉じられる。'}
];
function readStats(value:unknown):Stats {
 if(!value||typeof value!=='object')return EMPTY;
 const s=value as Partial<Stats>;
 const num=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?Math.floor(n):0;
 return {xp:num(s.xp),played:num(s.played),best:{map:num(s.best?.map),signal:num(s.best?.signal),pairs:num(s.best?.pairs)},learned:Array.isArray(s.learned)?s.learned.filter((v):v is string=>typeof v==='string'&&regions.some(r=>r.id===v)):[]};
}
export default function Home(){
 const [mode,setMode]=useState<Mode>('map');
 const [phase,setPhase]=useState<Phase>('home');
 const [selected,setSelected]=useState('frontal');
 const [stats,setStats]=useState<Stats>(EMPTY);
 const [storageOk,setStorageOk]=useState(true);
 const [runXP,setRunXP]=useState(0);
 const [combo,setCombo]=useState(0);
 const [lit,setLit]=useState<string[]>([]);
 const [feedback,setFeedback]=useState<Feedback|null>(null);
 const [hint,setHint]=useState(false);
 const [hintUsed,setHintUsed]=useState(false);
 const panelRef=useRef<HTMLElement|null>(null);
 const [queue,setQueue]=useState<number[]>([]);
 const [step,setStep]=useState(0);
 const [deck,setDeck]=useState<{key:string;id:string;kind:'name'|'role'}[]>([]);
 const [flipped,setFlipped]=useState<string[]>([]);
 const [matched,setMatched]=useState<string[]>([]);
 const [moves,setMoves]=useState(0);
 const [result,setResult]=useState({score:0,tries:0});
 const [sound,setSound]=useState(false);
 const [showAtlas,setShowAtlas]=useState(false);
 const soundRef=useRef<AudioContext|null>(null);
 const answerLock=useRef(false);
 const completed=useRef(false);
 const webActions=useRef<((action:string,input:unknown)=>unknown)|null>(null);
 const config=modes.find(m=>m.id===mode)!;
 const currentRegion=regions.find(r=>r.id===selected)||regions[0];
 const mission=mapMissions[queue[step]??0];
 const signal=signalStages[Math.min(step,6)];
 const progress=mode==='map'?lit.length/6*100:mode==='signal'?Math.min(step+(feedback?.ok?1:0),7)/7*100:matched.length/6*100;

 useEffect(()=>{try{const raw=localStorage.getItem(STORAGE);if(raw)setStats(readStats(JSON.parse(raw)));}catch{setStorageOk(false);}},[]);
 useEffect(()=>{if(window.innerWidth<=800&&phase!=='home')panelRef.current?.scrollIntoView({behavior:'instant',block:'start'});},[phase,step,feedback]);
 function beep(ok:boolean){
  if(!sound)return;
  try {const ctx=soundRef.current??new AudioContext();soundRef.current=ctx;void ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(ok?580:220,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(ok?880:180,ctx.currentTime+.13);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.22);}catch{}
 }
 function clean(){
  setRunXP(0);setCombo(0);setLit([]);setFeedback(null);setHint(false);setHintUsed(false);setStep(0);setFlipped([]);setMatched([]);setMoves(0);setShowAtlas(false);answerLock.current=false;completed.current=false;
 }
 function chooseMode(next:Mode){clean();setMode(next);setPhase('home');}
 function start(){
  clean();
  const chosen=regions.map(r=>{const candidates=mapMissions.map((m,i)=>m.answer===r.id?i:-1).filter(i=>i>=0);return candidates[Math.floor(Math.random()*candidates.length)];});
  setQueue(shuffle(chosen));
  setDeck(shuffle(regions.flatMap(r=>[{key:r.id+'-name',id:r.id,kind:'name' as const},{key:r.id+'-role',id:r.id,kind:'role' as const}])));
  setPhase('brief');
 }
 function gain(points:number){setRunXP(x=>x+points);setCombo(c=>c+1);beep(true);}
 function finish(score=runXP,tries=mode==='pairs'?moves:step+1){
  if(completed.current)return;completed.current=true;
  const newStats:Stats={xp:stats.xp+score,played:stats.played+1,best:{...stats.best,[mode]:Math.max(stats.best[mode],score)},learned:[...new Set([...stats.learned,...(mode==='signal'?[]:regions.map(r=>r.id))])]};
  setStats(newStats);setResult({score,tries});setRunXP(0);setPhase('done');setFeedback(null);setShowAtlas(false);
  try{localStorage.setItem(STORAGE,JSON.stringify(newStats));}catch{setStorageOk(false);}
 }
 function answerMap(id:string){
  if(phase!=='play'){setSelected(id);return;}
  if(answerLock.current||feedback)return;answerLock.current=true;setSelected(id);
  const correct=regions.find(r=>r.id===mission.answer)!;
  const ok=id===mission.answer;
  if(ok){gain(hintUsed?50:100+Math.min(combo,3)*20);setLit(x=>[...new Set([...x,id])]);}
  else{
   beep(false);setCombo(0);
   setQueue(q=>{const next=[...q];const alternate=mapMissions.findIndex((m,i)=>m.answer===mission.answer&&i!==queue[step]);next.splice(Math.min(step+3,next.length),0,alternate<0?queue[step]:alternate);return next;});
  }
  setFeedback({ok,title:ok?'信号が届いた！':correct.name+'へ届けよう',text:correct.detail,memory:correct.memory});
 }
 function answerSignal(value:string){
  if(phase!=='play'||answerLock.current||feedback)return;answerLock.current=true;
  const ok=value===signal.answer;
  if(ok)gain(hintUsed?50:100+Math.min(combo,3)*20);else{beep(false);setCombo(0);}
  setFeedback({ok,title:ok?'接続できた！':'この接続をもう一度',text:ok?signal.explain:'ヒントを見て、もう一度つないでみよう。'+signal.hint});
 }
 function next(){
  if(!feedback)return;
  if(mode==='map'){
   if(step+1>=queue.length){finish();return;}setStep(s=>s+1);
  }else if(mode==='signal'&&feedback.ok){
   if(step===6){finish();return;}setStep(s=>s+1);
  }
  setFeedback(null);setHint(false);setHintUsed(false);answerLock.current=false;
 }
 function flip(key:string){
  if(phase!=='play'||answerLock.current||feedback)return;
  const card=deck.find(c=>c.key===key);if(!card||matched.includes(card.id)||flipped.includes(key))return;
  if(flipped.length===0){setFlipped([key]);return;}
  const first=deck.find(c=>c.key===flipped[0])!;
  setFlipped([first.key,key]);setMoves(m=>m+1);answerLock.current=true;
  const ok=first.id===card.id&&first.kind!==card.kind;
  const r=regions.find(r=>r.id===(first.kind==='name'?first.id:card.id))!;
  if(ok){gain(100+Math.min(combo,3)*20);setMatched(x=>[...x,card.id]);setLit(x=>[...x,card.id]);}
  else{beep(false);setCombo(0);}
  setFeedback({ok,title:ok?'ペアがつながった！':'この組み合わせを覚えよう',text:r.name+'は、'+r.role+'ことに関わる。',memory:r.memory});
 }
 function closePair(){
  if(matched.length===6){finish();return;}
  setFlipped([]);setFeedback(null);answerLock.current=false;
 }
 webActions.current=(action,input)=>{
  if(action==='status')return {mode,phase,xp:stats.xp,runXP,completedMissions:stats.played,progress:Math.round(progress)};
  const value=input as {mode?:unknown};
  if(action==='start'){
   if(!value||!['map','signal','pairs'].includes(String(value.mode)))throw new Error('mode must be map, signal, or pairs');
   if(phase==='play'||phase==='brief')throw new Error('A mission is already active. Finish it or return home first.');
   flushSync(()=>{chooseMode(value.mode as Mode);});
   return {mode:value.mode,phase:'home',ready:true};
  }
  throw new Error('Unknown action');
 };
 useEffect(()=>{
  type MC={registerTool:(tool:Record<string,unknown>,options:{signal:AbortSignal})=>void|Promise<void>};
  const ctx=(document as Document&{modelContext?:MC}).modelContext;
  if(!ctx?.registerTool)return;
  const lifecycle=new AbortController();
  const register=(tool:Record<string,unknown>)=>{try{void Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'get_neuro_arcade_status',description:'Read the current game mode, phase, knowledge points, and completed mission count.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>webActions.current?.('status',{})});
  register({name:'select_neuro_arcade_mission',description:'Select map, signal, or pairs and show its start screen. Does not play or complete the mission. Fails if a mission is active.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['map','signal','pairs']}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input:unknown)=>webActions.current?.('start',input)});
  return()=>lifecycle.abort();
 },[]);

 const gameActive=phase==='play'||phase==='brief';
 return <div className="app-shell">
 <header className="topbar"><button className="brand brand-button" onClick={()=>{clean();setPhase('home');}} aria-label="Neuro Arcade ホーム"><span className="brand-mark">✳</span><span>NEURO<span className="brand-light">ARCADE</span><small>BY NEUROLAB</small></span></button><div className="header-right"><span className="session-chip"><i/> 学びの回路、接続中</span><button className={'sound-toggle '+(sound?'on':'')} onClick={()=>setSound(v=>!v)} aria-pressed={sound} aria-label="効果音">{sound?'♪ 音あり':'♪ 音なし'}</button><span className="score-label">✧ {stats.xp+runXP} XP</span></div></header>
 <main>
 <a className="dive-entry" href="/dive"><span>FIRST-PERSON 3D</span><strong>脳内を歩いて探検する</strong><span>NEURO DIVE ↗</span></a>
 <div className="page-heading"><div><p className="eyebrow">A SMALL ADVENTURE INSIDE YOUR HEAD</p><h1>脳の中へ、<span>冒険しよう。</span></h1></div><p>{stats.played>0?'クリア '+stats.played+'回 · 今日もひとつ、つなごう。':'1回3分。遊んで、つないで、覚える。'}</p></div>
 {gameActive&&<div className="runbar"><button className="text-button" onClick={()=>{clean();setPhase('home');}}>← スタート画面へ</button><span>{config.title}</span><span className="accent">{combo>1?combo+'連続接続 · ':''}{runXP} XP</span></div>}
 <div className={'workspace '+(mode==='pairs'?'pairs-workspace ':'')+(gameActive?'is-playing':'')}>
 <section className={'board '+(feedback?.ok?'celebrate':'')} aria-label="プレイエリア">
 <div className="board-top"><span><i className="tiny-dot"/> {mode==='map'?'BRAIN EXPLORER':mode==='signal'?'SIGNAL RELAY':'MEMORY PAIRS'}</span><span>{phase==='play'?(mode==='map'?lit.length+' of 6':mode==='signal'?Math.min(step+(feedback?.ok?1:0),7)+' of 7':matched.length+' of 6'):'MISSION '+config.no}</span></div>
 {mode==='map'&&<BrainMap onPick={answerMap} selected={selected} lit={phase==='done'?regions.map(r=>r.id):lit} hint={hint&&phase==='play'?mission.answer:''} disabled={phase==='play'&&(!!feedback||showAtlas)}/>}
 {mode==='signal'&&<SignalBoard step={phase==='done'?7:phase==='play'?step+(feedback?.ok?1:0):0}/>}
 {mode==='pairs'&&<div className="pairs-area">{phase==='home'?<div className="pair-preview"><span className="eyebrow">CONNECT THE PAIRS</span><div className="sample-pair"><div><small>部位</small>海馬</div><span>↔</span><div><small>働き</small>新しい出来事を<br/>記憶する</div></div><p>名前だけでなく、働きとセットで覚えよう。</p><span className="pair-count">6 <small>PAIRS TO CONNECT</small></span></div>:<div className="card-grid">{deck.map((c,i)=>{const r=regions.find(r=>r.id===c.id)!;const open=phase==='brief'||phase==='done'||flipped.includes(c.key)||matched.includes(c.id);return <button key={c.key} className={'memory-card '+(open?'face-up ':'')+(matched.includes(c.id)?'matched':'')} style={{'--region':r.color} as React.CSSProperties} aria-label={open?(c.kind==='name'?'部位 '+r.name:'働き '+r.role):'カード '+(i+1)+' '+(c.kind==='name'?'部位':'働き')} disabled={phase!=='play'||!!feedback||matched.includes(c.id)} onClick={()=>flip(c.key)}>{open?<><span>{c.kind==='name'?'部位':'働き'}</span><strong>{c.kind==='name'?r.name:r.role}</strong>{matched.includes(c.id)&&<b>✓</b>}</>:<><span>{c.kind==='name'?'部位':'働き'}</span><strong>{c.kind==='name'?'◎':'✧'}</strong><small>{String(i+1).padStart(2,'0')}</small></>}</button>;})}</div>}</div>}
 {phase==='play'&&<Progress className="game-progress" value={progress} aria-label="ミッションの進捗"/>}
 <div className="board-bottom"><span>{mode==='map'?'左が前、右が後ろ · 部位をタップ':mode==='signal'?'典型的な化学シナプスの基本モデル':phase==='play'?'めくった組数 '+moves+'回':'6つの部位と代表的な働き'}</span><span>NEUROLAB · 00{config.no.slice(-1)}</span></div>
 </section>
 <aside className="mission-panel" ref={panelRef}>
 {phase==='home'&&<><span className="eyebrow accent">MISSION {config.no} · {mode==='map'?'まずはここから':mode==='signal'?'7つの接続':'6組のカード'}</span><h2>{config.heading.split('\n').map((s,i)=><span key={s}>{i>0&&<br/>}{s}</span>)}</h2><p>{config.intro}</p><button className="primary" onClick={start}>ミッションをはじめる <span>→</span></button>{mode==='map'?<FieldNote region={currentRegion}/>:<div className="how-to"><span className="eyebrow">HOW TO PLAY</span><p>{config.how}</p></div>}<p className="small-note">制限時間なし。間違えても、何度でも。{stats.best[mode]>0&&<><br/>自己ベスト {stats.best[mode]} XP</>}</p></>}
 {phase==='brief'&&<><span className="eyebrow accent">READY TO CONNECT</span><h2>まずは、<br/>ちょっと下見。</h2><p>{mode==='pairs'?'カードが全部見えている間に、部位と働きを見ておこう。準備ができたら、好きなタイミングで始めてね。':config.how}</p>{mode==='map'&&<div className="brief-list">{regions.map(r=><div key={r.id}><strong style={{color:r.color}}>{r.name}</strong><span>{r.role}</span></div>)}</div>}{mode==='signal'&&<div className="brief-flow"><span>樹状突起</span> → <span>細胞体</span> → <span>軸索</span> → <span>軸索終末</span><p>入力をまとめ、発火条件を満たすと電気信号が軸索を進む。その後、化学物質で次の細胞へ。</p></div>}<button className="primary" onClick={()=>setPhase('play')}>準備OK、遊ぶ <span>→</span></button><p className="small-note">タイマーはないので、自分のペースで。</p></>}
 {phase==='play'&&<><div className="mission-status"><span className="eyebrow accent">{mode==='map'?'SIGNAL '+String(step+1).padStart(2,'0'):mode==='signal'?'CONNECTION '+String(step+1).padStart(2,'0'):'FIND YOUR PAIR'}</span><span className="eyebrow">{mode==='map'?'残り '+(queue.length-step)+'問':mode==='signal'?'全7ステップ':matched.length+'組 接続済み'}</span></div><h2 className="question-title">{mode==='map'?mission.title:mode==='signal'?signal.title:'部位と働きを\nつないでみよう。'}</h2><p className="question-text">{mode==='map'?mission.text:mode==='signal'?signal.prompt:'部位カードと働きカードを1枚ずつめくろう。同じ部位の組み合わせがそろえば、接続成功。'}</p>
 {mode==='signal'&&!feedback&&<div className="answer-grid">{signal.options.map((v,i)=><button key={v} onClick={()=>answerSignal(v)}><span>{'①②③④'[i]}</span>{v}</button>)}</div>}
 {mode!=='pairs'&&!feedback&&<button className="hint-button" onClick={()=>{setHintUsed(true);setHint(v=>!v);}} aria-expanded={hint}>✧ {hint?'ヒントを閉じる':'ヒントを見る'}<small>ヒント使用時は50 XP</small></button>}
 {hint&&!feedback&&<div className="hint-box">{mode==='map'?mission.clue:signal.hint}</div>}
 {feedback&&<div className={'feedback '+(feedback.ok?'correct':'retry')} role="status" aria-live="polite"><div className="feedback-title"><span>{feedback.ok?'✳':'↺'}</span><h3>{feedback.title}</h3></div><p>{feedback.text}</p>{feedback.memory&&<strong>{feedback.memory}</strong>}<button className="primary" onClick={mode==='pairs'?closePair:next}>{mode==='pairs'?(matched.length===6?'結果を見る':feedback.ok?'次のペアへ':'カードを閉じる'):mode==='signal'&&!feedback.ok?'もう一度つなぐ':(mode==='map'&&step+1>=queue.length)||(mode==='signal'&&step===6)?'結果を見る':'次の信号へ'} <span>→</span></button>{!feedback.ok&&mode==='map'&&<small>別のミッションで、少し後にもう一度出てくるよ。</small>}</div>}
 {mode==='pairs'&&!feedback&&<div className="field-note"><span className="eyebrow">SMALL TIP</span><p>同じ部位の名前と働きが1組。違ったときも、解説を読んでからカードを閉じられるよ。</p></div>}
 <p className="small-note">接続はゲーム内の演出。脳の各部位は協力して働く。</p></>}
 {phase==='done'&&<div className="result-panel"><span className="eyebrow accent">MISSION COMPLETE</span><div className="result-emblem">✳</div><h2>{mode==='map'?'6つのエリアが、点灯。':mode==='signal'?'次の細胞へ、届いた。':'6組の知識が、つながった。'}</h2><div className="result-xp">+{result.score}<span>XP</span></div><p>{mode==='map'?'場所と働きを結びつけられたね。次は別の遊び方でも、思い出してみよう。':mode==='signal'?'樹状突起で入力を受け、発火すると軸索に電気信号が伝わる。細胞間は化学物質が橋渡し。':'何も見ずに思い出すことが、復習になる。明日も配置を変えて、つないでみよう。'}</p><div className="result-fact"><strong>今日のひとつ</strong><p>神経可塑性（経験によって神経のつながりや働きが変わる性質）は、大人にも残る。つながりが強まる変化も、弱まる変化もある。</p></div><button className="primary" onClick={()=>chooseMode(mode==='map'?'signal':mode==='signal'?'pairs':'map')}>次のミッションへ <span>→</span></button><button className="secondary" onClick={start}>同じミッションでもう一度</button><p className="small-note">{storageOk?'記録はこのブラウザーに保存済み。':'この環境では記録を保存できないため、今回の画面内だけの記録。'}</p></div>}
 </aside>
 </div>
 <nav className="mode-grid" aria-label="ミッションを選ぶ">{modes.map(m=><button className={'mode-card '+(mode===m.id?'active':'')} key={m.id} onClick={()=>chooseMode(m.id)} aria-current={mode===m.id?'true':undefined}><span className="mode-icon">{m.icon}</span><div><span className="eyebrow">MISSION {m.no}{stats.best[m.id]>0?' · CLEAR':''}</span><h3>{m.title}</h3><p>{m.sub}</p></div><span className="mode-arrow">↗</span></button>)}</nav>
 <details className="atlas" open={showAtlas} onToggle={e=>{const open=e.currentTarget.open;setShowAtlas(open);if(open&&phase==='play'&&mode!=='pairs'){setHint(true);setHintUsed(true);}}}><summary>探索ノート <span>6つの部位と、学びの出典</span><b>＋</b></summary><div className="atlas-grid">{regions.map(r=><FieldNote key={r.id} region={r}/>)}</div><div className="sources"><p>図は位置と形を簡略化した学習用モデル。大脳の4つの葉、小脳、内側にある海馬を扱っている。1つの部位が1つの機能だけを担うわけではない。</p><p>出典はBrainFacts（Society for Neuroscience）の教育資料。</p>{sourceLinks.map(([name,url])=><a key={url} href={url} target="_blank" rel="noreferrer">{name} ↗</a>)}</div></details>
 <footer><span>NEUROLAB · 脳科学を、自分の手で。</span><span>{storageOk?'記録はこのブラウザーだけに保存':'記録の保存は利用できない'} · XPは学んだ知識のゲーム内ポイント</span></footer>
 </main></div>;
}
function FieldNote({region:r}:{region:typeof regions[number]}){
 return <div className="field-note" style={{'--region':r.color} as React.CSSProperties}><span className="eyebrow">FIELD NOTE · {r.en}</span><h3>{r.name}<small>{r.reading}</small></h3><p>{r.detail}</p><strong>{r.memory}</strong></div>;
}
function SignalBoard({step}:{step:number}){
 return <div className="signal-board"><div className="signal-intro"><span className="eyebrow">FOLLOW THE INFORMATION</span><p>受け取る。まとめる。届ける。</p></div>
 <svg viewBox="0 0 600 290" role="img" aria-label="ニューロンの情報の流れ。樹状突起で受けた入力を統合し、発火すると活動電位が軸索を進む。終末から化学物質で次の細胞へ伝える。">
 <g className={step>=1?'wire powered':'wire'}><path d="M40 56 L87 90 L142 139 M48 160 L97 145 L142 139 M44 230 L95 190 L142 139 M75 55 L87 90 M96 214 L95 190 M48 118 L97 145"/><circle cx="40" cy="56" r="5"/><circle cx="48" cy="160" r="5"/><circle cx="44" cy="230" r="5"/></g>
 <g className={step>=2?'wire powered':'wire'}><path d="M142 139 Q143 83 180 84 Q223 84 224 139 Q222 189 180 190 Q143 190 142 139Z"/><circle cx="181" cy="137" r="17"/></g>
 <g className={step>=3?'wire powered electric':'wire'}><path d="M224 139 H426" className="axon"/><path d="M250 124 H278 V155 H250 M303 124 H331 V155 H303 M356 124 H384 V155 H356" className="myelin"/>{step>=3&&<circle cx="258" cy="139" r="6" className="electric-pulse"/>}</g>
 <g className={step>=4?'wire powered':'wire'}><path d="M426 139 L456 103 M426 139 H467 M426 139 L456 175"/><circle cx="458" cy="99" r="9"/><circle cx="470" cy="139" r="9"/><circle cx="458" cy="179" r="9"/></g>
 <path d="M533 63 Q505 139 533 218" fill="none" stroke={step>=7?'#77dcd0':'#536b62'} strokeWidth="6"/>
 {step>=5&&<text x="420" y="59" fill="#f5d573" fontSize="16">Ca²⁺ ↓</text>}
 {step>=6&&<g fill="#eca2cd" className="chemical-particles"><circle cx="488" cy="111" r="4"/><circle cx="500" cy="139" r="4"/><circle cx="485" cy="164" r="4"/></g>}
 <g className="neuron-labels"><text x="78" y="264">入力</text><text x="181" y="237">統合</text><text x="324" y="199">電気信号</text><text x="502" y="251">化学物質で橋渡し</text></g>
 </svg><div className="signal-steps">{['樹状突起','細胞体','軸索','軸索終末'].map((s,i)=><div className={step>i?'connected':''} key={s}><span>{step>i?'✓':String(i+1).padStart(2,'0')}</span><strong>{s}</strong></div>)}</div>
 <div className="synapse-steps">{['Ca²⁺が流入','伝達物質を放出','受容体に結合'].map((s,i)=><span className={step>=i+5?'connected':''} key={s}>{step>=i+5?'✓':'○'} {s}</span>)}</div>
 <p className="diagram-caption">ニューロン（神経細胞）の典型的な情報ルート。<br/>樹状突起の入力と、軸索の活動電位は異なる。</p></div>;
}
