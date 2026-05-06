# テストチェックリスト

検証時点: 2026-05-06 JST

## 自動確認

- [x] `npm install`
- [x] `npm run test`（5 test groups passed）
- [x] `npm run build`
- [x] `dist/` 簡易HTTP配信でトップページ HTTP 200
- [x] `deliverables/mayoi-hatago/` 内で `npm install`
- [x] `deliverables/mayoi-hatago/` 内で `npm run test`
- [x] `deliverables/mayoi-hatago/` 内で `npm run build`
- [x] `deliverables/mayoi-hatago-upload/` を生成物なしのGitHubアップロード用フォルダとして作成
- [x] `deliverables/mayoi-hatago-upload/` で `npm ci --dry-run`
- [ ] `git init -b main`（`.git/config` 書き込み権限エラーで未完了）

## `npm run test` の確認範囲

- [x] mapGenerator が24 x 24のマップを作る
- [x] mapGenerator が到達可能な階段を置く
- [x] combat のダメージが最低1以上になる
- [x] combat の命中率境界が動く
- [x] save/load が壊れた記録データでもクラッシュしない
- [x] saveProgress / loadProgress / clearProgress が動く
- [x] gameFlow が移動、壁判定、拾得、装備、食料使用、階段、10階クリア、接触戦闘を確認する
- [x] enemyAI が境界外へ移動しないことを確認する
- [x] `structuredClone` 依存をゲーム操作から除去した

## 実装・自動確認済み項目

- [x] 新規ゲーム開始できる
- [x] プレイヤーが移動できる
- [x] 壁を通れない
- [x] 敵を攻撃できる
- [x] 敵が行動する
- [x] アイテムを拾える
- [x] アイテムを使用できる
- [x] 装備できる
- [x] 満腹度が減る
- [x] 階段で次階層に進める
- [x] 10階到達でクリアするロジックがある
- [x] セーブできる
- [x] 続きから再開できる
- [x] Cloudflare Pages用の`public/_redirects`がある
- [x] GitHubアップロード不要な `node_modules/`、`dist/`、`.test-build/`、`out/`、`deliverables/`、`.claude/` を `.gitignore` で除外

## 未確認

- [ ] in-app browserでの画面確認（ローカルURLアクセスが安全ポリシーで停止）
- [ ] iPhone Safari 実機での長時間プレイ
- [ ] Android Chrome 実機での長時間プレイ
- [ ] Cloudflare Pages 本番URLでの実デプロイ確認
