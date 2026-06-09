import pandas as pd
import numpy as np

def profile_dataframe(df: pd.DataFrame) -> dict:
    profile = {
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "columns": [],
        "missing_summary": {
            "total_missing": int(df.isnull().sum().sum()),
            "percent_missing": round(df.isnull().sum().sum() / df.size * 100, 2)
        },
        "duplicates": int(df.duplicated().sum()),
    }

    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "missing": int(df[col].isnull().sum()),
            "missing_pct": round(df[col].isnull().mean() * 100, 2),
            "unique": int(df[col].nunique()),
        }

        if pd.api.types.is_numeric_dtype(df[col]):
            desc = df[col].describe()
            col_info.update({
                "type": "numeric",
                "mean": round(float(desc["mean"]), 4),
                "std": round(float(desc["std"]), 4),
                "min": round(float(desc["min"]), 4),
                "max": round(float(desc["max"]), 4),
                "median": round(float(df[col].median()), 4),
                "skewness": round(float(df[col].skew()), 4),
            })
        else:
            col_info.update({
                "type": "categorical",
                "top_values": df[col].value_counts().head(5).to_dict()
            })

        profile["columns"].append(col_info)

    return profile