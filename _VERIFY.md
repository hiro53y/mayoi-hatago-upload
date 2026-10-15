# 検証ログ

- 検証日：2026-10-15（JST）／Codex、Windows、Node.js・Vite・Vitest。
- 対象：不思議なダンジョンもどき v2.2。
- 起動：npm run dev / npm run build / npm run preview。
- テスト：88件成功、2件スキップ、終了コード0。型チェック・本番ビルド成功。
- UI：設定、バックアップ書き出し・復元、出発、移動・攻撃・道具、中断再開をローカルで確認。
- 新画像30点の透過・縮小表示、既存21PNGのハッシュ維持を確認。
- 未検証：Pixel 9a実機、インストール済みPWA更新、人による全階層の通しプレイ。
- 公開確認：2026-10-16、既存URLでv2.2表示とブラウザーのエラー0件を確認。55ファイル（JS/CSS/SW/manifest＋新30PNG＋既存21PNG）のSHA-256が本番ビルドと一致。
- 実装コミット：287adbafef9b5208c2df4bad001c03987458d99e。検証記録はtests/test_checklist.md。
