import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from './Dashboard';
import Hierarchy from './Hierarchy';
import Clients from './Clients';
import Estimates from './Estimates';
import Invoices from './Invoices';
import Users from './Users';
import { User, Shield } from 'lucide-react';

export default function DashboardPlaceholder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { fullName: 'User', role: 'SALES_PERSON', email: '' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090a0f', color: '#f3f4f6', display: 'flex' }}>
      
      {/* Sidebar navigation panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user.role} 
        handleLogout={handleLogout} 
      />

      {/* Main Shell Page Content */}
      <div style={{
        marginLeft: '260px', // matches sidebar width
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        
        {/* Top Header Row */}
        <header style={{
          height: '70px',
          background: 'rgba(18, 20, 30, 0.4)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{user.fullName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.email}</div>
            </div>
            <div style={{ 
              background: 'var(--primary-gradient)', 
              padding: '8px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} color="white" />
            </div>
            <span className="verify-badge" style={{ 
              background: user.role === 'ADMIN' ? 'rgba(236,72,153,0.15)' : 'var(--primary-glow)',
              color: user.role === 'ADMIN' ? 'var(--secondary)' : 'var(--primary)',
              border: 'none',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 700
            }}>
              {user.role}
            </span>
          </div>
        </header>

        {/* Dynamic Tab Pane Render */}
        <main style={{ padding: '32px', flex: 1 }}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'hierarchy' && <Hierarchy userRole={user.role} />}
          {activeTab === 'clients' && <Clients userRole={user.role} />}
          {activeTab === 'estimates' && <Estimates userRole={user.role} />}
          {activeTab === 'invoices' && <Invoices userRole={user.role} />}
          {activeTab === 'users' && <Users />}
        </main>

      </div>

    </div>
  );
}
