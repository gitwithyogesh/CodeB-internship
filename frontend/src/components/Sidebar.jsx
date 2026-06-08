import React from 'react';
import { 
  LayoutDashboard, 
  GitMerge, 
  Users, 
  FileText, 
  Receipt, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, userRole, handleLogout }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'hierarchy', name: 'Client Hierarchy', icon: GitMerge },
    { id: 'clients', name: 'Clients Directory', icon: Users },
    { id: 'estimates', name: 'Sales Estimates', icon: FileText },
    { id: 'invoices', name: 'Invoices & Payments', icon: Receipt },
  ];

  // Admin-only menu items
  if (userRole === 'ADMIN') {
    menuItems.push({ id: 'users', name: 'User Management', icon: Settings });
  }

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Logo */}
      <div style={{
        padding: '28px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <h2 className="gradient-text" style={{ 
          fontFamily: 'var(--font-title)', 
          fontWeight: 700, 
          fontSize: '22px',
          letterSpacing: '-0.5px'
        }}>
          Code-B IMS
        </h2>
        <span style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '1px'
        }}>
          MIS & Invoicing
        </span>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                textAlign: 'left'
              }}
              className={isActive ? '' : 'sidebar-btn'}
            >
              <Icon size={18} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div style={{
        padding: '20px 16px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <button
          onClick={handleLogout}
          className="btn btn-danger"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px'
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
