import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useSocket } from '../hooks/useSocket';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SimpleDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realtimeData, setRealtimeData] = useState([]);

  const [timePeriod, setTimePeriod] = useState('1H');
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      const handleNetworkData = (data) => {
        setRealtimeData(prevData => {
          const existingIndex = prevData.findIndex(item => item.departmentId === data.departmentId);
          if (existingIndex >= 0) {
            const updated = [...prevData];
            updated[existingIndex] = data;
            return updated;
          } else {
            return [...prevData, data];
          }
        });
        
        // Store historical data
        setHistoricalData(prev => {
          const newData = [...prev, { ...data, timestamp: new Date(data.timestamp) }];
          // Keep data based on time period
          const now = new Date();
          const cutoff = new Date(now.getTime() - getTimeRange());
          return newData.filter(d => d.timestamp >= cutoff).slice(-200); // Max 200 points
        });
      };
      
      socket.on('networkData', handleNetworkData);
      
      return () => {
        socket.off('networkData', handleNetworkData);
      };
    }
  }, [socket]);

  const getTimeRange = () => {
    switch(timePeriod) {
      case '1H': return 60 * 60 * 1000; // 1 hour
      case '6H': return 6 * 60 * 60 * 1000; // 6 hours
      case '24H': return 24 * 60 * 60 * 1000; // 24 hours
      default: return 60 * 60 * 1000;
    }
  };

  const getSpeedTrendData = () => {
    if (historicalData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Download Speed (Mbps)',
            data: [0],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Upload Speed (Mbps)',
            data: [0],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          }
        ]
      };
    }

    // Filter data by time period and department
    const now = new Date();
    const cutoff = new Date(now.getTime() - getTimeRange());
    let filteredData = historicalData.filter(d => d.timestamp >= cutoff);
    
    if (selectedDept) {
      filteredData = filteredData.filter(d => d.department === selectedDept);
    }
    
    // Group data by time intervals
    const interval = getTimeRange() / 10; // 10 data points
    const groupedData = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(cutoff.getTime() + (i * interval));
      const endTime = new Date(cutoff.getTime() + ((i + 1) * interval));
      
      const dataInRange = filteredData.filter(d => 
        d.timestamp >= startTime && d.timestamp < endTime && d.isOnline
      );
      
      if (dataInRange.length > 0) {
        const avgDownload = dataInRange.reduce((sum, d) => sum + d.downloadSpeed, 0) / dataInRange.length;
        const avgUpload = dataInRange.reduce((sum, d) => sum + d.uploadSpeed, 0) / dataInRange.length;
        
        groupedData.push({
          time: startTime,
          download: avgDownload,
          upload: avgUpload
        });
      }
    }
    
    const labels = groupedData.map(d => {
      if (timePeriod === '1H') return d.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (timePeriod === '6H') return d.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return d.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Download Speed (Mbps)',
          data: groupedData.map(d => d.download.toFixed(1)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Upload Speed (Mbps)',
          data: groupedData.map(d => d.upload.toFixed(1)),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        }
      ]
    };
  };

  const speedTrendData = getSpeedTrendData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      }
    },
    scales: {
      y: { beginAtZero: true },
      x: {}
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    backdropFilter: 'blur(10px)'
  };

  const metricCardStyle = {
    ...cardStyle,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  };

  const gridStyle = {
    display: 'grid',
    gap: '24px'
  };

  const statsGridStyle = {
    ...gridStyle,
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    marginBottom: '24px'
  };

  const mainGridStyle = {
    ...gridStyle,
    gridTemplateColumns: '1fr 2fr',
    marginBottom: '24px'
  };

  return (
    <div>
      {/* Stats Cards */}
      <div style={statsGridStyle}>
        <div style={{
          ...metricCardStyle,
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#065f46', margin: '0 0 8px 0', fontWeight: '600' }}>Online Devices</p>
              <p style={{ fontSize: '36px', fontWeight: '800', color: '#059669', margin: 0, letterSpacing: '-0.025em' }}>{realtimeData.filter(d => d.isOnline).length}</p>
              <p style={{ fontSize: '13px', color: '#047857', margin: '6px 0 0 0', fontWeight: '500' }}>+2 from yesterday</p>
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
            </div>
          </div>
        </div>

        <div style={{
          ...metricCardStyle,
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#991b1b', margin: '0 0 8px 0', fontWeight: '600' }}>Offline Devices</p>
              <p style={{ fontSize: '36px', fontWeight: '800', color: '#dc2626', margin: 0, letterSpacing: '-0.025em' }}>{realtimeData.filter(d => !d.isOnline).length}</p>
              <p style={{ fontSize: '13px', color: '#b91c1c', margin: '6px 0 0 0', fontWeight: '500' }}>Needs attention</p>
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
            </div>
          </div>
        </div>

        <div style={{
          ...metricCardStyle,
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#1e40af', margin: '0 0 8px 0', fontWeight: '600' }}>Avg Download</p>
              <p style={{ fontSize: '36px', fontWeight: '800', color: '#2563eb', margin: 0, letterSpacing: '-0.025em' }}>{realtimeData.length > 0 ? (realtimeData.filter(d => d.isOnline).reduce((sum, d) => sum + d.downloadSpeed, 0) / realtimeData.filter(d => d.isOnline).length).toFixed(1) : '0'}</p>
              <p style={{ fontSize: '13px', color: '#1d4ed8', margin: '6px 0 0 0', fontWeight: '500' }}>Mbps</p>
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}>
              <span style={{ fontSize: '24px' }}>📥</span>
            </div>
          </div>
        </div>

        <div style={{
          ...metricCardStyle,
          background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b21a8', margin: '0 0 8px 0', fontWeight: '600' }}>Avg Upload</p>
              <p style={{ fontSize: '36px', fontWeight: '800', color: '#7c3aed', margin: 0, letterSpacing: '-0.025em' }}>{realtimeData.length > 0 ? (realtimeData.filter(d => d.isOnline).reduce((sum, d) => sum + d.uploadSpeed, 0) / realtimeData.filter(d => d.isOnline).length).toFixed(1) : '0'}</p>
              <p style={{ fontSize: '13px', color: '#8b5cf6', margin: '6px 0 0 0', fontWeight: '500' }}>Mbps</p>
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
            }}>
              <span style={{ fontSize: '24px' }}>📤</span>
            </div>
          </div>
        </div>
      </div>

      <div style={mainGridStyle}>
        {/* Real-time Status */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Device Status</h3>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#10b981' }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                marginRight: '8px',
                animation: 'pulse 2s infinite'
              }}></div>
              Live
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {realtimeData.map((device, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: device.isOnline ? '#10b981' : '#ef4444',
                    borderRadius: '50%'
                  }}></div>
                  <div>
                    <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>{device.department}</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{device.ip}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>
                    {device.isOnline ? `${device.downloadSpeed?.toFixed(1)} Mbps` : 'Offline'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    {device.isOnline ? `${device.responseTime}ms` : 'No connection'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Trends Chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Network Speed Trends</h3>
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
                    padding: '4px 12px',
                    fontSize: '12px',
                    backgroundColor: timePeriod === period ? '#3b82f6' : '#f3f4f6',
                    color: timePeriod === period ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={speedTrendData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
