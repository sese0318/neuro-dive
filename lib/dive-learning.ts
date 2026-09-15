export type LessonId = 'intro' | 'threshold' | 'axon' | 'conduction' | 'synapse' | 'finish';
type Choice = { text: string; feedback: string };
type Lesson = {
  kind: 'guide' | 'check'; stage: 'input' | 'axon' | 'synapse';
  eyebrow: string; title: string; body: string; steps?: string[];
  note: string; button: string; choices?: Choice[]; correct?: number;
};
export const LESSONS: Record<LessonId, Lesson> = {
  intro: {
    kind: 'guide', stage: 'input', eyebrow: 'MISSION 01 · 信号が生まれるまで',
    title: '脳の中で、情報はどう届く？',
    body: 'あなたは小さな探検家。情報をやり取りする細胞、ニューロン（神経細胞）の中を進み、次の細胞へ情報が届く仕組みを観察しよう。',
    steps: ['光る結晶は、ほかの細胞から届く入力の目印。黄色い案内を頼りに近づき、Eか画面のボタンで受け取ろう。', '入力を受け取るたび、膜電位（細胞の内と外の電圧差）が変わる。左下の数字を見よう。', '今回は発火しやすくする入力を3つ集める。発火が始まる境目、閾値に届くと短い電気信号が生まれる。'],
    note: '大きな脳モデルは全体像。歩くステージは1つの細胞の仕組みを拡大した創作空間。あなた自身が電気になるわけではない。',
    button: '入力を受け取りに行く',
  },
  threshold: {
    kind: 'check', stage: 'input', eyebrow: '確かめよう 1 of 3',
    title: 'いま、なぜ信号が生まれた？',
    body: '入力のたびに −70 → −65 → −60 → −55 mV と変化し、発火の扉が開いた。',
    choices: [
      { text: '入力が重なり、膜電位が閾値に達したから', feedback: 'そう。入力の組み合わせで閾値に達すると、活動電位という短い電気信号が生じる。これを発火と呼ぶ。' },
      { text: '脳では必ず3個の入力で発火するから', feedback: '3個はこのゲームの設定。実際には入力の強さや届く時刻、発火を抑える入力も関係する。数字の変化を振り返ってみよう。' },
      { text: '膜電位が −70 mV になったから', feedback: 'この例の −70 mV は入力を受け取る前の値。発火が始まったのは −55 mV の境目に届いたときだよ。' },
    ], correct: 0, note: '入力は実際には弱まるため、永続して貯まるゲージは簡略化。電圧や閾値は細胞によって異なる。', button: '次は信号を伝えよう',
  },
  axon: {
    kind: 'guide', stage: 'axon', eyebrow: 'MISSION 02 · 生まれた信号の行方',
    title: '信号は、途中で弱くならない？',
    body: '軸索は、細胞の遠くの端まで電気信号を伝える長い部分。外側の髄鞘（ずいしょう）は、電気を逃がしにくくする覆いだ。',
    steps: ['覆いの切れ目はランビエ絞輪（こうりん）。黄色い案内を追い、3つの絞輪でEを押して信号の再生を観察しよう。', '光の波と、同じ高さの信号マークに注目。次の絞輪でも活動電位が再び生まれる。', '床の切れ目はSpaceかジャンプボタンで越えよう。'],
    note: '床の穴とジャンプは探検用の仕掛け。実際の軸索はつながっていて、信号の伝導にE操作は必要ない。', button: '信号を追いかける',
  },
  conduction: {
    kind: 'check', stage: 'axon', eyebrow: '確かめよう 2 of 3',
    title: '次の絞輪で、信号の大きさは？',
    body: '3つの絞輪で電気信号が再生され、細胞の端まで届いた。正常に伝わる活動電位を考えよう。',
    choices: [
      { text: '伝わるたびに小さくなる', feedback: '途中で弱まるだけなら遠くまで届けにくい。絞輪では活動電位が再び生まれ、大きさが保たれる。' },
      { text: 'ほぼ同じ大きさに再生される', feedback: 'その通り。覆いの間の絞輪で、ほぼ同じ大きさの活動電位が再生される。この速い伝わり方を跳躍伝導と呼ぶ。' },
      { text: '再生するたびに大きくなる', feedback: '絞輪は信号を際限なく強める装置ではない。活動電位は、発生するかしないかという全か無かの性質を持つ。' },
    ], correct: 1, note: '活動電位の大きさが一定でも、発火の頻度などで情報を表すことができる。', button: '次の細胞へ渡そう',
  },
  synapse: {
    kind: 'guide', stage: 'synapse', eyebrow: 'MISSION 03 · 電気から化学物質へ',
    title: '細胞と細胞のすき間を、どう渡る？',
    body: 'シナプスは細胞どうしの情報の受け渡し場所。ここでは、電気信号をきっかけに化学物質を放出する仕組みを体験する。',
    steps: ['青い装置でE。電気信号の到着でチャネル（イオンの通り道）が開き、カルシウムイオンが細胞の端に入る。', 'ピンクの小胞（物質を包む袋）でE。カルシウムが小胞と細胞膜の融合を促し、中の神経伝達物質が外へ出る。', '伝達物質と同じ形の受容体を探してE。受容体は次の細胞の受け取り口。小胞の袋そのものが渡るわけではない。'],
    note: '形合わせは結びつく相手を選ぶ性質の例え。実際の伝達物質はすき間を拡散する。歩ける橋は観察用。', button: '受け渡しを観察する',
  },
  finish: {
    kind: 'check', stage: 'synapse', eyebrow: '確かめよう 3 of 3',
    title: '受け取った細胞は、必ず発火する？',
    body: '神経伝達物質が、次の細胞の受容体に結びついた。ここで起きたことを考えよう。',
    choices: [
      { text: '形が合えば必ず発火する', feedback: '結びつくことと発火することは別。最初の庭でも、入力を受け取っただけではすぐに発火しなかったね。' },
      { text: '発火しやすくする物質なら、1回で必ず発火する', feedback: '発火しやすいことは、必ず発火することではない。ほかの入力も合わせて、閾値に達する必要がある。' },
      { text: '必ずではなく、入力の組み合わせ次第', feedback: '正解。受容体などによって発火しやすくも、しにくくもなる。次の細胞も入力を組み合わせている。旅の始まりにつながったね。' },
    ], correct: 2, note: '発火しやすくする作用を興奮性、しにくくする作用を抑制性と呼ぶ。抑制性も正常な情報のやり取り。', button: '探検を振り返る',
  },
};
export const LEARNING_SOURCES = [
  { title: 'BrainFacts · 活動電位と跳躍伝導', url: 'https://www.brainfacts.org/brain-anatomy-and-function/cells-and-circuits/2020/the-action-potential-the-brains-most-efficient-game-of-telephone-101220' },
  { title: 'Neuroscience · カルシウムと伝達物質の放出', url: 'https://www.ncbi.nlm.nih.gov/books/NBK11125/' },
  { title: 'Neuroscience · 興奮性と抑制性の入力', url: 'https://www.ncbi.nlm.nih.gov/books/NBK11117/' },
];
