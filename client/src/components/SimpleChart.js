import React, { useEffect, useState } from 'react';
import { Pie, Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { useSocket } from '../hooks/useSocket';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function SimpleChart() {
  const [activeChart, setActiveChart] = useState('usage');
  const [data, setData] = useState(null);
  const [realTimeData, setRealTimeData] = useState([]);

  const [timePeriod, setTimePeriod] = useState('1H');
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState([]);

  const socket = useSocket();

  useEffect(() => {
    const sampleData = {
      labels: ['IT Department', 'HR Department', 'Finance', 'Marketing'],
      datasets: [
        {
          label: 'Bandwidth Usage (GB)',
          data: [120, 80, 95, 60],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)', 
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(139, 92, 246)'
          ],
          borderWidth: 2
        }
      ]
    };
    setData(sampleData);
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNetworkData = (networkData) => {
        setRealTimeData(prev => {
          const newData = [...prev, {
            ...networkData,
            timestamp: new Date(networkData.timestamp)
          }];
          // Keep only last 20 data points
          return newData.slice(-20);
        });
      };
      
      socket.on('networkData', handleNetworkData);
      
      return () => {
        socket.off('networkData', handleNetworkData);
      };
    }
  }, [socket]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Real-time speed data from socket
  const getRealTimeSpeedData = () => {
    if (realTimeData.length === 0) {
      return {
        labels: ['IT', 'HR', 'Finance', 'Marketing'],
        datasets: [
          {
            label: 'Upload Speed (Mbps)',
            data: [25, 15, 20, 18],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2
          },
          {
            label: 'Download Speed (Mbps)', 
            data: [85, 65, 75, 70],
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2
          }
        ]
      };
    }

    let departments = [...new Set(realTimeData.map(d => d.department))];
    
    // Filter by selected department if any
    if (selectedDept) {
      departments = departments.filter(dept => dept === selectedDept);
    }
    
    const uploadSpeeds = departments.map(dept => {
      const deptData = realTimeData.filter(d => d.department === dept);
      return deptData.length > 0 ? deptData[deptData.length - 1].uploadSpeed : 0;
    });
    const downloadSpeeds = departments.map(dept => {
      const deptData = realTimeData.filter(d => d.department === dept);
      return deptData.length > 0 ? deptData[deptData.length - 1].downloadSpeed : 0;
    });

    return {
      labels: departments,
      datasets: [
        {
          label: 'Upload Speed (Mbps)',
          data: uploadSpeeds,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2
        },
        {
          label: 'Download Speed (Mbps)', 
          data: downloadSpeeds,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2
        }
      ]
    };
  };

  const speedData = getRealTimeSpeedData();

  // Real-time line chart for speed trends
  const getSpeedTrendsData = () => {
    if (realTimeData.length === 0) return null;

    // Filter data based on time period
    const now = new Date();
    const getTimeRange = () => {
      switch(timePeriod) {
        case '1H': return 60 * 60 * 1000;
        case '6H': return 6 * 60 * 60 * 1000;
        case '24H': return 24 * 60 * 60 * 1000;
        default: return 60 * 60 * 1000;
      }
    };
    
    const cutoff = new Date(now.getTime() - getTimeRange());
    let filteredData = realTimeData.filter(d => d.timestamp >= cutoff);
    
    if (selectedDept) {
      filteredData = filteredData.filter(d => d.department === selectedDept);
    }
    
    if (filteredData.length === 0) return null;

    const labels = filteredData.map(d => {
      if (timePeriod === '1H') return d.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (timePeriod === '6H') return d.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return d.timestamp.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    });
    
    const downloadSpeeds = filteredData.map(d => d.downloadSpeed);
    const uploadSpeeds = filteredData.map(d => d.uploadSpeed);

    return {
      labels,
      datasets: [
        {
          label: 'Download Speed (Mbps)',
          data: downloadSpeeds,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Upload Speed (Mbps)',
          data: uploadSpeeds,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const speedTrendsData = getSpeedTrendsData();

  const networkData = {
    labels: ['Active Connections', 'Idle Connections', 'Failed Connections'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12 }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    },
    scales: {
      y: { beginAtZero: true },
      x: {}
    }
  };

  const charts = [
    { id: 'usage', label: 'Bandwidth Usage', icon: '📊' },
    { id: 'speed', label: 'Network Speed', icon: '⚡' },
    { id: 'trends', label: 'Speed Trends', icon: '📈' },
    { id: 'connections', label: 'Connections', icon: '🔗' }
  ];

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  };

  const getButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isActive ? '#3b82f6' : 'white',
    color: isActive ? 'white' : '#374151',
    boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    border: isActive ? 'none' : '1px solid #d1d5db'
  });

  return (
    <div>
      {/* Chart Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        {charts.map(chart => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id)}
            style={getButtonStyle(activeChart === chart.id)}
          >
            <span>{chart.icon}</span>
            <span>{chart.label}</span>
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {activeChart === 'usage' && (
          <>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Bandwidth Distribution
              </h3>
              <div style={{ height: '320px' }}>
                {data && <Pie data={data} options={chartOptions} />}
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Usage Breakdown
              </h3>
              <div style={{ height: '320px' }}>
                {data && <Doughnut data={data} options={chartOptions} />}
              </div>
            </div>
          </>
        )}

        {activeChart === 'speed' && (
          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Network Speed Comparison
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>
                  (Real-time: {realTimeData.length > 0 ? 'Live' : 'Sample Data'})
                </span>
              </h3>
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '14px',
                  borderRadius: '6px', 
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Compare All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept.dept}>
                    {dept.dept} Only
                  </option>
                ))}
              </select>
            </div>
            <div style={{ height: '320px' }}>
              <Bar data={speedData} options={barOptions} />
            </div>
          </div>
        )}

        {activeChart === 'trends' && (
          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Real-time Speed Trends
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>
                  (Last {realTimeData.length} readings)
                </span>
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    borderRadius: '6px', 
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept.dept}>
                      {dept.dept}
                    </option>
                  ))}
                </select>
                {['1H', '6H', '24H'].map(period => (
                  <button 
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: timePeriod === period ? '#3b82f6' : '#f3f4f6',
                      color: timePeriod === period ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '320px' }}>
              {speedTrendsData ? (
                <Line 
                  data={speedTrendsData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Speed (Mbps)' }
                      },
                      x: {
                        title: { display: true, text: 'Time' }
                      }
                    },
                    animation: {
                      duration: 0
                    }
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
                    <p>Waiting for real-time data...</p>
                    <p style={{ fontSize: '14px' }}>Make sure server is running and departments are configured</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeChart === 'connections' && (
          <>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Connection Status
              </h3>
              <div style={{ height: '320px' }}>
                <Doughnut data={networkData} options={chartOptions} />
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Connection Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: '500', color: '#166534' }}>Active Connections</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>65</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: '500', color: '#92400e' }}>Idle Connections</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>25</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: '500', color: '#991b1b' }}>Failed Connections</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>10</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#dbeafe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <span style={{ fontSize: '24px' }}>📊</span>
          </div>
          <h4 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>Total Usage</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: '8px 0' }}>355 GB</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>This month</p>
        </div>

        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <span style={{ fontSize: '24px' }}>📈</span>
          </div>
          <h4 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>Peak Speed</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', margin: '8px 0' }}>95.2 Mbps</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Download</p>
        </div>

        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#ede9fe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <span style={{ fontSize: '24px' }}>⏰</span>
          </div>
          <h4 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>Uptime</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', margin: '8px 0' }}>99.8%</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
