import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DepartmentManager() {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState({ dept: '', ip: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`http://localhost:5001/api/departments/${editingId}`, newDept);
        setEditingId(null);
      } else {
        await axios.post('http://localhost:5001/api/departments', newDept);
      }
      setNewDept({ dept: '', ip: '' });
      fetchDepartments();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setNewDept({ dept: dept.dept, ip: dept.ip });
    setEditingId(dept._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:5001/api/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        alert('Error deleting department');
      } finally {
        setLoading(false);
      }
    }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    marginBottom: '24px'
  };

  const btnPrimaryStyle = {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const btnSecondaryStyle = {
    background: '#f3f4f6',
    color: '#374151',
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: '12px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease'
  };

  const statusStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Add/Edit Form */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '32px', height: '32px', background: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#2563eb', fontSize: '18px', fontWeight: 'bold' }}>+</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            {editingId ? 'Edit Department' : 'Add New Department'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Department Name
              </label>
              <input
                type="text"
                value={newDept.dept}
                onChange={(e) => setNewDept({...newDept, dept: e.target.value})}
                required
                style={inputStyle}
                placeholder="e.g., IT Department"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                IP Address
              </label>
              <input
                type="text"
                value={newDept.ip}
                onChange={(e) => setNewDept({...newDept, ip: e.target.value})}
                required
                pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                style={inputStyle}
                placeholder="e.g., 192.168.1.10"
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit"
              disabled={loading}
              style={{ ...btnPrimaryStyle, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Processing...' : (editingId ? 'Update Department' : 'Add Department')}
            </button>
            {editingId && (
              <button 
                type="button"
                onClick={() => { setEditingId(null); setNewDept({ dept: '', ip: '' }); }}
                style={btnSecondaryStyle}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Departments List */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Departments Overview</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
            <span>📋</span>
            <span>{departments.length} departments</span>
          </div>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #f3f4f6', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : departments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h4 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>No departments yet</h4>
            <p style={{ color: '#6b7280' }}>Add your first department to start monitoring network usage.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Department
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    IP Address
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                          <span style={{ color: '#2563eb', fontWeight: '600', fontSize: '14px' }}>
                            {dept.dept.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{dept.dept}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Department</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#111827', fontFamily: 'monospace' }}>{dept.ip}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={statusStyle}>
                        <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', marginRight: '6px' }}></span>
                        Active
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => handleEdit(dept)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(dept._id)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}