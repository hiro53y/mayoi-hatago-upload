# GitHubアップロード手順

このフォルダ `deliverables/mayoi-hatago-upload` を GitHub リポジトリのルートとして扱います。

## アップするもの

`deliverables/mayoi-hatago-upload` の中身をアップします。

主な必要ファイル:

- `src/`
- `public/`
- `scripts/`
- `index.html`
- `package.json`
- `package-lock.json`
- `README.md`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `tsconfig.test.json`
- `vite.config.mjs`
- `wrangler.toml`
- `.gitignore`
- `.node-version`
- `start_dev.bat`
- `start_preview.bat`
- `start_dev.sh`
- `start_preview.sh`

## アップしないもの

以下は `.gitignore` で除外されます。

- `node_modules/`
- `dist/`
- `.test-build/`
- `out/` 内の生成物

GitHub のWeb画面で手動アップロードする場合は、上記の除外フォルダをドラッグしないでください。

## Cloudflare Pages設定

| 項目 | 値 |
|---|---|
| Framework preset | React / Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | `22.16.0` |

Cloudflare Pages が `.node-version` を読めない設定の場合は、環境変数 `NODE_VERSION` に `22.16.0` を指定してください。
