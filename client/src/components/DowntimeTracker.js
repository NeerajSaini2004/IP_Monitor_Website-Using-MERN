import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';

export default function DowntimeTracker() {
  const [downtimeLogs, setDowntimeLogs] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  useEffect(() => {
    fetchDepartments();
    fetchDowntimeLogs();
  }, [period, selectedDept]);

  useEffect(() => {
    if (socket) {
      const handleNetworkData = (data) => {
        fetchDowntimeLogs();
      };
      
      socket.on('networkData', handleNetworkData);
      
      return () => {
        socket.off('networkData', handleNetworkData);
      };
    }
  }, [socket]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDowntimeLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (selectedDept) params.append('dept', selectedDept);
      
      console.log(`Fetching downtime logs for period: ${period}, dept: ${selectedDept || 'all'}`);
      const response = await axios.get(`http://localhost:5001/api/downtime?${params}`);
      console.log(`Received ${response.data.length} downtime logs:`, response.data);
      setDowntimeLogs(response.data);
    } catch (error) {
      console.error('Error fetching downtime logs:', error);
      setDowntimeLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'Ongoing';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTotalDowntime = () => {
    return downtimeLogs.reduce((total, log) => total + (log.duration || 0), 0);
  };

  const getTotalBandwidthLoss = () => {
    return downtimeLogs.reduce((total, log) => total + (log.bandwidthLoss || 0), 0);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#111827', fontSize: '24px', fontWeight: '600' }}>Downtime Tracker</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: loading ? '#f59e0b' : '#10b981',
            borderRadius: '50%',
            animation: loading ? 'pulse 1s infinite' : 'none'
          }}></div>
          <span>{loading ? 'Updating...' : 'Live'}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label>Period: </label>
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
        
        <select 
          value={selectedDept} 
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept.dept}>
              {dept.dept}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Total Incidents</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{downtimeLogs.length}</div>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fd7e14' }}>Total Downtime</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{formatDuration(getTotalDowntime())}</div>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Avg Duration</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
            {downtimeLogs.length > 0 ? formatDuration(Math.round(getTotalDowntime() / downtimeLogs.length)) : '0m'}
          </div>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Bandwidth Loss</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{getTotalBandwidthLoss().toFixed(2)} GB</div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Downtime History</h3>
        {downtimeLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p>No downtime incidents recorded for the selected period.</p>
            <div style={{ fontSize: '12px', marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              <p><strong>Debug Info:</strong></p>
              <p>Period: {period}</p>
              <p>Selected Dept: {selectedDept || 'All'}</p>
              <p>Departments: {departments.length}</p>
              <p>Check server console for ping results</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {downtimeLogs.map(log => (
              <div key={log._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: log.endTime ? '#10b981' : '#ef4444',
                      borderRadius: '50%'
                    }}></div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {log.dept}
                    </h4>
                    <span style={{
                      padding: '2px 8px',
                      fontSize: '12px',
                      backgroundColor: log.endTime ? '#dcfce7' : '#fee2e2',
                      color: log.endTime ? '#166534' : '#991b1b',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}>
                      {log.endTime ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280' }}>
                    <span><strong>Started:</strong> {new Date(log.startTime).toLocaleString()}</span>
                    <span><strong>Ended:</strong> {log.endTime ? new Date(log.endTime).toLocaleString() : 'Ongoing'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: log.endTime ? '#10b981' : '#ef4444' }}>
                    {formatDuration(log.duration)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Downtime</div>
                  {log.leasedBandwidth && (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                      {log.leasedBandwidth} Mbps
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Leased Bandwidth</div>
                  {log.bandwidthLoss && (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444', marginTop: '4px' }}>
                      {log.bandwidthLoss.toFixed(2)} GB
                    </div>
                  )}
                  {log.bandwidthLoss && (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Bandwidth Loss</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
