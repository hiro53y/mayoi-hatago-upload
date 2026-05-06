# 引き継ぎメモ

更新時点: 2026-05-06 JST

## 現在の状況

「迷宮旅籠 - Mayoi Hatago -」の初期完成版を実装済み。React + TypeScript + Vite の静的サイトとして、Cloudflare Pages に `npm run build` / `dist` で公開できる。

## 変更内容

- Vite/React/TypeScript 基盤を追加
- `src/game/` にゲームロジックを分離
- CSS Grid によるスマホ向けダンジョン表示を追加
- ターン制、敵AI、戦闘、経験値、レベルアップを実装
- アイテム、装備、空腹、毒、目くらまし、補助状態を実装
- 10階到達クリア、ゲームオーバー、リザルトを実装
- localStorage の進行セーブと記録保存を実装
- README、Cloudflare Pages手順、`public/_redirects`、`wrangler.toml`を追加
- 軽量テストランナーとテストを追加
- `deliverables/mayoi-hatago/` に自己完結型パッケージを作成し、パッケージ内でも `npm install` / `npm run test` / `npm run build` を確認
- スマホ旧環境で `structuredClone` がない場合でも操作できるよう、ゲーム状態コピーをJSONベースに変更
- 敵のランダム移動が境界外座標を候補にできる書き方を修正
- 敵AIの境界外移動回帰テストを追加
- GitHubアップロード不要な `out/`、`deliverables/`、`.claude/` を `.gitignore` に追加
- `deliverables/mayoi-hatago` 内の壊れた `.git` はACLのDENYによりこの環境から削除不能だったため、生成物を含まないアップロード用コピー `deliverables/mayoi-hatago-upload` を作成

## 未完了

- ブラウザ実機での長時間バランス確認は未実施
- iOS Safari / Android Chrome 実機確認は未実施
- 将来拡張の罠、店、未識別、合成、倉庫、ランキング、PWAは未実装
- `deliverables/mayoi-hatago` の壊れた `.git` はこの環境では削除不能。GitHubへは `deliverables/mayoi-hatago-upload` を使う

## 次にやること

1. 実機スマホで360px前後の操作性を確認する
2. 1プレイ5〜15分に収まるよう敵数・食料量・経験値を微調整する
3. GitHubへアップロードする場合は `deliverables/mayoi-hatago-upload` の中身をリポジトリ直下として使う
4. 必要なら Canvas 描画へ切り替えられるよう `DungeonView` の描画境界をさらに整理する

## 注意点

- 既存作品の固有名詞・素材・UIコピーは採用しない方針
- 進行データはゲームオーバー/クリアで削除、記録データは保持
- テストは Vitest ではなく `npm run test` の独自ランナーを使う
- `deliverables/mayoi-hatago/node_modules` はパッケージ検証時に生成された依存フォルダ。Git管理対象外
