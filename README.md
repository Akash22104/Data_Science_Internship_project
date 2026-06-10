# Automation in Data Analytics

Automation in Data Analytics is a full-stack application that turns raw CSV files into automated data profiling, machine learning results, and LLM-generated business insights.

## Project Objectives

- Automate repetitive exploratory analysis steps.
- Generate quick ML baseline insights without manual model setup.
- Translate technical results into human-readable recommendations.
- Provide a simple web interface for non-technical and technical users.

## Features Overview

- CSV upload and analysis workflow from browser.
- Automated data profiling (shape, missing values, duplicates, per-column stats).
- Automatic task detection (classification/regression) with Random Forest baselines.
- LLM-powered structured insights and visualization suggestions.
- Interactive frontend with upload, result cards, and chart recommendations.

## Technology Stack

### Backend
- **FastAPI**: REST API for file upload and analysis.
- **Pandas / NumPy**: Data processing and profiling.
- **scikit-learn**: Baseline ML modeling and feature importance.
- **Anthropic SDK**: LLM insight generation.
- **python-dotenv**: Environment variable loading.

### Frontend
- **HTML/CSS/JavaScript**: UI and client-side workflow.
- **Plotly.js**: Visualization rendering support.

## Architecture (Frontend → Backend → LLM)

1. Frontend uploads CSV to backend (`/analyze`).
2. Backend reads data and runs:
   - profiling (`profiler.py`)
   - ML baseline (`ml_engine.py`)
   - prompt construction (`prompt_builder.py`)
3. Backend calls Anthropic via `llm_client.py`.
4. Backend returns JSON with `profile`, `ml_results`, and `insights`.
5. Frontend renders summaries and suggested visualizations.

For more detail: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Installation & Setup

## Prerequisites

- Python 3.10+
- Modern browser (Chrome/Edge/Firefox)
- Anthropic API key

### Backend Setup

```bash
cd auto-data-analyst/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY in .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd auto-data-analyst/frontend
# Optional: edit config.js if backend URL differs
python -m http.server 5500
# Open http://localhost:5500/index.html
```

## Usage Guide

1. Start backend server.
2. Start frontend static server.
3. Open the frontend page.
4. Upload a CSV (you can use `titanic.csv` at repository root).
5. Wait for analysis to complete.
6. Review:
   - Dataset profile
   - ML metrics and top features
   - LLM key findings, recommendations, and visualization ideas

## API Endpoint Documentation

### `POST /analyze`
Uploads a CSV file and returns profile, ML summary, and LLM insights.

**Request (multipart/form-data):**
- `file`: CSV file

**Response (JSON):**
- `profile` (object)
- `ml_results` (object)
- `insights` (object)

Detailed API docs: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Data File Format Requirements

- File type: `.csv`
- First row must be headers.
- Recommended: clean delimiter usage and consistent column counts.
- Frontend max size validation: 50MB.
- Last column is treated as target by current ML heuristic.

## Environment Variables

Create `.env` files from examples:

- Root template: [`.env.example`](./.env.example)
- Backend template: [`auto-data-analyst/backend/.env.example`](./auto-data-analyst/backend/.env.example)

Required:
- `ANTHROPIC_API_KEY`: API key used by backend LLM client.

Optional:
- `ANTHROPIC_MODEL`: Override model name.
- `BACKEND_HOST`, `BACKEND_PORT`, `FRONTEND_ORIGIN`, `CORS_ALLOW_ORIGINS`.

## Project Structure

```text
Automation_in_data_analytics/
├── README.md
├── ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── TROUBLESHOOTING.md
├── CONTRIBUTING.md
├── LICENSE
├── .env.example
├── titanic.csv
└── auto-data-analyst/
    ├── backend/
    │   ├── main.py
    │   ├── profiler.py
    │   ├── ml_engine.py
    │   ├── prompt_builder.py
    │   ├── llm_client.py
    │   ├── config.py
    │   ├── requirements.txt
    │   ├── .env.example
    │   └── README.md
    └── frontend/
        ├── index.html
        ├── app.js
        ├── style.css
        ├── config.js
        └── README.md
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common setup/runtime issues and fixes.

## Contributing

Please follow [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Key Resources

- [Backend README](./auto-data-analyst/backend/README.md)
- [Frontend README](./auto-data-analyst/frontend/README.md)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [scikit-learn Docs](https://scikit-learn.org/stable/)
- [Anthropic API Docs](https://docs.anthropic.com/)
