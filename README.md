# pert_chart_maker

GitHub Projects などのタスク管理データをもとに、AoN（Activity on Node）形式の PERT ダイアグラムを描画し、CPM（クリティカルパス法）によるスケジュール分析を行う Web アプリケーション。

## 概要

2つの動作モードを持つ：

| モード | 説明 | バックエンド |
|--------|------|-------------|
| CSV モード | テンプレート CSV を読み込んで即時描画 | 不要 |
| バックエンドモード | FastAPI + PostgreSQL からタスクを取得 | 必要 |

| 項目 | 内容 |
|------|------|
| ホスティング | Firebase Hosting |
| フロントエンド | React 18 + Vite + TypeScript |
| グラフ描画 | Cytoscape.js + cytoscape-dagre |
| バックエンド | FastAPI (Python 3.11+)（任意） |
| データベース | PostgreSQL 15（任意） |

## ディレクトリ構成

```
pert-system/
├── backend/    # オプション（バックエンドモード時）FastAPI + SQLAlchemy
├── frontend/   # React + Vite + TypeScript（CSVモード単体で動作可能）
└── docker-compose.yml
```

## セットアップ

### フロントエンド（CSVモード、バックエンド不要）

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### バックエンド（任意、DBモード用）

```bash
docker compose up -d db
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### デプロイ（Firebase Hosting）

本番URL: https://pert-chart.web.app（Firebase プロジェクト配下に追加した Hosting サイト `pert-chart`）

`frontend/.firebaserc` はプロジェクトIDを含むため gitignore 対象。初回のみ以下で生成する。

```bash
cd frontend
cp .firebaserc.example .firebaserc   # default とサイトIDを自分のものに書き換える
firebase hosting:sites:create <your-site-id>   # 専用サブドメイン（<site-id>.web.app）が必要な場合
firebase target:apply hosting pert-chart <your-site-id>
```

手動デプロイ:

```bash
cd frontend
npm run build
firebase deploy --only hosting:pert-chart
```

main ブランチへの push 時は GitHub Actions（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）が自動デプロイを実行する。CI は `.firebaserc` を使わず `vars.FIREBASE_PROJECT_ID` とワークフロー内の `target: pert-chart` でデプロイ先を指定するため、リポジトリをフォークしても自分の Secrets/Variables を設定するだけで動く（site-id を変える場合は `target` の値も変更する）。以下を GitHub リポジトリに設定すること。

| 種別 | キー | 内容 |
|------|------|------|
| Secret | `FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID>` | `firebase init hosting:github` で発行されるサービスアカウントの JSON 全文。Secret 名はプロジェクトIDに依存するため、フォーク先では `.github/workflows/deploy.yml` の `firebaseServiceAccount` 参照名も合わせて変更すること |
| Secret | `VITE_FIREBASE_API_KEY` | （将来 Firebase SDK を組み込む場合のみ）`.env.example` 参照 |
| Secret | `VITE_FIREBASE_AUTH_DOMAIN` | （将来 Firebase SDK を組み込む場合のみ）`.env.example` 参照 |
| Variable | `FIREBASE_PROJECT_ID` | デプロイ先の Firebase プロジェクト ID |

フロントエンドの環境変数はローカル開発時 `frontend/.env`（gitignore 済み）に設定し、`frontend/.env.example` をテンプレートとして使う。現時点ではアプリ自体は環境変数を使用していない（CSV モードのみで完結）ため、これらは将来 Firebase SDK をクライアントに組み込む際の雛形。

## ドキュメント

設計・実装手順の詳細は設計ドキュメントを参照してください。
