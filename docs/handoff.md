# 引き継ぎメモ

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
