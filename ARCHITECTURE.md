# Architecture

## High-Level Design

The system has three layers:

1. **Frontend (`auto-data-analyst/frontend`)**
   - Accepts CSV uploads.
   - Sends files to backend API.
   - Displays analysis output and chart suggestions.

2. **Backend (`auto-data-analyst/backend`)**
   - Parses uploaded CSV.
   - Profiles data (`profiler.py`).
   - Runs ML baseline (`ml_engine.py`).
   - Builds prompt (`prompt_builder.py`).
   - Calls LLM (`llm_client.py`).

3. **LLM Provider (Anthropic Claude)**
   - Converts profiling + ML context into structured insights JSON.

## Request Flow

1. User uploads CSV in frontend.
2. Frontend issues `POST /analyze`.
3. Backend reads data with Pandas.
4. Backend creates profile and ML summaries.
5. Backend requests LLM insights.
6. Backend returns combined JSON payload.
7. Frontend renders profile, ML metrics, and recommendations.

## Backend Module Responsibilities

- `main.py`: API entrypoint and orchestration.
- `profiler.py`: dataset statistics and column-level summary.
- `ml_engine.py`: heuristic task detection + random forest training.
- `prompt_builder.py`: deterministic prompt construction.
- `llm_client.py`: Anthropic API call and JSON parsing.
- `config.py`: environment-based runtime configuration.

## Scalability Notes

- Current processing is in-memory and synchronous per request.
- For production, add:
  - async/background job execution for large files,
  - file/object storage,
  - stricter schema validation,
  - caching and observability.
