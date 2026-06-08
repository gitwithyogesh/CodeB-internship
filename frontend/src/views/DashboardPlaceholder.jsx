import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield } from 'lucide-react';

export default function DashboardPlaceholder() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { fullName: 'User', role: 'SALES_PERSON', email: '' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px', background: '#090a0f', color: '#f3f4f6' }}>
      <div className="glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 className="gradient-text" style={{ fontFamily: 'var(--font-title)', fontSize: '32px' }}>
          Welcome to Code-B IMS
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ background: 'var(--primary-gradient)', padding: '16px', borderRadius: '50%' }}>
            <User size={32} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-title)' }}>{user.fullName}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>System Role:</span>
            <span style={{ fontWeight: '600', color: user.role === 'ADMIN' ? 'var(--secondary)' : 'var(--primary)' }}>
              {user.role}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Session Status:</span>
            <span style={{ color: 'var(--success)' }}>Active & Secure</span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
