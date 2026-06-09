def build_prompt(profile: dict, ml_results: dict) -> str:
    cols_summary = ""
    for col in profile["columns"]:
        if col["type"] == "numeric":
            cols_summary += (
                f"- {col['name']} (numeric): mean={col['mean']}, "
                f"std={col['std']}, min={col['min']}, max={col['max']}, "
                f"skewness={col['skewness']}, missing={col['missing_pct']}%\n"
            )
        else:
            top = list(col["top_values"].keys())[:3]
            cols_summary += (
                f"- {col['name']} (categorical): {col['unique']} unique values, "
                f"top values: {top}, missing={col['missing_pct']}%\n"
            )

    ml_summary = ""
    if "error" not in ml_results:
        ml_summary = (
            f"Task type: {ml_results['task']}\n"
            f"Target column: {ml_results['target_column']}\n"
            f"Model metrics: {ml_results['metrics']}\n"
            f"Top predictive features: {ml_results['top_features']}\n"
        )

    prompt = f"""You are an expert data analyst. A user has uploaded a dataset. 
Below are the computed statistics. Your job is to provide clear, grounded insights 
based ONLY on the statistics provided — do not assume or invent information 
not present in the data summary.

DATASET SUMMARY:
- Rows: {profile['shape']['rows']}, Columns: {profile['shape']['columns']}
- Total missing values: {profile['missing_summary']['total_missing']} ({profile['missing_summary']['percent_missing']}%)
- Duplicate rows: {profile['duplicates']}

COLUMN STATISTICS:
{cols_summary}

MACHINE LEARNING RESULTS:
{ml_summary}

IMPORTANT: You MUST return ONLY valid JSON. No markdown, no extra text, no code fences.

Respond with this exact JSON structure. Include AT LEAST 2-3 visualization suggestions:

{{
  "overview": "2-3 sentence summary of the dataset",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "data_quality": "assessment of missing values, duplicates, outliers",
  "ml_insight": "what the ML results tell us about the data",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "visualizations": [
    {{"title": "Visualization 1", "type": "bar", "x_axis": "column1", "y_axis": "column2", "description": "Description"}},
    {{"title": "Visualization 2", "type": "scatter", "x_axis": "column3", "y_axis": "column4", "description": "Description"}},
    {{"title": "Visualization 3", "type": "histogram", "x_axis": "column5", "y_axis": "", "description": "Description"}}
  ]
}}"""

    return prompt