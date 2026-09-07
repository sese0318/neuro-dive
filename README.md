# NEURO ARCADE

NeuroLabの脳科学入門ゲーム。脳の地図、シグナル・リレー、記憶のペアの3モードを、時間制限なしで遊べる。

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
