import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/config');
      setConfig(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async (key, value) => {
    try {
      await axios.post('http://localhost:5001/api/config', { key, value });
      alert('Setting saved successfully!');
    } catch (error) {
      alert('Error saving setting: ' + (error.response?.data?.error || error.message));
    }
  };

  const initializeDefaults = async () => {
    try {
      await axios.post('http://localhost:5001/api/config/init');
      fetchConfig();
      alert('Default settings initialized!');
    } catch (error) {
      alert('Error initializing defaults: ' + error.message);
    }
  };

  const seedSampleData = async () => {
    try {
      await axios.get('http://localhost:5001/api/usage/seed');
      alert('Sample data added successfully!');
    } catch (error) {
      alert('Error adding sample data: ' + error.message);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>⚙️ Settings & Configuration</h2>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Threshold Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Download Speed Threshold (Mbps):</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input
                  type="number"
                  value={config.downloadThreshold || ''}
                  onChange={(e) => handleConfigChange('downloadThreshold', e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                  onClick={() => saveConfig('downloadThreshold', config.downloadThreshold)}
                  style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
            
            <div>
              <label>Upload Speed Threshold (Mbps):</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input
                  type="number"
                  value={config.uploadThreshold || ''}
                  onChange={(e) => handleConfigChange('uploadThreshold', e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                  onClick={() => saveConfig('uploadThreshold', config.uploadThreshold)}
                  style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Monitoring Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Check Interval (seconds):</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input
                  type="number"
                  value={config.checkInterval || ''}
                  onChange={(e) => handleConfigChange('checkInterval', e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                  onClick={() => saveConfig('checkInterval', config.checkInterval)}
                  style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
            
            <div>
              <label>Alert Email:</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input
                  type="email"
                  value={config.alertEmail || ''}
                  onChange={(e) => handleConfigChange('alertEmail', e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                  onClick={() => saveConfig('alertEmail', config.alertEmail)}
                  style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>System Actions</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={initializeDefaults}
              style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Initialize Default Settings
            </button>
            
            <button 
              onClick={seedSampleData}
              style={{ padding: '10px 20px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Add Sample Data
            </button>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Current Configuration</h3>
          <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
