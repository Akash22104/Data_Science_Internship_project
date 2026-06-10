# Troubleshooting

## 1) Frontend cannot reach backend

**Symptom:** Upload fails and UI suggests backend is unavailable.

**Fix:**
- Ensure backend is running at `http://localhost:8000`.
- Update `auto-data-analyst/frontend/config.js` if backend URL differs.

## 2) `ANTHROPIC_API_KEY` missing

**Symptom:** LLM insight generation fails.

**Fix:**
- Create `auto-data-analyst/backend/.env` from `.env.example`.
- Set `ANTHROPIC_API_KEY` with a valid key.
- Restart backend after changes.

## 3) Invalid CSV parsing errors

**Symptom:** Upload succeeds but analysis fails.

**Fix:**
- Confirm file extension is `.csv`.
- Ensure header row is present.
- Check for broken delimiters/quoted commas.
- Try opening and re-saving CSV with UTF-8 encoding.

## 4) Slow or failed ML processing

**Symptom:** Large datasets fail or take too long.

**Fix:**
- Start with smaller dataset samples.
- Remove highly sparse columns.
- Ensure target column (last column) contains meaningful values.

## 5) Python dependency issues

**Symptom:** Import errors on startup.

**Fix:**
- Recreate virtual environment.
- Reinstall dependencies using:
  ```bash
  pip install -r auto-data-analyst/backend/requirements.txt
  ```

## 6) CORS/browser errors in production

**Symptom:** Browser blocks API calls.

**Fix:**
- Restrict/adjust origins with `CORS_ALLOW_ORIGINS` in backend env.
- Confirm frontend and backend URLs are set correctly.
