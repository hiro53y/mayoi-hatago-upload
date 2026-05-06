# 引き継ぎメモ

## 現在の状況

- GitHubアップロード対象は `deliverables/mayoi-hatago-upload`。
- キャラクター、敵、道具、階段は `src/components/DungeonSprite.tsx` の軽量SVGスプライトで表示する。
- 攻撃演出は `GameState.visualEvents` を使い、ログ文字列推測に依存しない。
- PWA用に `public/manifest.webmanifest`、`public/sw.js`、`public/icons/` を含めている。

## 変更内容

- オリジナル2Dスプライトを追加。
- 接触攻撃、敵攻撃、被弾のモーションを強化。
- 攻撃時に `VisualEvent` を発行し、斬撃とヒット表示を確実に出すようにした。
- 接触攻撃時の `VisualEvent` 発火をテストに追加。

## 検証

- `npm run test`: 成功。
- `npm run build`: 成功。
- `dist` の簡易静的配信チェック: `index.html`、manifest、Service Worker、PWAアイコン取得に成功。

## 注意点

- `node_modules/`、`dist/`、`.test-build/` はアップロード不要。`.gitignore` で除外済み。
- 手動アップロードする場合は、上記の生成フォルダをドラッグしない。
- `vite preview` はこのローカルWindows環境で `esbuild spawn EPERM` になる場合があるが、`npm run build` は成功している。
