# 引き継ぎメモ

## 2.1（2026-10-15、Claude）：店の作り直し＋不思議のダンジョンらしさ＋難易度調整

- ユーザー依頼：店の品は「拾う」ボタンで拾う／逃げたら店主が等速で追う／店主は次の階まで来ない（以後の階の店は普通に営業＝ユーザー確認）／番人は不要／店の階につるはしと掘削の杖を1つずつ／店に敵が入らない／ほかの機能も色々・難易度調整・デバッグ。
- 店：`effects.ts pickUp` で店の品を自動で拾わない。`ai.ts free()` で店主・仲間以外は外から店の部屋に入れない（中に押し込まれた敵は外を目指す）。番人（guard）は定義ごと削除。2.0のセーブに残る番人は `save.ts deserializeRun` で取り除いて読む。
- 宿場：`run.ts isTownFloor`（本編10・20、深層30・60・90）、`mapgen.ts townFloor`。宿の人は role 'npc'（`npc`: inn/bank/seer）。話しかけると `prompt.kind='npc'`、行動は `{t:'npc'}`。倉庫番に預けた物は `run.deposit`／`depositGold` に入り、`meta.finishRun` でどの終わり方でも村に届く。
- 化け狸：寝て出た `tanuki2/3` に `disguise`（道具ID）。隣に来る・叩かれると正体を現す。
- 新しい道具：`s_nekiri`（`run.banned` に入れ、以後の出現から除く）、`s_bakuretsu`、`t_migawari`（`st.decoy`）、`g_sugata`（`player.st.hidden`）。火の通り道は `combat.ts scorch`。
- 画面：`ui/Panels.tsx`（宿場の会話・状態・タップで調べる・値段の候補）。描画に階の題字・揺れ・化け狸。
- 難易度の調整：プレイヤーの攻撃力の伸び、敵のHP・攻撃・防御の伸びを少し下げ、経験値1.6倍、食べ物を増やし、満腹度の減りを0.085/ターンに。黒影・闇影の倍速をやめ、化け猫は等速の2回攻撃、壁の中の影も隣なら叩ける。河童の投石と餓鬼の空腹を弱め、ボスの呼ぶ配下を減らした。
- 検証：`npm run test` 63件、`FUZZ_RUNS=250` の総当たり、上手なボットで集計（本編の中央値11・上位10%で14階、毎日の挑戦は中央値7・踏破8%、深層は中央値8）、内蔵ブラウザで宿場・店・状態・調べる・自動プレイを確認。
- 未検証：Pixel 実機での手応え、人が本編を通しで遊んだ時の後半の難易度（ボットは後半の道具の使い方が下手なので、後半は実際より厳しく出ている可能性がある）。

---

## 2.0（2026-10-14、Claude）：風来系ローグライクとして全面作り直し

- ユーザー依頼：「シレンのような超面白い不思議なダンジョン系に作り直す。バグチェックも行い完璧に」。追加依頼：店（払わずに出ると店主が追う）・壁を壊せる道具。
- ユーザーの選択：今の画像を活かして足す／本編30階＋深層99階／拠点の村と倉庫・仲間・毎日の挑戦・図鑑＋おまかせ／同じURL・同じ名前。
- 旧 `src/game`・`src/components`・旧テストは削除し、`src/engine`（純粋なTS）・`src/content`・`src/render`（Canvas）・`src/ui`・`src/art`・`src/audio` に作り直した。旧版は git の履歴（2153837）に残っている。
- 絵：GPT生成の15枚を `scripts/prepare-sprites.py` で `public/assets/sprites/v2/` に192pxで整え、罠3種は元のスプライトシートから切り出した。足りない敵9系統・店主・番人・ボス・杖・壺・矢・お金・罠はSVGで描き足し、読み込み時に陰影と質感を重ねて元の絵に寄せた。色違いは色相の回転。
- 店：拾って出口へ→代金の確認（払う／やめる／払わずに逃げる）。逃げる・ワープ等で出ると泥棒（店主が怒って倍速で追う＋番人3体、以後の階にも番人）。店主は入口の正面に立たない（すれ違える）。
- 壁：つるはし（印「掘」）、掘削の杖（10マス）。
- PWA：manifest の id・start_url・scope・名前は変えていない（Pixel のインストール済みアプリと APP HUB の起動方法はそのまま）。`sw.js` のキャッシュ名を更新。
- 保存は `fdm2:run`・`fdm2:meta`。1.0のデータは読まない。
- 検証：`npm run test`（48件。地図2,000通り、自動プレイの総当たり）、`FUZZ_RUNS=300` の総当たり、上手なボットで難易度を集計、`npm run build`、本番ビルドを vite preview で起動。
- 難易度の目安（上手なボット150回）：到達階の中央値6、上位10%で10階。人間はもっと進める想定だが、実際の手応えはユーザーの確認待ち。
- 未検証：Pixel 実機での操作感・BGM・インストール済みアプリの更新、本編30階を人が通しで遊んだ時の難易度。

---


## 現在の状況

- GitHubアップロード対象は `deliverables/mayoi-hatago-upload`。
- キャラクター、敵、道具、階段は `public/assets/sprites/` の透過PNGを `src/components/DungeonSprite.tsx` から表示する。
- BGMは `public/assets/bgm/` に `title.mp3`、`floor-01.mp3`〜`floor-10.mp3` を置くと再生される。
- 攻撃演出は `GameState.visualEvents` を使い、ログ文字列推測に依存しない。
- PWA用に `public/manifest.webmanifest`、`public/sw.js`、`public/icons/` を含めている。

## 変更内容

- ゲームタイトルを `不思議なダンジョンもどき` に統一。
- HTMLタイトル、PWA manifest、Service Workerキャッシュ名、localStorageキー、README、仕様メモ、Wrangler設定を更新。
- ゲーム画面を、上部HUD、青いミニマップ、下部メッセージ枠を持つレトロRPG風レイアウトに変更。
- 床、壁、階段を角丸タイルではなく、低解像度風の草地/木立/木段テクスチャに変更。
- 旅人、敵、道具、階段の表示をドット絵風SVGスプライトに差し替え。
- 連続する同一ログを `×回数` で圧縮するように変更。
- 壁衝突は移動、ターン、満腹度、敵行動を発生させない仕様を回帰テストで固定。
- 装備変更/解除は確認・管理操作として満腹度を消費しない仕様に変更。
- スマホ縦画面でプレイ画面と操作盤が上下に離れすぎないよう、ゲーム画面のグリッドを `auto auto` に変更。
- 各階に `floorTheme` と `miniObjective` を追加し、HUDに階層テーマと小目標の進捗を表示。
- 2階以降に `絡み泥`、`腹減らし床`、`呼び鈴床` の罠を配置し、発見済み罠はマップ/ミニマップに表示。
- 回復系の一部、札、補助道具を未識別状態で拾うように変更し、使用時に正体をログ表示。
- 装備特性を追加。短刀は命中補正、太刀は獣系に有利、槍は1マス先まで攻撃、笠は罠発見、傘は被ダメージ軽減。
- 9階到達時に10階直前のボス前イベントログを表示。
- オリジナル2Dスプライトを追加。
- 接触攻撃、敵攻撃、被弾のモーションを強化。
- 攻撃時に `VisualEvent` を発行し、斬撃とヒット表示を確実に出すようにした。
- 接触攻撃時の `VisualEvent` 発火をテストに追加。
- GPT image 2.0で生成した4 x 4スプライトシートを `public/assets/sprites/` に保存し、クロマキー除去後に16個の透過PNGへ切り出した。
- `DungeonSprite.tsx` をSVG矩形描画からPNG参照へ変更し、操作キャラクター上下の黒線が出ない表示に変更。
- GPT image 2.0で操作キャラクターの上下左右4方向スプライトを追加生成し、`player-down/right/up/left.png` として保存。
- 操作キャラクターは `state.player.facing` に応じて画像を切り替えるよう変更。
- 敵キャラクターはプレイヤーが敵の右側にいるとき `enemy-facing-right` で左右反転するよう変更。
- プレイヤー下側の黒線対策として、下端に不透明ピクセルのない新規透過PNGへ差し替え、プレイヤーだけ下方向ドロップシャドウを使わないCSSへ変更。
- 添付確認後、変更前の低頭身キャラクターに寄せた4方向スプライトをGPT image 2.0で再生成し直した。
- スプライト上に黒い横線が重なる原因になっていた `.playfield::after` のスキャンライン風オーバーレイを無効化した。
- `VisualEvent.damage` を追加し、攻撃ヒット時に火花エフェクトとダメージ数値を表示するようにした。
- `src/game/sound.ts` を追加し、プレイヤー攻撃ヒット時に短い斬撃SEをWeb Audioで鳴らすようにした。
- 黒線再発対策として、プレイヤータイルを独立レイヤー化し、`overflow:hidden` で周囲の黒いマップ行がスプライト透過部分へ透けないようにした。
- 黒線再発対策として、プレイヤースプライトの下方向ドロップシャドウを完全に外し、上下方向にはみ出す量を抑えた。
- スマホPWA側に古いスプライト/CSSが残る可能性を潰すため、スプライトURLに `?v=20260516-linefix` を付け、Service Workerを `fushigina-dungeon-modoki-v4` に更新。`/assets/sprites/` はnetwork-firstに変更。
- BGM hook `src/game/bgm.ts` を追加し、タイトル画面と各階層でmp3が存在する場合だけループ再生するようにした。
- BGM配置手順を `README.md` と `public/assets/bgm/README.md` に追記。
- スマホ縦画面でゲーム全体が上に詰まりすぎないよう、`.game-screen` の配置を中央寄せに調整。
- Service Workerキャッシュ名を `fushigina-dungeon-modoki-v2` に更新。

## 検証

- `npm run test`: 成功。
- `npm run build`: 成功。
- 面白さ改善後の `npm run test`: 成功（5 test groups passed）。
- 面白さ改善後の `npm run build`: 成功。
- `dist` 簡易HTTP配信チェック: HTTP 200、`id="root"` を確認。
- `dist` の簡易静的配信チェック: `index.html`、manifest、Service Worker、PWAアイコン取得に成功。
- UI改修後の静的配信チェック: CSSに `playfield`、`mini-map`、`art-sprite` が含まれることを確認。
- 今回改修後の `npm run test`: 成功（5 test groups passed）。
- 今回改修後の `npx tsc -b`: 成功。
- 4方向プレイヤー画像の透過確認: `player-down/right/up/left.png` の左上alphaが0、下端8行に不透明ピクセルなし。
- 低頭身スプライト再生成後の `npm run test`: 成功（5 test groups passed）。
- 低頭身スプライト再生成後の `npx tsc -b`: 成功。
- 再生成4方向プレイヤー画像の透過確認: `player-down/right/up/left.png` の左上alphaが0、下端10行に不透明ピクセルなし。
- 黒線再発対策後の `npm run test`: 成功（5 test groups passed）。
- 黒線再発対策後の `npx tsc -b`: 成功。
- 代表スプライトの透過確認: `player.png`、`enemy-tanuki.png`、`item-food.png`、`stairs.png`、`trap-set.png` の左上alphaが0。
- `npm run build` と `npm run dev` はこのローカルWindows環境で既知の `esbuild spawn EPERM` によりVite設定ロード時に失敗。
- ログ/満腹度/UI調整後の `npm run test` と `npm run build`: 成功。
- CSS静的チェック: `log-repeat`、`grid-template-rows:auto auto`、低身長画面向けレイアウト、ログ高さ制限の反映を確認。

## 注意点

- `node_modules/`、`dist/`、`.test-build/` はアップロード不要。`.gitignore` で除外済み。
- 手動アップロードする場合は、上記の生成フォルダをドラッグしない。
- `vite preview` はこのローカルWindows環境で `esbuild spawn EPERM` になる場合があるが、`npm run build` は成功している。
- 今回も Vite系コマンドは `spawn EPERM` で起動不可。Cloudflare Pages側では通常の `npm run build` 設定を維持。
- BGM mp3はまだ未配置。ユーザーが `public/assets/bgm/` に指定ファイル名で追加する必要がある。
