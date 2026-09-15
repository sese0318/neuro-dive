'use client';
import {useEffect, useRef} from 'react';
import {LESSONS} from '@/lib/dive-learning';
import type {DiveSnapshot, DiveStage} from '@/lib/dive-state';

export function NeuronMap({stage, compact=false}: {stage:DiveStage; compact?:boolean}) {
  return <figure className={'neuron-map '+(compact?'compact':'')} aria-label={'神経細胞の情報の流れ。現在は'+({input:'入力を受け取る場所',axon:'電気信号を伝える軸索',synapse:'次の細胞へ渡すシナプス'}[stage])}>
    {!compact&&<svg viewBox="0 0 640 100" aria-hidden="true">
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <g stroke={stage==='input'?'#d5f3a3':'#639a98'}><path d="M15 20L42 36L75 50L42 68L15 82M42 36L40 10M42 68L40 92M12 49L75 50"/><ellipse cx="100" cy="50" rx="28" ry="24"/><circle cx="100" cy="50" r="8"/></g>
        <path stroke={stage==='axon'?'#d5f3a3':'#639a98'} d="M129 50H425"/>
        {[155,235,315].map(x=><rect key={x} x={x} y="35" width="60" height="30" rx="12" fill="#244449" stroke={stage==='axon'?'#d5f3a3':'#639a98'}/>)}
        <g stroke={stage==='synapse'?'#efb5d2':'#639a98'}><path d="M425 50L448 25L468 25M425 50H468M425 50L448 75H468M531 13V87M539 13V87M539 50H600"/>{[25,50,75].map(y=><circle key={y} cx="475" cy={y} r="7"/>)}<path d="M527 29h-9v12h9M527 60h-9v12h9"/></g>
      </g>
      <g fill="#efb5d2">{[32,49,65].map((y,i)=><circle key={y} cx={495+i*4} cy={y} r="3"/>)}</g>
    </svg>}
    <div className="neuron-route">{[{id:'input',title:'入力を受け取る',place:'樹状突起・細胞体'},{id:'axon',title:'電気信号を伝える',place:'軸索'},{id:'synapse',title:'次の細胞へ渡す',place:'シナプス'}].map((s,i)=><div key={s.id} className={stage===s.id?'here':''}><span>{i+1} {s.title}</span>{!compact&&<small>{s.place}</small>}</div>)}</div>
    {!compact&&<figcaption>ひとつのニューロン → 次のニューロン　<span>模式図・縮尺は実物と異なる</span></figcaption>}
  </figure>;
}

export function LearningDialog({view,onAnswer,onContinue}: {view:DiveSnapshot;onAnswer:(choice:number)=>void;onContinue:()=>void}) {
  const dialog=useRef<HTMLElement>(null), heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();dialog.current?.scrollTo(0,0);},[view.lesson]);
  if(!view.lesson)return null;
  const lesson=LESSONS[view.lesson],passed=view.mastered.includes(view.lesson);
  const selected=view.answer===null?null:lesson.choices?.[view.answer];
  return <section className="dive-overlay lesson-overlay">
    <article ref={dialog} className="dive-dialog lesson-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-title" onKeyDown={e=>{
      if(e.key!=='Tab')return;
      const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===heading.current)){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }}>
      <div className="lesson-topline"><span className="dive-eyebrow">{lesson.eyebrow}</span><span>読んでいる間は時間停止</span></div>
      <h1 ref={heading} tabIndex={-1} id="lesson-title">{lesson.title}</h1>
      <p>{lesson.body}</p>
      <NeuronMap stage={lesson.stage} compact={lesson.kind==='check'}/>
      {lesson.steps&&<ol className="lesson-steps">{lesson.steps.map((step,i)=><li key={step}><b>{i+1}</b><span>{step}</span></li>)}</ol>}
      {lesson.choices&&<div className="lesson-choices" aria-label="理解チェックの選択肢">{lesson.choices.map((choice,i)=><button key={choice.text} disabled={passed} className={view.answer===i?(passed?'is-correct':'try-again'):''} aria-pressed={view.answer===i} onClick={()=>onAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{choice.text}{view.answer===i&&<b>{passed?'✓':'↻'}</b>}</button>)}</div>}
      {selected&&<div className={'lesson-feedback '+(passed?'passed':'')} role="status"><strong>{passed?'つながった！':'もう一度考えてみよう'}</strong><p>{selected.feedback}</p></div>}
      <p className="lesson-note">{lesson.note}</p>
      {(lesson.kind==='guide'||passed)?<button className="dive-primary" onClick={onContinue}>{lesson.button}<span>→</span></button>:<p className="lesson-reassure">選んで確かめよう。間違えても減点なし。</p>}
    </article>
  </section>;
}
