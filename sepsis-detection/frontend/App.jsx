import { useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const API = "http://127.0.0.1:5001/predict";

export default function App() {
  const [file,    setFile]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const riskColor = (score) => {
    if (score >= 0.85) return "#ff4d4f";
    if (score >= 0.50) return "#faad14";
    return "#52c41a";
  };

  const handleUpload = async () => {
    if (!file) { setError("Please choose a CSV file first."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await axios.post(API, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Server error";
      setError("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? result.iculos.map((t, i) => ({ time: t, risk: result.trajectory[i] }))
    : [];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "32px 24px"
    }}>
      <h1 style={{ textAlign: "center", fontSize: "2.2rem", fontWeight: "bold", marginBottom: "28px" }}>
        Sepsis Prediction Dashboard
      </h1>

      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => { setFile(e.target.files[0]); setError(null); setResult(null); }}
          style={{ marginRight: "12px", color: "white" }}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            padding: "8px 20px",
            background: loading ? "#444" : "#1d4ed8",
            color: "white", border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem"
          }}
        >
          {loading ? "Analyzing..." : "Upload CSV"}
        </button>
      </div>

      {error && (
        <p style={{ textAlign: "center", color: "#ff4d4f", marginBottom: "20px" }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{
            textAlign: "center", fontSize: "1.6rem",
            color: riskColor(result.risk_score), marginBottom: "8px"
          }}>
            Risk Score: {result.risk_score.toFixed(3)}
          </h2>

          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
              Risk Category: {result.risk_category}
            </span>
            {"  |  "}
            <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
              Patient Status: {result.patient_status}
            </span>
          </div>

          <h2 style={{
            textAlign: "center",
            color: riskColor(result.risk_score),
            fontSize: "1.3rem", marginBottom: "24px"
          }}>
            {result.alert}
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px", marginBottom: "28px"
          }}>
            {[
              { label: "Volatility",      value: result.volatility.toFixed(3) },
              { label: "Stability Index", value: result.stability_index.toFixed(3) },
              { label: "Sudden Jumps",    value: result.sudden_jumps },
              { label: "Risk Trend",      value: result.risk_trend },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#1e293b", borderRadius: "10px",
                padding: "16px", textAlign: "center",
                border: "1px solid #334155"
              }}>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  {label}
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: "#1e293b", borderRadius: "12px",
            padding: "20px", border: "1px solid #334155"
          }}>
            <h3 style={{ marginBottom: "16px", color: "#94a3b8", fontSize: "1rem" }}>
              Sepsis Risk Over Time
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b"
                  label={{ value: "ICU Hours", position: "insideBottom", offset: -4, fill: "#64748b" }} />
                <YAxis domain={[0, 1]} stroke="#64748b"
                  label={{ value: "Risk Score", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                  formatter={(v) => [v.toFixed(3), "Risk Score"]}
                  labelFormatter={(l) => "ICU Hour " + l}
                />
                <ReferenceLine y={0.85} stroke="#ff4d4f" strokeDasharray="4 4"
                  label={{ value: "High", fill: "#ff4d4f", fontSize: 11 }} />
                <ReferenceLine y={0.50} stroke="#faad14" strokeDasharray="4 4"
                  label={{ value: "Med", fill: "#faad14", fontSize: 11 }} />
                <Line type="monotone" dataKey="risk"
                  stroke={riskColor(result.risk_score)}
                  strokeWidth={3}
                  dot={{ r: 4, fill: riskColor(result.risk_score) }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}