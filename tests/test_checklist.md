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
- [x] UI改修後に `npm run test` と `npm run build` が成功
- [x] 静的配信で `playfield`、`mini-map`、`art-sprite` のCSS反映を確認
- [x] GPT image 2.0生成PNGスプライト16点が `public/assets/sprites/` に存在することを確認
- [x] 代表スプライトの左上ピクセルが透過で、背景の黒線・クロマキーが残っていないことを確認
- [x] `public/assets/bgm/README.md` にタイトル/1〜10階のmp3命名規則があることを確認
- [x] `npm run test` 成功（5 test groups passed）
- [x] `npx tsc -b` 成功
- [x] BGM hook、PNGスプライト参照、Service Worker v2の静的反映を `rg` で確認
- [x] 壁に連続でぶつかっても満腹度、HP、ターンが変わらないことをテスト
- [x] 壁衝突ログが `count` で圧縮されることをテスト
- [x] 通常移動、攻撃、待機、階段で満腹度が1減ることをテスト
- [x] 装備変更で満腹度が減らないことをテスト
- [x] スマホ縦画面向けCSSの行間圧縮、操作盤寄せ、ログ高さ制限の反映を静的確認

## 手元で追加確認推奨

- [ ] Cloudflare Pages公開URLをAndroid Chromeで開き、「アプリをインストール」が表示されること
- [ ] 360px幅相当のスマホで操作ボタンが重ならないこと
- [ ] 実機タップで斬撃、敵攻撃、被弾が視認できること
- [ ] 実際のmp3配置後、タイトル/各階層でBGMが切り替わること
