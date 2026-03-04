import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { usageAPI, departmentAPI } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [realtimeData, setRealtimeData] = useState([]);
  const [selectedIP, setSelectedIP] = useState('');
  const [departments, setDepartments] = useState([]);
  const [speedData, setSpeedData] = useState(null);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchDepartments();
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedIP) {
      fetchSpeedTrends();
    }
  }, [selectedIP]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await usageAPI.getRealtime();
      setRealtimeData(response.data);
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    }
  };

  const fetchSpeedTrends = async () => {
    try {
      const response = await usageAPI.getTrends(selectedIP, 24);
      const data = response.data;
      
      setSpeedData({
        labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: 'Download Speed (Mbps)',
            data: data.map(d => d.downloadSpeed),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          },
          {
            label: 'Upload Speed (Mbps)',
            data: data.map(d => d.uploadSpeed),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching speed trends:', error);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Network Speed Trends' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🌐 Network Bandwidth Monitor</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <select 
          value={selectedIP} 
          onChange={(e) => setSelectedIP(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Select IP to monitor</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept.ip}>
              {dept.dept} - {dept.ip}
            </option>
          ))}
        </select>
        
        <div>
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                margin: '0 4px',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: period === p ? '#007bff' : '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>📊 Real-time Status</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {realtimeData.slice(0, 5).map((data, index) => (
              <div key={index} style={{ 
                padding: '8px', 
                margin: '4px 0', 
                background: 'white', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <strong>{data.ip}</strong> - ↓{data.downloadSpeed?.toFixed(1)}Mbps ↑{data.uploadSpeed?.toFixed(1)}Mbps
                <br />
                <small>{new Date(data.timestamp).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>🏢 Departments</h3>
          {departments.map(dept => (
            <div key={dept._id} style={{ 
              padding: '8px', 
              margin: '4px 0', 
              background: 'white', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>{dept.dept}</strong> - {dept.ip}
            </div>
          ))}
        </div>
      </div>

      {speedData && (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <Line data={speedData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}