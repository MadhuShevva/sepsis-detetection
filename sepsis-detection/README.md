# 🏥 Sepsis Early Detection using Machine Learning

An end-to-end machine learning system that predicts **sepsis onset in ICU patients** from time-series clinical data — before critical deterioration occurs.

---

## 🔍 Problem Statement

Sepsis is a life-threatening condition caused by the body's extreme response to infection. Early detection is critical — every hour of delayed treatment increases mortality risk. This system analyzes ICU patient vitals and lab values to flag high-risk patients in real time.

---

## 📊 Dataset

- **Source:** PhysioNet/CinC Challenge 2019 — ICU time-series clinical data
- **Size:** 706,781 hourly records across ICU patients
- **Class imbalance:** ~98.6% non-sepsis vs ~1.4% sepsis (handled via SMOTE)
- **Features:** 51 engineered features from 12 vital signs (HR, O2Sat, Temp, BP, Lactate, WBC, etc.)

---

## ⚙️ Pipeline

```
Raw PSV Files → EDA & Preprocessing → Feature Engineering → Model Training → Flask API → React Dashboard
```

### Notebooks (in order)
| Notebook | Description |
|---|---|
| `preprocessing.ipynb` | Raw data cleaning, missing value handling, time-series aggregation |
| `2_preprocessing.ipynb` | Train-test split, SMOTE oversampling, feature scaling |
| `TemporalStability.ipynb` | Temporal stability analysis across ICU hours |
| `decisiontree.ipynb` | Decision Tree baseline with threshold tuning |
| `randomforest.ipynb` | Random Forest with balanced subsampling |
| `xgboost.ipynb` | XGBoost with scale_pos_weight for imbalance |
| `stacking.ipynb` | Stacking ensemble (RF + XGBoost → Logistic Regression meta) |

---

## 📈 Model Results

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
|---|---|---|---|---|---|
| Decision Tree | 0.941 | 0.077 | 0.283 | 0.121 | 0.753 |
| Random Forest | 0.988 | 0.567 | 0.517 | 0.541 | 0.938 |
| XGBoost | 0.987 | 0.558 | 0.537 | 0.547 | 0.951 |
| **Stacking Ensemble** | **0.988** | **0.559** | **0.638** | **0.596** | **0.963** |

> **Best model:** Stacking Ensemble (RF + XGBoost → Logistic Regression)  
> ROC-AUC of **0.963** with the best balance of Precision and Recall

---

## 🛠️ Tech Stack

- **ML:** Python, Scikit-learn, XGBoost, imbalanced-learn (SMOTE)
- **Backend:** Flask, Flask-CORS
- **Frontend:** React, Recharts, Axios
- **Data:** Pandas, NumPy, Matplotlib, Seaborn

---

## 🚀 How to Run

### Backend (Flask API)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### Usage
1. Start the Flask backend
2. Start the React frontend
3. Upload a patient CSV with columns: `ICULOS, HR, O2Sat, Temp, SBP, MAP, DBP, Resp, Lactate, WBC, Platelets, Creatinine, Glucose, Age, Gender`
4. View real-time sepsis risk score and trajectory

---

## 📁 Project Structure

```
sepsis-detection/
├── notebooks/          # All Jupyter notebooks (EDA → Models)
├── backend/            # Flask API (app.py)
├── frontend/           # React dashboard (App.jsx)
├── data/               # Dataset (not tracked in git)
├── models/             # Saved model pkl files (not tracked in git)
└── README.md
```

---

## 🔑 Key Techniques Used

- **SMOTE** for handling severe class imbalance (1.4% positive class)
- **Threshold tuning** to optimize F1 over default 0.5 cutoff
- **Stacking ensemble** combining RF + XGBoost with LR meta-learner
- **Temporal feature engineering** — rolling window stats (mean, std, min, max) per vital sign
- **Clinical heuristics** applied post-prediction for Lactate, MAP, Creatinine thresholds

---

## 👤 Author

**Madhu Sudhan Reddy Shevva**  
B.Tech CSE (Data Science) — CVR College of Engineering, Hyderabad  
[LinkedIn](https://linkedin.com) | [GitHub](https://github.com)
