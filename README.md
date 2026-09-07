# NEURO ARCADE と NEURO DIVE

NeuroLabの脳科学入門ゲーム。脳の地図、シグナル・リレー、記憶のペアの3モードを、時間制限なしで遊べる。

[NEURO DIVE 一人称3D版](http://localhost:3217/dive) では、入力を集めて発火し、軸索を進んで次の神経細胞へ信号を届ける。樹状突起の庭、軸索の回廊、シナプスの岸の3エリアがある、約5分の探索アクション。

## 起動

WindowsのPowerShellで、このフォルダを開く。

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 3217
```

ブラウザーで http://localhost:3217/ を開く。止めるときはサーバーを起動したターミナルで Ctrl+C。

## 遊び方

① モードを選び、下見してから開始する。
② 地図は部位をクリック、信号は次の部品を選択、カードは部位と働きをそろえる。
③ 間違えても続行できる。地図の誤答は2問先を目安に、別の場面として再出題する。終盤は残り問題の後に回す。
④ 結果画面でXPとクリア回数を保存する。途中のプレイは保存しない。

同じブラウザー、同じURLで記録が残る。公開版とローカル版は別の記録になる。効果音は毎回オフから開始する。

## 3D版の遊び方

* WASDで移動、マウスで見回す。マウス固定に対応しないブラウザーでは画面のドラッグで見回せる。
* Spaceでジャンプ、Shiftを押しながら移動すると走る。Eで近くの対象を操作。
* Escで一時停止。画面の外にフォーカスが移ったときも停止する。
* 小さな画面では方向ボタンを押し続けて移動し、ジャンプと接続のボタンを使う。
* 光る入力を3つ回収して発火し、絞輪を順に接続する。床の切れ目は移動しながらジャンプする。
* 終末でカルシウムを流入させ、小胞から伝達物質を放出し、対応する形の受容体に届ける。
* 落下すると直前のチェックポイントへ戻り、25 XPを失う。入力、接続、カプセルの進捗は残る。
* 記憶カプセルは1個50 XP。回収時に解説が表示され、探索ノートで全体の仕組みを復習できる。

視点の揺れと自動カメラ移動はない。クリア回数と最高得点だけを `neurolab-dive-v1` に保存し、プレイ途中の位置は保存しない。3D版の記録は2D版と別。

## 3D版の実装とモデル

* `app/dive/` が一人称ゲームの画面。
* `lib/dive-engine.ts` がThree.jsの描画、操作、音、3Dモデル読み込み。
* `lib/dive-state.ts` が衝突、ジャンプ、ゲート、得点、ミッションの進行。
* `test/dive-state.test.mjs` が進行と物理の回帰テスト。
* `public/models/hra-brain.glb` がHuman Reference Atlasの脳モデル。
* `public/models/ATTRIBUTION.md` がモデルの出典と変更内容。

脳は [Human Reference Atlasの解剖学モデル](https://doi.org/10.48539/HBM929.XKCL.339) を使用。細胞の回廊、髄鞘、収集物、受容体などはゲーム用に形状を生成している。細胞の大きさ、移動距離、膜電位ゲージ、不応期、形合わせは教育用の簡略化で、実測のシミュレーションではない。3Dモデルの初回読み込みは約12 MB。

WebMCPには公開UIと同じ操作だけを登録している。移動は最大2秒の実際の移動入力で、`jump: true` はSpaceと移動の同時入力に相当し、座標の書き換えは行わない。

## 内容と出典

6部位は前頭葉、頭頂葉、側頭葉、後頭葉、小脳、海馬。地図のシナリオは12種類あり、通常の1回では部位ごとに1問、合計6問を選ぶ。
信号は7ステップ。入力の統合、軸索を進む活動電位、典型的な化学シナプスでのカルシウム流入、伝達物質と受容体を扱う。
カードは6ペア、12枚。

複数部位の協働を前提にした教育用モデルで、解剖学的な精密図ではない。海馬は側頭葉の内側として別枠に表示する。ポイントは知識ゲームの得点で、脳機能の測定結果ではない。

[脳の構造](https://www.brainfacts.org/brain-anatomy-and-function/anatomy/2022/major-brain-landmarks-110822)
[シナプスと神経伝達](https://www.brainfacts.org/brain-anatomy-and-function/cells-and-circuits/2022/synapses-and-neurotransmission-113022)
[記憶](https://www.brainfacts.org/thinking-sensing-and-behaving/learning-and-memory/2012/different-facets-of-memory)
[神経のつながりの変化](https://www.brainfacts.org/brain-anatomy-and-function/cells-and-circuits/2020/making-and-breaking-connections-in-the-brain-111820)

## 実装

* app/page.tsx がゲーム進行、得点、保存。
* lib/game-data.ts が問題、解説、出典。
* app/brain-map.tsx が操作可能な脳の模式図。
* app/globals.css がテーマとレスポンシブ表示。
* .openai/hosting.json がSitesの保存先と静的ファイルの場所。
* localStorageの neurolab-arcade-v1 に端末内の記録を保存。

既存のNeuroLab本体と同じプロジェクトに属する独立した入門編。既存アプリの学習記録とは同期しない。

## 検証

2026-09-07に実施。

* npm.cmd run build 成功、静的出力は dist/client。
* npx.cmd tsc --noEmit 成功。
* ブラウザーで3モードを完了し、誤答、復習、ヒント得点、キーボード回答、リロード後の保存を確認。
* 390pxのスマホ幅でカードを全ペア完了。横方向のはみ出しなし。
* コンソールの警告とエラーは検出されず。
* WebMCPの状態取得、モード選択、不正入力の拒否を確認。

3D版もブラウザーで入力回収から受容体への接続まで走破。2か所のジャンプ、誤った受容体での継続、1300 XPでのクリア、リロード後の記録保存、探索ノートを確認した。390px幅でドラッグ、画面ボタン、カプセルの解説を確認し、キーボードの移動とEsc停止も確認。ブラウザーの警告とエラーは検出されず。

```powershell
node --experimental-strip-types --test test/dive-state.test.mjs
```

9件すべて成功。発火条件、順序、不応期、落下復帰、ジャンプ、一時停止、化学伝達、床下からの操作禁止、近い受容体の選択、カプセルの説明と重複得点を検証する。

現在はローカルで遊べる。Sitesの外部公開は未実施。
