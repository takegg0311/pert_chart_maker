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

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## ドキュメント

設計・実装手順の詳細は設計ドキュメントを参照してください。
