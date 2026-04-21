import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function PredictionChart({ live, predicted }) {
  const data = {
    labels: ["Now", "Prediction"],
    datasets: [
      {
        label: "Price Trend",
        data: [live, predicted],
        borderColor: "#00f2ff",
        backgroundColor: "rgba(0,242,255,0.2)",
        tension: 0.4,
        pointBackgroundColor: "#ffcc00",
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: "#aaa" } },
      y: { ticks: { color: "#aaa" } },
    },
  };

  return <Line data={data} options={options} />;
}

export default PredictionChart;