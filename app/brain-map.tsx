'use client';
import { regions } from '@/lib/game-data';
export default function BrainMap({onPick,lit=[],selected='',hint='',disabled=false}:{onPick:(id:string)=>void;lit?:string[];selected?:string;hint?:string;disabled?:boolean}) {
 return <div className="brain-wrap">
 <svg className="brain-map" viewBox="0 0 600 490" aria-label="脳の左側面の模式図。左が前、右が後ろ。海馬は内側を別枠で表示。">
 <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#778684" opacity=".18"/></pattern></defs>
 <rect width="600" height="490" fill="url(#dots)"/>
 <circle cx="300" cy="252" r="197" fill="none" stroke="#334441" strokeDasharray="3 8"/>
 <path d="M300 40 V465 M46 252 H556" fill="none" stroke="#243733"/>
 <text x="24" y="76" className="map-coordinate">LEFT HEMISPHERE</text>
 <text x="24" y="102" className="map-direction">← 前</text><text x="530" y="102" className="map-direction">後ろ →</text>
 <path d="M355 333 L370 416 Q360 437 344 416 L326 343" fill="#2d3c39" stroke="#596861" strokeWidth="2"/>
 {regions.filter(r=>r.path).map((r,i)=><g key={r.id} className={'brain-region '+(lit.includes(r.id)?'lit ':'')+(selected===r.id?'selected ':'')+(hint===r.id?'hinted':'')} style={{'--region':r.color} as React.CSSProperties} role="button" tabIndex={disabled?-1:0} aria-label={r.name} aria-disabled={disabled} onClick={()=>!disabled&&onPick(r.id)} onKeyDown={e=>{if(!disabled&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onPick(r.id);}}}>
 <path d={r.path}/><text x={r.x} y={r.y-15} className="region-number">0{i+1}</text><text x={r.x} y={r.y+12} className="region-name">{r.name}</text></g>)}
 <path d="M257 308 C225 310 217 346 202 363" stroke="#f5d573" fill="none" strokeDasharray="4 6" opacity=".6"/>
 <g role="button" tabIndex={disabled?-1:0} aria-label="海馬" aria-disabled={disabled} className={'brain-region hippocampus '+(lit.includes('hippocampus')?'lit ':'')+(selected==='hippocampus'?'selected ':'')+(hint==='hippocampus'?'hinted':'')} style={{'--region':'#f5d573'} as React.CSSProperties} onClick={()=>!disabled&&onPick('hippocampus')} onKeyDown={e=>{if(!disabled&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onPick('hippocampus');}}}>
 <rect x="72" y="364" width="200" height="92" rx="8"/><text x="172" y="389" className="region-number">06 · 内側の構造</text><text x="172" y="419" className="region-name">海馬</text><text x="172" y="440" className="inset-note">側頭葉の内側を別枠で表示</text>
 </g>
 </svg>
 <div className="map-note"><span className="tiny-dot"/> 位置と形は学習用の模式図</div>
 </div>;
}
