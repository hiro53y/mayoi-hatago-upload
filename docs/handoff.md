# 引き継ぎメモ

## 現在の状況

- GitHubアップロード対象は `deliverables/mayoi-hatago-upload`。
- キャラクター、敵、道具、階段は `src/components/DungeonSprite.tsx` の軽量SVGスプライトで表示する。
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
- オリジナル2Dスプライトを追加。
- 接触攻撃、敵攻撃、被弾のモーションを強化。
- 攻撃時に `VisualEvent` を発行し、斬撃とヒット表示を確実に出すようにした。
- 接触攻撃時の `VisualEvent` 発火をテストに追加。

## 検証

- `npm run test`: 成功。
- `npm run build`: 成功。
- `dist` の簡易静的配信チェック: `index.html`、manifest、Service Worker、PWAアイコン取得に成功。
- UI改修後の静的配信チェック: CSSに `playfield`、`mini-map`、`pixel-sprite` が含まれることを確認。
- ログ/満腹度/UI調整後の `npm run test` と `npm run build`: 成功。
- CSS静的チェック: `log-repeat`、`grid-template-rows:auto auto`、低身長画面向けレイアウト、ログ高さ制限の反映を確認。

## 注意点

- `node_modules/`、`dist/`、`.test-build/` はアップロード不要。`.gitignore` で除外済み。
- 手動アップロードする場合は、上記の生成フォルダをドラッグしない。
- `vite preview` はこのローカルWindows環境で `esbuild spawn EPERM` になる場合があるが、`npm run build` は成功している。
