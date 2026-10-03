import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
import { fetchHistory } from '../lib/data';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);


const OPTIONS = {
  responsive: true,
  plugins: {
    legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 11, weight: '600' }, boxWidth: 12, padding: 16 } },
    tooltip: {
      backgroundColor: 'rgba(6,8,24,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 12,
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { color: '#64748b', font: { size: 11 } } }
  }
};

export default function HistoryChart({ period }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchHistory(period).then((data) => {
      setChartData({
        labels: data.map(d => d.dept),
        datasets: [
          { label: 'Upload (MB)',   data: data.map(d => d.upload_mb),   backgroundColor: 'rgba(245,158,11,0.75)',  borderRadius: 6, borderSkipped: false },
          { label: 'Download (MB)', data: data.map(d => d.download_mb), backgroundColor: 'rgba(99,102,241,0.75)', borderRadius: 6, borderSkipped: false }
        ]
      });
    }).catch(() => {});
  }, [period]);

  if (!chartData) return (
    <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
      Loading…
    </div>
  );

  return <Bar data={chartData} options={OPTIONS} />;
}
