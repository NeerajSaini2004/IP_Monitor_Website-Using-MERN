import React, { useState } from 'react';
import SimpleDashboard from './components/SimpleDashboard';
import DepartmentManager from './components/DepartmentManager';
import DowntimeTracker from './components/DowntimeTracker';
import Settings from './components/Settings';
import SimpleChart from './components/SimpleChart';
import UsageChart from './components/UsageChart';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', component: SimpleDashboard },
    { id: 'usage', label: 'Real-time Charts', icon: '📈', component: SimpleChart },
    { id: 'analytics', label: 'Usage Analytics', icon: '📋', component: UsageChart },
    { id: 'departments', label: 'Departments', icon: '🏢', component: DepartmentManager },
    { id: 'downtime', label: 'Downtime', icon: '⚠️', component: DowntimeTracker },
    { id: 'settings', label: 'Settings', icon: '⚙️', component: Settings }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SimpleDashboard;

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: sidebarCollapsed ? '80px' : '280px',
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRight: '1px solid #334155',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    zIndex: 50,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden'
  };

  const headerStyle = {
    padding: '24px 20px',
    borderBottom: '1px solid #334155',
    background: 'rgba(255, 255, 255, 0.05)'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const logoIconStyle = {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
  };

  const navStyle = {
    marginTop: '32px',
    padding: '0 16px'
  };

  const getTabStyle = (isActive) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    padding: sidebarCollapsed ? '16px 12px' : '16px 20px',
    marginBottom: '8px',
    textAlign: 'left',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: isActive ? '#60a5fa' : '#cbd5e1',
    fontWeight: isActive ? '600' : '500',
    fontSize: '14px',
    position: 'relative',
    backdropFilter: isActive ? 'blur(10px)' : 'none',
    border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
  });

  const mainContentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '280px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const topBarStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  };

  const contentStyle = {
    padding: '32px'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                transition: 'all 0.2s',
                marginRight: sidebarCollapsed ? '0' : '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = '#cbd5e1';
              }}
            >
              <span style={{ fontSize: '16px' }}>☰</span>
            </button>
            {!sidebarCollapsed && (
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                  NetMonitor Pro
                </h1>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Enterprise Analytics</p>
              </div>
            )}
          </div>
        </div>
        
        <nav style={navStyle}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={getTabStyle(activeTab === tab.id)}
              title={sidebarCollapsed ? tab.label : ''}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#cbd5e1';
                }
              }}
            >
              <span style={{ 
                fontSize: '16px',
                marginRight: sidebarCollapsed ? '0' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {tab.icon}
              </span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: '14px', fontWeight: 'inherit' }}>
                  {tab.label}
                </span>
              )}
              {!sidebarCollapsed && activeTab === tab.id && (
                <div style={{
                  marginLeft: 'auto',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#60a5fa',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)'
                }}></div>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Main Content */}
      <div style={mainContentStyle}>
        <header style={topBarStyle}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '15px' }}>
              Monitor and manage your network infrastructure in real-time
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              color: '#059669',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ fontWeight: '600' }}>Live</span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              fontWeight: '500'
            }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>
        
        <main style={contentStyle}>
          <ActiveComponent />
        </main>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default App;