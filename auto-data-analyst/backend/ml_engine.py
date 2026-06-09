import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, r2_score, mean_absolute_error

def detect_task(df: pd.DataFrame):
    # Heuristic: last column is usually the target
    target_col = df.columns[-1]
    target = df[target_col].dropna()

    if pd.api.types.is_numeric_dtype(target) and target.nunique() > 10:
        return "regression", target_col
    else:
        return "classification", target_col

def run_ml(df: pd.DataFrame) -> dict:
    try:
        df = df.dropna()
        task, target_col = detect_task(df)

        X = df.drop(columns=[target_col])
        y = df[target_col]

        # Encode categoricals
        for col in X.select_dtypes(include="object").columns:
            X[col] = LabelEncoder().fit_transform(X[col].astype(str))

        if task == "classification":
            y = LabelEncoder().fit_transform(y.astype(str))

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        if task == "classification":
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            metrics = {"accuracy": round(accuracy_score(y_test, preds), 4)}
        else:
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            metrics = {
                "r2_score": round(r2_score(y_test, preds), 4),
                "mae": round(mean_absolute_error(y_test, preds), 4)
            }

        # Feature importance
        importance = dict(zip(
            X.columns,
            [round(float(v), 4) for v in model.feature_importances_]
        ))
        top_features = dict(sorted(importance.items(), key=lambda x: -x[1])[:5])

        return {
            "task": task,
            "target_column": target_col,
            "metrics": metrics,
            "top_features": top_features
        }

    except Exception as e:
        return {"error": str(e)}