import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Legend, Tooltip
} from 'chart.js';
import { requireSupabase } from '../lib/supabase';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);


const INITIAL_DATA = {
  labels: [],
  datasets: [
    {
      label: 'Upload MB/s',
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.06)',
      data: [], fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2
    },
    {
      label: 'Download MB/s',
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.06)',
      data: [], fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2
    }
  ]
};

const OPTIONS = {
  responsive: true,
  animation: { duration: 400 },
  interaction: { mode: 'index', intersect: false },
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
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 10 } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      beginAtZero: true,
      ticks: { color: '#64748b', font: { size: 10 } },
      title: { display: true, text: 'MB/s', color: '#64748b', font: { size: 11 } }
    }
  }
};

export default function LiveChart({ ip }) {
  const labelsRef   = useRef([]);
  const uploadRef   = useRef([]);
  const downloadRef = useRef([]);
  const chartRef    = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await requireSupabase().from('usage_logs').select('bytes_sent,bytes_recv,timestamp').eq('ip', ip).order('timestamp', { ascending: false }).limit(1).maybeSingle();
        if (error || !data) return;
        const time = new Date(data.timestamp).toLocaleTimeString();
        const up   = (data.bytes_sent / (1024 * 1024)).toFixed(3);
        const down = (data.bytes_recv / (1024 * 1024)).toFixed(3);

        labelsRef.current.push(time);
        uploadRef.current.push(up);
        downloadRef.current.push(down);

        if (labelsRef.current.length > 20) {
          labelsRef.current.shift();
          uploadRef.current.shift();
          downloadRef.current.shift();
        }

        if (chartRef.current) {
          chartRef.current.data.labels           = [...labelsRef.current];
          chartRef.current.data.datasets[0].data = [...uploadRef.current];
          chartRef.current.data.datasets[1].data = [...downloadRef.current];
          chartRef.current.update();
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [ip]);

  return <Line ref={chartRef} data={INITIAL_DATA} options={OPTIONS} />;
}
