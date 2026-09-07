export const regions = [
 {id:'frontal',name:'前頭葉',reading:'ぜんとうよう',en:'FRONTAL',color:'#dbf68a',role:'計画を立てる',memory:'前で作戦を立てる、前頭葉。',detail:'計画や判断、自分の意思で体を動かすことなどに関わる。',x:192,y:196,path:'M298 80 C225 58 115 89 84 151 C54 195 64 255 111 268 L274 233 C266 191 283 153 290 128 Z'},
 {id:'parietal',name:'頭頂葉',reading:'とうちょうよう',en:'PARIETAL',color:'#77dcd0',role:'触った感覚をまとめる',memory:'頭のてっぺんで、タッチをまとめる。',detail:'触覚などの感覚情報を処理し、組み合わせることに関わる。',x:372,y:164,path:'M306 81 C385 72 454 113 470 169 L433 225 L284 230 C274 182 312 128 306 81 Z'},
 {id:'temporal',name:'側頭葉',reading:'そくとうよう',en:'TEMPORAL',color:'#eca2cd',role:'音を処理する',memory:'耳のそばで音を聞く、側頭葉。',detail:'音の処理や言葉の理解、記憶などに関わる。',x:270,y:278,path:'M123 276 L275 242 L428 238 C409 288 349 330 284 341 C218 351 142 327 123 276 Z'},
 {id:'occipital',name:'後頭葉',reading:'こうとうよう',en:'OCCIPITAL',color:'#a8b8ff',role:'視覚情報を処理する',memory:'目は前、見る情報は後ろへ。',detail:'色や形など、見るための情報の処理に関わる。',x:485,y:250,path:'M478 177 C524 184 548 242 519 281 C500 309 464 323 420 310 L443 230 Z'},
 {id:'cerebellum',name:'小脳',reading:'しょうのう',en:'CEREBELLUM',color:'#f3b578',role:'動きを細かく調整する',memory:'後ろの小さな調整役、小脳。',detail:'動きの細かな調整やバランス、運動技能の学習に関わる。',x:435,y:366,path:'M408 323 C460 311 507 331 496 373 C487 405 423 421 390 396 C371 379 377 342 408 323 Z'},
 {id:'hippocampus',name:'海馬',reading:'かいば',en:'HIPPOCAMPUS',color:'#f5d573',role:'新しい出来事を記憶する',memory:'海馬は、出来事と場所を結びつける。',detail:'側頭葉の内側にある構造。新しい出来事の記憶づくりや、場所を覚えることに関わる。',x:180,y:416,path:''}
] as const;
export type RegionId = typeof regions[number]['id'];
export const mapMissions: {answer:RegionId; title:string; text:string; clue:string}[] = [
 {answer:'frontal',title:'迷路から脱出せよ',text:'出口までの作戦を立てたい。計画や判断に関わる部位に信号を届けよう。',clue:'脳の前側。名前にも前が入る。'},
 {answer:'occipital',title:'暗号を見つけろ',text:'壁に色と形の暗号が現れた。視覚情報の処理に関わる部位はどこ？',clue:'目は顔の前。でも、この葉は脳の後ろ側。'},
 {answer:'cerebellum',title:'一本橋を渡れ',text:'足の動きとバランスを細かく調整したい。調整を助ける部位を選ぼう。',clue:'大脳の後ろ下側にある、小さな構造。'},
 {answer:'temporal',title:'無線を聞き取れ',text:'仲間から音声メッセージが届いた。音の処理に関わる葉へ届けよう。',clue:'耳のそば、脳の側面にある。'},
 {answer:'hippocampus',title:'宝のありかを覚えろ',text:'いつ、どこで宝を見つけたか。新しい出来事を記憶するのを助ける構造は？',clue:'側頭葉の内側。全ての記憶の保管庫という意味ではない。'},
 {answer:'parietal',title:'手触りから探し出せ',text:'袋の中の鍵を手の感覚で探そう。触覚などの情報をまとめる葉はどこ？',clue:'前頭葉の後ろ。頭のてっぺんに近い。'},
 {answer:'temporal',title:'足音を追跡せよ',text:'右から聞こえる足音を処理したい。聴覚に関わる葉を選ぼう。',clue:'側面にある、耳に近い葉。'},
 {answer:'frontal',title:'次の一手を考えろ',text:'障害物をよける順番を決めたい。計画づくりに関わる葉を選ぼう。',clue:'額に近い、前側の葉。'},
 {answer:'parietal',title:'振動をキャッチせよ',text:'手のひらに小さな振動が伝わった。皮膚からの感覚情報をまとめる葉は？',clue:'脳の上側、前頭葉のすぐ後ろ。'},
 {answer:'hippocampus',title:'昨日の探検を思い出せ',text:'新しい場所と出来事を結びつけて記憶したい。大脳の内側の構造を選ぼう。',clue:'海の生き物に似た名前をもつ。'},
 {answer:'occipital',title:'信号の色を見分けろ',text:'扉のランプが赤から緑に変わった。視覚情報を処理する葉へ信号を送ろう。',clue:'脳の一番後ろ側の葉。'},
 {answer:'cerebellum',title:'着地を決めろ',text:'ジャンプの着地で動きのタイミングを合わせたい。調整を助ける構造は？',clue:'大脳の後ろ下にある。運動技能の学習にも関わる。'}
];
export const signalStages = [
 {title:'入力を受け取る',prompt:'他の細胞から入力を受ける、枝分かれした部分を選ぼう。',answer:'樹状突起',options:['軸索終末','樹状突起','細胞体','軸索'],hint:'樹の枝のような形。',explain:'樹状突起（じゅじょうとっき）は、主に他の神経細胞から入力を受け取る。'},
 {title:'入力をまとめる',prompt:'基本ルートの次は、核などがある細胞の中心部分。',answer:'細胞体',options:['軸索','受容体','細胞体','神経伝達物質'],hint:'細胞の本体にあたる。',explain:'細胞体（さいぼうたい）には核などがある。樹状突起や細胞体で受けた入力が統合され、発火するかが決まる。'},
 {title:'信号を遠くへ送る',prompt:'発火条件を満たした。活動電位という電気的な信号が進む、長い部分を選ぼう。',answer:'軸索',options:['樹状突起','軸索','シナプス間隙','核'],hint:'細胞体から長く伸びる通り道。',explain:'軸索（じくさく）は活動電位（膜の電位が急に変化して伝わる信号）を終末へ伝える。'},
 {title:'出口に到着',prompt:'軸索の先端に到着。次の細胞に情報を渡す準備をする部分は？',answer:'軸索終末',options:['細胞体','樹状突起','海馬','軸索終末'],hint:'軸索の終わりにある。',explain:'軸索終末（じくさくしゅうまつ）では、活動電位の到着をきっかけに伝達物質を放出する準備が始まる。'},
 {title:'放出スイッチを入れる',prompt:'典型的な化学シナプスで、終末に流入して伝達物質の放出を引き起こすものは？',answer:'カルシウムイオン',options:['酸素','カルシウムイオン','光','赤血球'],hint:'元素記号はCa。',explain:'カルシウムイオンの流入が、小胞と細胞膜の融合を引き起こし、神経伝達物質が放出される。'},
 {title:'すき間を渡る',prompt:'化学シナプスのすき間を拡散して、次の細胞に情報を伝えるものは？',answer:'神経伝達物質',options:['活動電位そのもの','血液','神経伝達物質','軸索'],hint:'化学物質が橋渡しする。',explain:'神経伝達物質（細胞間で情報を伝える化学物質）がすき間を拡散する。電気信号そのものが飛び越えるわけではない。'},
 {title:'受け取り口に届ける',prompt:'神経伝達物質が結びつく、次の細胞の受け取り口は？',answer:'受容体',options:['受容体','細胞核','海馬','小胞'],hint:'物質を受け取る部分。',explain:'受容体（じゅようたい）は対応する伝達物質と結びつく。次の細胞を発火しやすくする作用も、しにくくする作用もある。'}
];
export const sourceLinks = [
 ['脳の構造と代表的な働き','https://www.brainfacts.org/brain-anatomy-and-function/anatomy/2022/major-brain-landmarks-110822'],
 ['シナプスと神経伝達','https://www.brainfacts.org/brain-anatomy-and-function/cells-and-circuits/2022/synapses-and-neurotransmission-113022'],
 ['記憶のさまざまな側面','https://www.brainfacts.org/thinking-sensing-and-behaving/learning-and-memory/2012/different-facets-of-memory'],
 ['経験によって変わる神経のつながり','https://www.brainfacts.org/brain-anatomy-and-function/cells-and-circuits/2020/making-and-breaking-connections-in-the-brain-111820']
];
export function shuffle<T>(input: readonly T[]): T[] {
 const out=[...input]; for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out;
}
