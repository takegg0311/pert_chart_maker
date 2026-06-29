# pert_chart_maker

GitHub Projects などのタスク管理データをもとに、AoN（Activity on Node）形式の PERT ダイアグラムを描画し、CPM（クリティカルパス法）によるスケジュール分析を行う Web アプリケーション。

## 概要

2つの動作モードを持つ：

| モード | 説明 | バックエンド |
|--------|------|-------------|
| CSV モード | テンプレート CSV を読み込んで即時描画 | 不要 |
| GitHub Project モード | GitHub Project v2 の Issue からタスクを取得 | 必要（`POST /api/gh`） |

| 項目 | 内容 |
|------|------|
| ホスティング | Firebase Hosting + Cloud Run |
| フロントエンド | React 19 + Vite + TypeScript |
| グラフ描画 | Cytoscape.js + cytoscape-dagre |
| バックエンド | FastAPI (Python 3.12+) |

## ディレクトリ構成

```
pert_chart_maker/
├── backend/    # FastAPI（GitHub Project モード用 API）
├── frontend/   # React + Vite + TypeScript（CSVモード単体で動作可能）
└── .github/workflows/deploy.yml
```

## セットアップ

### フロントエンド（CSVモード、バックエンド不要）

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### バックエンド（GitHub Project モード用）

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # GITHUB_TOKEN を設定
uvicorn main:app --reload --port 8000
```

別ターミナルでフロントエンドを起動すると、Vite のプロキシ経由で `/api/gh` がバックエンドに転送されます。

#### 環境変数（`backend/.env`）

```env
# 必須: GitHub GraphQL API アクセストークン
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# オプション: CORS 許可オリジン（カンマ区切り）
# CORS_ORIGINS=http://localhost:5173,https://pert-chart.web.app
```

#### PAT スコープ

- Classic PAT: `read:project`（Public Project の基本取得）
- Classic PAT（Private Project / Issue 依存関係まで取得）: 上記に加え `repo`（Private リポジトリの Issue 参照）
- Fine-grained PAT: `Projects: Read-only`、対象リポジトリの `Issues: Read-only`

`read:project` のみの場合、Project カスタムフィールド（Title / Estimate）は取得できますが、リンク先 Issue の `content` が `null` となり Issue 番号や `blockedBy` / `blocking` は取得できません。その場合は Project 項目 ID をタスク ID としてフォールバックします。

### GitHub Project モードの使い方

1. トップ画面で「GitHub Project」カードを選択
2. Project URL を入力（例: `https://github.com/users/takegg0311/projects/3`）
3. Estimate フィールド名を入力（空欄の場合は `Estimate`）
4. 「取得」ボタンをクリックして PERT チャートを生成

取得データのマッピング：

| PERT の項目 | GitHub Project のデータ |
|------------|------------------------|
| タスク名 | Issue タイトル |
| 工数 | Project カスタムフィールド（数値型） |
| 前提タスク | `blockedBy` に設定された Issue |
| 後継タスク | `blocking` に設定された Issue |
| タスク ID | Issue 番号 |

### デプロイ（Firebase Hosting + Cloud Run）

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
# Cloud Run API
cd backend
gcloud run deploy pert-chart-api --source . --region asia-northeast1 --allow-unauthenticated

# Firebase Hosting
cd frontend
npm run build
firebase deploy --only hosting:pert-chart
```

main ブランチへの push 時は GitHub Actions（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）が Cloud Run と Firebase Hosting の自動デプロイを実行する。

#### GitHub リポジトリ設定

| 種別 | キー | 内容 |
|------|------|------|
| Secret | `FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID>` | Firebase サービスアカウント JSON |
| Secret | `GCP_SA_KEY` | Cloud Run デプロイ用 GCP サービスアカウント JSON |
| Secret | `GH_PROJECT_PAT` | Cloud Run の GitHub GraphQL 用 PAT（`read:project`） |
| Variable | `FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| Variable | `GCP_PROJECT_ID` | GCP プロジェクト ID |
| Variable | `GCP_REGION` | Cloud Run リージョン（例: `asia-northeast1`） |
| Secret | `VITE_FIREBASE_API_KEY` | （将来 Firebase SDK を組み込む場合のみ） |
| Secret | `VITE_FIREBASE_AUTH_DOMAIN` | （将来 Firebase SDK を組み込む場合のみ） |

フロントエンドの環境変数はローカル開発時 `frontend/.env`（gitignore 済み）に設定し、`frontend/.env.example` をテンプレートとして使う。

## API

### `POST /api/gh`

GitHub Project からタスクを取得する。

**リクエスト:**

```json
{
  "project_url": "https://github.com/users/takegg0311/projects/3",
  "estimate_field": "Estimate"
}
```

**レスポンス:**

```json
{
  "tasks": [
    {
      "id": "42",
      "name": "API設計",
      "duration": 3.0,
      "predecessors": ["38", "39"],
      "successors": ["45"],
      "state": "OPEN"
    }
  ]
}
```
