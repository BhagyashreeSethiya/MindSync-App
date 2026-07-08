import React, { useEffect, useState } from "react";
import { fetchMoodLogs } from "../services/api";
import ChartBox  from "../components/ChartBox";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLogs = async () => {
      const data = await fetchMoodLogs();
      setLogs(data);
      setLoading(false);
    };
    getLogs();
  }, []);

  

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>📊 Caretaker Dashboard</h2>
      <p style={{ color: "#555", marginBottom: "20px" }}>
        Monitor user interactions and AI activity over time.
      </p>

      {loading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <>
        {/* Injecting ChartBox and passing logs*/}
        <ChartBox logs = {logs} />
          

          {/* 📝 The Data Table */}
          <div style={{ overflowX: "auto", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>Time</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>User Said</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>AI Replied</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px", whiteSpace: "nowrap", color: "#666" }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: "12px" }}>{log.user_message}</td>
                    <td style={{ padding: "12px", color: "#4A90E2" }}>{log.ai_reply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;