import React, { useEffect, useState, useCallback } from 'react';
import LiveChart from './components/LiveChart';
import HistoryChart from './components/HistoryChart';
import { supabase, requireSupabase } from './lib/supabase';
import { fetchDepartments, fetchConfig, fetchDowntime, fetchNetworkSpeed, saveDepartment, removeDepartment, saveConfig, logAudit } from './lib/data';
import './App.css';
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/

const NAV_ITEMS = [
  { id: 'dashboard', icon: '⚡', label: 'Dashboard', href: '#top' },
  { id: 'charts',    icon: '📊', label: 'Charts',    href: '#charts-section' },
  { id: 'downtime',  icon: '⏱', label: 'Downtime',  href: '#downtime-section' },
  { id: 'settings',  icon: '⚙️', label: 'Settings',  href: '#settings-section' },
];

function Toast({ messages }) {
  return (
    <div className="toast-container">
      {messages.map(m => <div key={m.id} className={`toast ${m.type}`}>{m.text}</div>)}
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <div className="time-badge">🕐 {time.toLocaleTimeString()}</div>;
}

function Dashboard({ onSignOut }) {
  const [departments, setDepartments] = useState([]);
  const [config, setConfig]           = useState({ threshold: 5.0, bandwidth: 50 });
  const [speed, setSpeed]             = useState('—');
  const [downtime, setDowntime]       = useState([]);
  const [toasts, setToasts]           = useState([]);
  const [dept, setDept]               = useState('');
  const [ip, setIp]                   = useState('');
  const [threshold, setThreshold]     = useState('');
  const [bandwidth, setBandwidth]     = useState('');
  const [activeNav, setActiveNav]     = useState('dashboard');

  const addToast = useCallback((text, type = '') => {
    const id = Date.now();
    setToasts(t => [...t, { text, type, id }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [deps, cfg, dt] = await Promise.all([fetchDepartments(), fetchConfig(), fetchDowntime()]);
      setDepartments(deps); setConfig(cfg); setDowntime(dt);
    } catch (err) { console.error('Could not load dashboard data:', err.message); }
  }, [addToast]);

  const fetchSpeed = useCallback(async () => {
    try {
      const s = await fetchNetworkSpeed();
      setSpeed(s.toFixed(2));
      if (s > 10) addToast(`🔥 High speed: ${s.toFixed(2)} MB/s`, 'warn');
    } catch (err) { console.error('Could not fetch network speed:', err.message); }
  }, [addToast]);

  useEffect(() => {
    fetchAll(); fetchSpeed();
    const t1 = setInterval(fetchAll, 5000);
    const t2 = setInterval(fetchSpeed, 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchAll, fetchSpeed]);

  const addDept = async (e) => {
    e.preventDefault();
    if (!IP_REGEX.test(ip)) return addToast('❌ Invalid IP address format', 'danger');
    if (!dept.trim()) return addToast('❌ Department name is required', 'danger');
    try {
      await saveDepartment(dept.trim(), ip.trim());
      await logAudit('ADD_DEPT', `dept=${dept.trim()} ip=${ip.trim()}`);
      setDept(''); setIp('');
      fetchAll();
      addToast(`✅ ${dept} added successfully`);
    } catch (err) {
      addToast(`❌ ${err.message || 'Failed to add department'}`, 'danger');
    }
  };

  const deleteDept = async (d) => {
    try {
      await removeDepartment(d);
      await logAudit('DELETE_DEPT', `dept=${d}`);
      fetchAll();
      addToast(`🗑 ${d} removed`);
    } catch (err) {
      addToast(`❌ ${err.message || 'Failed to remove department'}`, 'danger');
    }
  };

  const saveThreshold = async (e) => {
    e.preventDefault();
    const val = parseFloat(threshold);
    if (isNaN(val) || val <= 0) return addToast('❌ Threshold must be a positive number', 'danger');
    try {
      await saveConfig('threshold', val);
      await logAudit('SET_THRESHOLD', `value=${val}`);
      setThreshold(''); fetchAll();
      addToast('✅ Threshold updated');
    } catch (err) {
      addToast(`❌ ${err.message || 'Failed to update threshold'}`, 'danger');
    }
  };

  const saveBandwidth = async (e) => {
    e.preventDefault();
    const val = parseInt(bandwidth);
    if (isNaN(val) || val <= 0) return addToast('❌ Bandwidth must be a positive number', 'danger');
    try {
      await saveConfig('bandwidth', val);
      await logAudit('SET_BANDWIDTH', `value=${val}`);
      setBandwidth(''); fetchAll();
      addToast('✅ Bandwidth updated');
    } catch (err) {
      addToast(`❌ ${err.message || 'Failed to update bandwidth'}`, 'danger');
    }
  };

  const navItems = NAV_ITEMS;

  return (
    <div className="layout">
      <Toast messages={toasts} />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">📡</div>
          <div className="logo-text">Bandwidth<span>Mon</span></div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Navigation</div>
          {navItems.map(n => (
            <a
              key={n.id}
              className={`nav-item ${activeNav === n.id ? 'active' : ''}`}
              href={n.href}
              onClick={() => setActiveNav(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </a>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-inner">
            <div className="footer-avatar">🛡️</div>
            <div>
              <div className="footer-name">Admin</div>
              <div className="footer-role">Network Monitor v2.0</div>
            </div>
            <button className="btn btn-danger" onClick={onSignOut}>Sign out</button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main" id="top">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <h1>Network Dashboard</h1>
            <p>Real-time IP bandwidth monitoring & analytics</p>
          </div>
          <div className="topbar-right">
            <Clock />
            <div className="live-badge">
              <div className="live-dot"></div> Live Monitoring
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-top">
              <div className="stat-icon">🖥️</div>
              <span className="stat-trend">Active</span>
            </div>
            <div className="stat-value">{departments.length}</div>
            <div className="stat-label">Monitored IPs</div>
          </div>
          <div className="stat-card green">
            <div className="stat-top">
              <div className="stat-icon">📶</div>
              <span className="stat-trend">Live</span>
            </div>
            <div className="stat-value">{speed}</div>
            <div className="stat-label">Current Speed (MB/s)</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-top">
              <div className="stat-icon">⚡</div>
              <span className="stat-trend">Set</span>
            </div>
            <div className="stat-value">{config.bandwidth}<span style={{fontSize:14,fontWeight:500,color:'var(--muted)'}}> MB</span></div>
            <div className="stat-label">Leased Bandwidth</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-top">
              <div className="stat-icon">🚨</div>
              <span className="stat-trend">Alert</span>
            </div>
            <div className="stat-value">{config.threshold}</div>
            <div className="stat-label">Threshold (MB/s)</div>
          </div>
        </div>

        {/* Departments */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-title-icon">🖧</div>
              Registered Departments
            </div>
            <span className="section-badge">{departments.length} IPs</span>
          </div>

          <form className="add-form" onSubmit={addDept}>
            <div className="form-group">
              <label>Department Name</label>
              <input value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. HR, IT, Admin" required />
            </div>
            <div className="form-group">
              <label>IP Address</label>
              <input value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.10" required />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">➕ Add Department</button>
            </div>
          </form>

          {departments.length === 0
            ? <div className="empty">
                <span className="empty-icon">📭</span>
                <p>No departments added yet</p>
                <small>Add a department above to start monitoring</small>
              </div>
            : <div className="ip-list">
                {departments.map(d => (
                  <div className="ip-item" key={d.dept}>
                    <div className="ip-info">
                      <div className="ip-avatar">🏢</div>
                      <div>
                        <div className="ip-dept">{d.dept}</div>
                        <div className="ip-addr">{d.ip}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="ip-status"><div className="ip-status-dot"></div> Online</div>
                      <button className="btn btn-danger" onClick={() => deleteDept(d.dept)}>🗑 Remove</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Charts */}
        <div className="section" id="charts-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-title-icon">📊</div>
              Live Bandwidth Charts
            </div>
            <span className="section-badge">Updates every 2s</span>
          </div>

          {departments.length === 0
            ? <div className="empty">
                <span className="empty-icon">📡</span>
                <p>No data to display</p>
                <small>Add a department IP to see live charts</small>
              </div>
            : departments.length <= 3
              ? <div className="charts-grid">
                  {departments.map(d => (
                    <div className="chart-card" key={d.ip}>
                      <div className="chart-header">
                        <div className="chart-title">📡 {d.dept}</div>
                        <span className="chart-ip">{d.ip}</span>
                      </div>
                      <LiveChart ip={d.ip} />
                    </div>
                  ))}
                </div>
              : <div className="charts-grid">
                  {['daily', 'weekly', 'monthly'].map(p => (
                    <div className="chart-card" key={p}>
                      <div className="chart-header">
                        <div className="chart-title">📅 {p.charAt(0).toUpperCase() + p.slice(1)} Usage</div>
                      </div>
                      <HistoryChart period={p} />
                    </div>
                  ))}
                </div>
          }
        </div>

        {/* Downtime */}
        <div className="section" id="downtime-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-title-icon">⏱</div>
              Downtime Logs
            </div>
            <span className="section-badge">{downtime.length} records</span>
          </div>

          {downtime.length > 0 && (
            <div className="downtime-cards">
              {downtime.map((d, i) => (
                <div className="downtime-card" key={i}>
                  <div className="downtime-card-dept">{d.dept}</div>
                  <div className="downtime-card-time">
                    {Math.floor(d.seconds / 60)}m {d.seconds % 60}s downtime
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Department</th><th>Start Time</th><th>End Time</th>
                  <th>Duration</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {downtime.length === 0
                  ? <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                      No downtime recorded
                    </td></tr>
                  : downtime.map((l, i) => (
                      <tr key={i}>
                        <td><strong style={{ color: 'var(--text)' }}>{l.dept}</strong></td>
                        <td>{l.start}</td>
                        <td>{l.end}</td>
                        <td style={{ fontWeight: 600 }}>{l.minutes} min</td>
                        <td>
                          <span className={`badge ${l.minutes < 1 ? 'badge-green' : l.minutes < 5 ? 'badge-yellow' : 'badge-red'}`}>
                            {l.minutes < 1 ? 'Short' : l.minutes < 5 ? 'Moderate' : 'Long'}
                          </span>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Settings */}
        <div className="section" id="settings-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-title-icon">⚙️</div>
              Configuration
            </div>
          </div>
          <div className="config-row">
            <div className="config-card">
              <div className="config-card-header">
                <div className="config-icon red">🚨</div>
                <div>
                  <div className="config-card-title">Alert Threshold</div>
                  <div className="config-card-sub">Current: {config.threshold} MB/s</div>
                </div>
              </div>
              <form style={{ display: 'flex', gap: 10 }} onSubmit={saveThreshold}>
                <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                  placeholder={config.threshold} step="0.1" min="0.1" required style={{ flex: 1, width: 'auto' }} />
                <button type="submit" className="btn btn-save">💾 Save</button>
              </form>
            </div>
            <div className="config-card">
              <div className="config-card-header">
                <div className="config-icon cyan">📶</div>
                <div>
                  <div className="config-card-title">Leased Bandwidth</div>
                  <div className="config-card-sub">Current: {config.bandwidth} MB</div>
                </div>
              </div>
              <form style={{ display: 'flex', gap: 10 }} onSubmit={saveBandwidth}>
                <input type="number" value={bandwidth} onChange={e => setBandwidth(e.target.value)}
                  placeholder={config.bandwidth} min="1" required style={{ flex: 1, width: 'auto' }} />
                <button type="submit" className="btn btn-save">💾 Save</button>
              </form>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return undefined; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { error: authError } = await requireSupabase().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err) { setError(err.message || 'Sign in failed'); }
    finally { setBusy(false); }
  };

  if (!ready) return <div className="auth-page">Connecting to Supabase…</div>;
  if (!supabase) return <div className="auth-page"><div className="auth-card"><h1>Supabase setup required</h1><p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the frontend environment.</p></div></div>;
  if (!session) return <div className="auth-page"><form className="auth-card" onSubmit={signIn}><h1>Bandwidth Monitor</h1><p>Sign in with your Supabase admin account.</p>{error && <div className="auth-error">{error}</div>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label><button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form></div>;
  return <Dashboard onSignOut={() => supabase.auth.signOut()} />;
}
