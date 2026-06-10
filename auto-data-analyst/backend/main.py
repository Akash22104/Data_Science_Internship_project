from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io

from profiler import profile_dataframe
from ml_engine import run_ml
from prompt_builder import build_prompt
from llm_client import get_insights
from config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))

    profile = profile_dataframe(df)
    ml_results = run_ml(df)
    prompt = build_prompt(profile, ml_results)
    insights = get_insights(prompt)

    return JSONResponse({
        "profile": profile,
        "ml_results": ml_results,
        "insights": insights
    })