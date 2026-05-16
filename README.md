# 不思議なダンジョンもどき - Fushigina Dungeon Modoki -

このフォルダ `deliverables/mayoi-hatago-upload` が、GitHub にアップロードするリポジトリ本体です。GitHub / Cloudflare Pages では、このフォルダの中身をリポジトリ直下として扱ってください。

## 概要

不思議なダンジョンもどきは、スマホ縦画面を最優先にした和風ターン制ダンジョンローグライクです。React + TypeScript + Vite の静的サイトとして実装しており、GitHub に push すれば Cloudflare Pages の標準的な Git 連携で公開できます。

既存作品の固有名称、キャラクター、敵名、アイテム名、地名、UI配置、台詞、画像、音楽、効果音、ストーリー設定は使用していません。ゲームシステム上の一般的なローグライク要素を、オリジナル名称と独自UIで構成しています。

## 特徴

- ターン制、グリッド移動、接触戦闘
- GPT image 2.0で生成したオリジナル手描き風スプライトでキャラクター、敵、道具、階段を表示
- 操作キャラクターは上下左右の向きに応じてスプライトを切り替え、敵は左右方向を反転表示
- 攻撃、被弾、階段に短いモーション演出
- 攻撃ヒット時に火花エフェクト、ダメージ数値、斬撃SEを表示/再生
- 24 x 24 のランダム生成ダンジョン
- seed 対応の乱数生成
- 部屋と通路、到達可能な階段の保証
- プレイヤー中心の視界、探索済み・未探索表示
- 敵AIの追跡、ランダム移動、特殊攻撃
- アイテム収集、使用、装備、捨てる
- 階層テーマ、小目標、罠、未識別道具、装備特性
- 空腹、毒、目くらまし、補助状態
- 9階のボス前イベント、9階から階段を降りると10階到達クリア
- 行動ごとの localStorage 自動セーブ
- ゲームオーバー時は進行削除、記録は保持
- スマホ向け十字キーとPC向けキーボード操作
- 斬撃、敵攻撃、被弾が分かる短いモーション演出
- タイトル画面と1〜10階のBGMを `public/assets/bgm/` のmp3差し替えで変更可能
- PWA対応。Chromeの「ホーム画面に追加」ではなく、条件を満たす環境ではアプリとしてインストール可能

## 操作方法

### スマホ操作

| 操作 | 内容 |
|---|---|
| 十字キー | 移動。敵がいる方向へ進むと攻撃 |
| 待 | 足踏み。敵が近くにいなければ少し自然回復 |
| 攻撃 | 現在向いている方向へ攻撃/決定 |
| 階段 | 階段上で次の階層へ進む |
| 道具 | インベントリを開く |
| 装備 | 装備パネルを開く |
| ？ | 遊び方 |
| メニュー | タイトルへ戻る確認 |

### PC操作

| キー | 内容 |
|---|---|
| 矢印キー / WASD | 移動 |
| Space | 足踏み |
| I | インベントリ |
| E | 装備 |
| G または > | 階段を降りる |
| Enter | 決定相当の待機 |
| Escape | 閉じる / メニュー |
| ? | ヘルプ |

## 開発環境

検証時点: 2026-05-06 JST

| 項目 | 値 |
|---|---|
| Node.js | v24.14.0 で確認 |
| npm | v11.9.0 で確認 |
| フレームワーク | React / Vite |
| 言語 | TypeScript |
| 保存 | localStorage |
| 公開 | Cloudflare Pages 静的サイト |

## インストール方法

```bash
npm install
```

## ローカル起動方法

```bash
npm run dev
```

Windows では `start_dev.bat`、macOS/Linux では `start_dev.sh` でも起動できます。

## ビルド方法

```bash
npm run build
```

ビルド成果物は `dist/` に出力されます。

## テスト方法

```bash
npm run test
```

Vite/Vitest 非依存の軽量テストランナーで、以下を検証します。

- マップ生成: 階段到達可能、24 x 24、部屋数
- 戦闘: ダメージ最低1、命中率境界
- セーブ: 壊れたデータの安全読み込み、保存/削除

## BGM差し替え方法

mp3ファイルはリポジトリ内の `public/assets/bgm/` に保存してください。このフォルダ外のゲームデータには依存しません。

| 画面 | ファイル名 |
|---|---|
| タイトル | `title.mp3` |
| 1階 | `floor-01.mp3` |
| 2階 | `floor-02.mp3` |
| 3階 | `floor-03.mp3` |
| 4階 | `floor-04.mp3` |
| 5階 | `floor-05.mp3` |
| 6階 | `floor-06.mp3` |
| 7階 | `floor-07.mp3` |
| 8階 | `floor-08.mp3` |
| 9階 | `floor-09.mp3` |
| 10階 | `floor-10.mp3` |

存在しないmp3は再生されません。スマホブラウザでは自動再生制限により、初回タップやキー入力後にBGMが始まる場合があります。

## Cloudflare Pages デプロイ方法

### GitHubにアップロードするファイル

Cloudflare Pages の Git連携で公開する場合は、リポジトリ直下に以下をアップロードします。

| アップロード | 内容 |
|---|---|
| `src/` | ゲーム本体のReact/TypeScriptコード |
| `public/` | Cloudflare Pages用 `_redirects`、PWA manifest、Service Worker、アイコン、スプライト、BGM配置フォルダ |
| `scripts/` | テスト補助スクリプト |
| `index.html` | ViteのHTMLエントリ |
| `package.json` / `package-lock.json` | 依存関係とnpm scripts |
| `tsconfig*.json` | TypeScript設定 |
| `vite.config.mjs` | Vite設定 |
| `wrangler.toml` | Pages向け補助設定 |
| `README.md` | セットアップ、操作、デプロイ手順 |
| `TASKS.md` / `docs/` / `tests/` | 管理・検証メモ |
| `start_*.bat` / `start_*.sh` | ローカル起動補助 |

以下はアップロード不要です。`.gitignore` で除外しています。

| アップロード不要 | 理由 |
|---|---|
| `node_modules/` | `npm install` で復元する依存フォルダ |
| `dist/` | `npm run build` でCloudflare Pages側が生成 |
| `.test-build/` | `npm run test` の中間生成物 |
| `out/` | ログ・中間出力 |
| `.git/` | Gitの内部管理フォルダ |

1. GitHubにリポジトリを作成する
2. コードをpushする
3. Cloudflareダッシュボードを開く
4. Workers & Pages を開く
5. Pages を作成する
6. GitHubリポジトリを接続する
7. Framework preset に React / Vite 相当を選択する
8. Build command に `npm run build` を指定する
9. Build output directory に `dist` を指定する
10. Deploy を実行する
11. 公開URLで動作確認する

### Cloudflare Pages 設定値

| 項目 | 値 |
|---|---|
| Framework preset | React / Vite 相当 |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Environment variables | 通常は不要。必要な場合のみ `NODE_VERSION=22.16.0` |
| Node.js version | `.node-version` で `22.16.0` を指定 |

`public/_redirects` に `/* /index.html 200` を配置しています。現状は React Router を使わず App 内の screen state で画面を切り替えていますが、将来SPAルーティングを追加しても直URLで404になりにくい構成です。

## PWAインストールについて

ChromeでPWAとしてインストールできるよう、以下を実装しています。

- `public/manifest.webmanifest`
- `public/sw.js`
- `start_url: /`
- `display: standalone`
- 192px / 512px / maskable 512px のPNGアイコンをビルド時に生成
- HTTPS配信前提のService Worker fetch handler

Cloudflare Pagesの公開URLはHTTPSになるため、デプロイ後にChromeで開くとインストール条件を満たします。初回アクセス直後に出ない場合は、数十秒操作してからChromeメニューの「アプリをインストール」を確認してください。

## ディレクトリ構成

```text
src/
  main.tsx
  App.tsx
  game/
    types.ts
    constants.ts
    balance.ts
    rng.ts
    mapGenerator.ts
    pathfinding.ts
    gameState.ts
    actions.ts
    combat.ts
    enemyAI.ts
    items.ts
    equipment.ts
    statusEffects.ts
    save.ts
    score.ts
  components/
    TitleScreen.tsx
    GameScreen.tsx
    DungeonView.tsx
    StatusBar.tsx
    MobileControls.tsx
    InventoryModal.tsx
    EquipmentPanel.tsx
    LogPanel.tsx
    ResultScreen.tsx
    HelpModal.tsx
    ConfirmDialog.tsx
    RecordsScreen.tsx
  styles/
    global.css
  tests/
    mapGenerator.test.ts
    combat.test.ts
    save.test.ts
public/
  _redirects
  assets/
    bgm/
      title.mp3
      floor-01.mp3 ... floor-10.mp3
    sprites/
      *.png
vite.config.mjs
wrangler.toml
```

## ゲーム仕様

| 項目 | 内容 |
|---|---|
| クリア条件 | 10階到達 |
| 初期HP | 30 |
| 初期攻撃/防御 | 6 / 2 |
| 初期満腹度 | 100 |
| インベントリ上限 | 12 |
| 1ターン | プレイヤー行動、満腹度消費、敵行動、状態処理、死亡判定、自動セーブ |
| 敵 | 迷い狸、草陰狐、土くれ武者、灯り鬼火、腹ぺこ河童、錆び鎧、影法師 |
| アイテム | 薬草、食料、札、香、武器、防具 |
| 罠 | 絡み泥、腹減らし床、呼び鈴床 |
| 小目標 | 敵討伐、道具収集、階段発見の短期目標。達成でスコア加算 |
| 未識別 | 一部の草、札、補助道具は使うまで正体が分からない |
| 装備特性 | 命中補正、獣系特効、槍の射程、罠発見、被ダメージ軽減 |
| 保存 | 進行データと記録データを localStorage に分離 |

## 今後の拡張案

- 罠の種類追加
- 未識別アイテムの鑑定、呪い、祝福
- 店
- NPC
- ボス階
- 武器防具の強化
- 合成
- 倉庫
- 実績
- 日替わりダンジョン
- チュートリアル
- 追加スプライトアセット
- 効果音
- オフライン対応
- スマホホーム画面追加対応
- Cloudflare Pages Functionsによるランキング機能
- Cloudflare D1によるスコア保存
- Cloudflare KVによる日替わりダンジョンseed配信
- Cloudflare Analyticsを使った簡易アクセス確認

初期実装は Cloudflare Pages の静的公開のみで完結しています。Functions、D1、KV は将来拡張候補です。
