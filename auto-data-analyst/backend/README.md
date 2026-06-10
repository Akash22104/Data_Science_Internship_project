# Backend (FastAPI)

This backend ingests CSV files and returns:

- dataset profile statistics,
- ML baseline metrics/features,
- LLM-generated insights.

## Setup

```bash
cd auto-data-analyst/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

- `ANTHROPIC_API_KEY` (required)
- `ANTHROPIC_MODEL` (optional)
- `BACKEND_HOST` (optional)
- `BACKEND_PORT` (optional)
- `CORS_ALLOW_ORIGINS` (optional, comma-separated)

## Endpoints

### `POST /analyze`
- Accepts `multipart/form-data` with `file` (CSV).
- Returns `profile`, `ml_results`, and `insights` JSON.

## Core Files

- `main.py` API entry point
- `profiler.py` data profiling
- `ml_engine.py` baseline ML
- `prompt_builder.py` LLM prompt assembly
- `llm_client.py` LLM call wrapper
- `config.py` env-based configuration

## Notes

- Current implementation assumes last column is target for ML.
- CORS defaults to local frontend origins.
