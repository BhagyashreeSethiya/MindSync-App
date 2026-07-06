import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

// Chart.js Setup
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

//Yahan  { logs } as a prop receive kiya h

const ChartBox = ({logs}) => {
    const processChartData = () => {
        const counts = {};
        logs.forEach((log) => {
            const date = log.timestamp.split(" ")[0];
            counts[date] = (counts[date] || 0) + 1;
        });

        return {
      labels: Object.keys(counts).reverse(),
      datasets: [
        {
          label: "Number of AI Interactions",
          data: Object.values(counts).reverse(),
          borderColor: "#4A90E2",
          backgroundColor: "rgba(74, 144, 226, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };
        
  return (
    <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
      <Line 
         data={processChartData()} 
         options={{ responsive: true, plugins: { legend: { position: "top" } } }} 
      />
    </div>
  );
};

export default ChartBox;