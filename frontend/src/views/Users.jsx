import React, { useState, useEffect } from 'react';
import { Shield, User, Power, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setError('Failed to load user records.');
      }
    } catch (e) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (user) => {
    setError('');
    setSuccess('');
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`/api/admin/users/${user.userId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setSuccess(`User ${user.fullName} is now ${newStatus}.`);
        fetchUsers();
      } else {
        setError('Failed to update user status.');
      }
    } catch (e) {
      setError('Server communication failure.');
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: 700 }}>
          User Administration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Deactivate accounts or manage security roles for non-admin (Sales Person) staff.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger animate-fade">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success animate-fade">
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      {/* Main List */}
      <div className="glass" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Name / Email</th>
                <th style={{ padding: '12px' }}>System Role</th>
                <th style={{ padding: '12px' }}>Verified</th>
                <th style={{ padding: '12px' }}>Account Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="var(--text-secondary)" /> {u.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '22px' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="verify-badge" style={{ 
                      background: u.role === 'ADMIN' ? 'rgba(236,72,153,0.15)' : 'var(--primary-glow)',
                      color: u.role === 'ADMIN' ? 'var(--secondary)' : 'var(--primary)',
                      border: 'none',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: u.isVerified ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                      {u.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="verify-badge" style={{ 
                      background: u.status === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: u.status === 'active' ? 'var(--success)' : 'var(--danger)',
                      border: 'none',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleStatus(u)} 
                      className={`btn ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                      title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <Power size={12} /> {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
