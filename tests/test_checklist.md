# テストチェックリスト

## 実施済み

- [x] `npm run test`
- [x] `npm run build`
- [x] マップ生成テスト
- [x] 戦闘ダメージテスト
- [x] 敵AIテスト
- [x] セーブ読み込みテスト
- [x] 階層進行、アイテム、装備、クリア判定のゲームフローテスト
- [x] 接触攻撃時のVisualEvent発火テスト
- [x] `dist` 静的配信で `index.html`、manifest、Service Worker、PWAアイコン取得を確認
- [x] タイトル変更後に `npm run test` と `npm run build` が成功
- [x] 静的配信でHTMLタイトル、manifest名、Service Workerキャッシュ名の更新を確認

## 手元で追加確認推奨

- [ ] Cloudflare Pages公開URLをAndroid Chromeで開き、「アプリをインストール」が表示されること
- [ ] 360px幅相当のスマホで操作ボタンが重ならないこと
- [ ] 実機タップで斬撃、敵攻撃、被弾が視認できること
