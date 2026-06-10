# API Documentation

Base URL (local): `http://localhost:8000`

## Health and Discovery

- OpenAPI schema: `/openapi.json`
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Endpoint: `POST /analyze`

Analyze an uploaded CSV file and return profile, ML metrics, and LLM insights.

### Request

- **Content-Type:** `multipart/form-data`
- **Field:** `file` (required) — CSV file

Example with `curl`:

```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "file=@/absolute/path/to/titanic.csv"
```

### Successful Response (`200 OK`)

```json
{
  "profile": {
    "shape": { "rows": 891, "columns": 12 },
    "columns": [],
    "missing_summary": { "total_missing": 0, "percent_missing": 0.0 },
    "duplicates": 0
  },
  "ml_results": {
    "task": "classification",
    "target_column": "Survived",
    "metrics": { "accuracy": 0.82 },
    "top_features": { "Age": 0.24 }
  },
  "insights": {
    "overview": "...",
    "key_findings": ["..."],
    "data_quality": "...",
    "ml_insight": "...",
    "recommendations": ["..."],
    "visualizations": []
  }
}
```

### Error Cases

- Invalid CSV or parse errors may surface as backend exceptions.
- Missing/invalid `ANTHROPIC_API_KEY` returns LLM-related error payload in `insights`.
- ML processing failures return `{"error": "..."}` inside `ml_results`.

## Notes

- CORS is currently open (`*`) in development.
- Last CSV column is treated as target for ML task detection.
