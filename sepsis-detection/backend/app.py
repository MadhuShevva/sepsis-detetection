from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

stack_model   = joblib.load(os.path.join(BASE_DIR, "models/stacking_model.pkl"))
feature_names = joblib.load(os.path.join(BASE_DIR, "models/feature_names.pkl"))

THRESHOLD = 0.40

WINDOW_SIZE = 6
VITALS = ["HR","O2Sat","Temp","SBP","MAP","DBP","Resp",
          "Lactate","WBC","Platelets","Creatinine","Glucose"]


def create_features(df):
    features, iculos_list = [], []
    for col in VITALS:
        if col not in df.columns:
            df[col] = np.nan
    df = df.ffill().bfill()
    df[VITALS] = df[VITALS].fillna(df[VITALS].median())

    for i in range(WINDOW_SIZE, len(df)):
        w, row = df.iloc[i - WINDOW_SIZE:i], {}
        for col in VITALS:
            row[col+"_mean"] = w[col].mean()
            row[col+"_std"]  = w[col].std()
            row[col+"_min"]  = w[col].min()
            row[col+"_max"]  = w[col].max()
        row["Age"]    = df.iloc[i].get("Age", 0)
        row["Gender"] = df.iloc[i].get("Gender", 0)
        row["ICULOS"] = df.iloc[i].get("ICULOS", i)
        features.append(row)
        iculos_list.append(row["ICULOS"])
    return pd.DataFrame(features), iculos_list


def temporal_metrics(scores):
    if len(scores) == 0:
        return 0.0, 1.0, 0, "Stable"
    vol   = float(np.std(scores))
    stab  = float(1 / (1 + vol))
    jumps = int(np.sum(np.abs(np.diff(scores)) > 0.10)) if len(scores) > 1 else 0
    slope = np.polyfit(range(len(scores)), scores, 1)[0] if len(scores) >= 2 else 0
    trend = "Increasing" if slope > 0.005 else ("Decreasing" if slope < -0.005 else "Stable")
    return vol, stab, jumps, trend


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    try:
        df = pd.read_csv(request.files["file"])
    except Exception:
        return jsonify({"error": "Invalid CSV"}), 400
    if "ICULOS" not in df.columns:
        return jsonify({"error": "Missing ICULOS column"}), 400

    df = df.sort_values("ICULOS")
    feat_df, iculos = create_features(df)

    if feat_df.empty:
        return jsonify({"error": "Need at least 7 rows of ICU data"}), 400

    for col in feature_names:
        if col not in feat_df.columns:
            feat_df[col] = 0
    feat_df = feat_df[feature_names]

    probs = stack_model.predict_proba(feat_df)[:, 1].tolist()

    for i in range(len(probs)):
        r = feat_df.iloc[i]
        if r.get("Lactate_mean",   0)   > 4:   probs[i] += 0.15
        if r.get("MAP_mean",     100)   < 65:   probs[i] += 0.15
        if r.get("Creatinine_mean", 0)  > 2:   probs[i] += 0.10
        if r.get("Platelets_mean", 200) < 150:  probs[i] += 0.10
        if r.get("Resp_mean",       0)  > 24:   probs[i] += 0.10
        if r.get("O2Sat_mean",    100)  < 92:   probs[i] += 0.10
        if r.get("Temp_mean",      37)  > 38.5: probs[i] += 0.08
        if r.get("HR_mean",        0)   > 110:  probs[i] += 0.08
        if r.get("WBC_mean",       0)   > 14:   probs[i] += 0.05
        probs[i] = max(0.0, min(1.0, probs[i]))

    vol, stab, jumps, trend = temporal_metrics(probs)
    smoothed   = pd.Series(probs).rolling(3, min_periods=1).mean().tolist()
    final_risk = float(smoothed[-1])

    is_sepsis = final_risk >= THRESHOLD

    if final_risk < 0.20:
        category = "Low"
    elif final_risk < 0.45:
        category = "Medium"
    else:
        category = "High"

    if is_sepsis and stab < 0.6:
        status = "Critical"
    elif final_risk >= 0.35:
        status = "Monitor"
    else:
        status = "Stable"

    if final_risk >= 0.45:
        alert = "HIGH RISK - Possible Sepsis"
    elif final_risk >= 0.20:
        alert = "MODERATE RISK - Monitor Patient"
    else:
        alert = "LOW RISK - Patient Stable"

    return jsonify({
        "risk_score":      round(final_risk, 3),
        "risk_category":   category,
        "volatility":      round(vol,  4),
        "stability_index": round(stab, 4),
        "sudden_jumps":    jumps,
        "risk_trend":      trend,
        "patient_status":  status,
        "alert":           alert,
        "trajectory":      [round(x, 4) for x in smoothed],
        "iculos":          iculos
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)