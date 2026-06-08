import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users, 
  Calendar, 
  CheckCircle, 
  Activity, 
  Coffee, 
  PlusCircle, 
  AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local Interactive States
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState('--:--:--');

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to fetch dashboard metrics.');
      }
    } catch (e) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Live clock for Clock In/Out button
    const clockInterval = setInterval(() => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span className="animate-spin" style={{ 
          display: 'inline-block', 
          width: '32px', 
          height: '32px', 
          border: '3px solid var(--primary)', 
          borderTopColor: 'transparent', 
          borderRadius: '50%' 
        }}></span>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Welcome Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: 700 }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Real-time billing, invoicing insights, and HR activity tracker.
          </p>
        </div>
        
        {/* Interactive Clock-In Widget */}
        <div className="glass" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: clockedIn ? 'var(--success)' : 'var(--text-secondary)' }}>
              {clockedIn ? 'CLOCKED IN' : 'CLOCKED OUT'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{clockTime}</div>
          </div>
          <button 
            onClick={() => setClockedIn(!clockedIn)} 
            className={`btn ${clockedIn ? 'btn-danger' : 'btn-success'}`}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1 */}
        <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '12px', borderRadius: '8px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>TOTAL SALES</span>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
              {formatCurrency(stats?.totalSales)}
            </h3>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)' }}></div>
        </div>

        {/* Card 2 */}
        <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '12px', borderRadius: '8px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>REVENUE COLLECTED</span>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
              {formatCurrency(stats?.collectedRevenue)}
            </h3>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--success)' }}></div>
        </div>

        {/* Card 3 */}
        <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', padding: '12px', borderRadius: '8px' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>PENDING BALANCE</span>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
              {formatCurrency(stats?.pendingRevenue)}
            </h3>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--warning)' }}></div>
        </div>

        {/* Card 4 */}
        <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--secondary)', padding: '12px', borderRadius: '8px' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>ACTIVE CLIENTS</span>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
              {stats?.totalClients || 0}
            </h3>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--secondary)' }}></div>
        </div>
      </div>

      {/* Main Charts & Widgets Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Custom SVG Chart Area */}
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: 600 }}>Monthly Billings Overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Aggregated billings over recent periods</p>
          </div>
          
          <div style={{ height: '240px', width: '100%', position: 'relative', padding: '10px 0' }}>
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 500 200" width="100%" height="100%">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

              {/* Area Gradient */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* Area Path */}
              <path d="M 40 170 Q 120 150 200 110 T 360 80 T 480 50 L 480 170 L 40 170 Z" fill="url(#chartGrad)" />

              {/* Line Path */}
              <path d="M 40 170 Q 120 150 200 110 T 360 80 T 480 50" fill="none" stroke="var(--primary)" strokeWidth="3" />

              {/* Points */}
              <circle cx="40" cy="170" r="4" fill="var(--primary)" stroke="white" strokeWidth="1" />
              <circle cx="120" cy="150" r="4" fill="var(--primary)" stroke="white" strokeWidth="1" />
              <circle cx="200" cy="110" r="4" fill="var(--primary)" stroke="white" strokeWidth="1" />
              <circle cx="360" cy="80" r="4" fill="var(--primary)" stroke="white" strokeWidth="1" />
              <circle cx="480" cy="50" r="4" fill="var(--primary)" stroke="white" strokeWidth="1" />

              {/* Labels */}
              <text x="35" y="190" fill="var(--text-muted)" fontSize="10">Jan</text>
              <text x="115" y="190" fill="var(--text-muted)" fontSize="10">Feb</text>
              <text x="195" y="190" fill="var(--text-muted)" fontSize="10">Mar</text>
              <text x="355" y="190" fill="var(--text-muted)" fontSize="10">Apr</text>
              <text x="470" y="190" fill="var(--text-muted)" fontSize="10">May</text>
            </svg>
          </div>
        </div>

        {/* HR Staff Attendance & Leaves */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={18} color="var(--primary)" /> Staff Attendance
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Attendance Rate</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>{stats?.employeeAttendanceRate}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Checked In Today</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{stats?.staffCheckedIn}</span>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--secondary)" /> Leave Requests
            </h3>

            {stats?.leaveRequests?.map((req, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{req.employee}</span>
                  <span style={{ 
                    color: req.status === 'APPROVED' ? 'var(--success)' : 'var(--warning)', 
                    fontSize: '10px',
                    fontWeight: 700 
                  }}>
                    {req.status}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{req.type}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>{req.dates}</div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Recent Activity Logger */}
      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--primary)" /> Recent Activity Logs (Audit Trail)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stats?.recentActivities?.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
              No activities logged yet. Create estimates or record payments to generate logs!
            </div>
          ) : (
            stats?.recentActivities?.map((act, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px'
              }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '50%',
                  background: act.type === 'payment' ? 'var(--success-bg)' :
                              act.type === 'invoice' ? 'var(--info-bg)' :
                              act.type === 'estimate' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                  color: act.type === 'payment' ? 'var(--success)' :
                         act.type === 'invoice' ? 'var(--info)' :
                         act.type === 'estimate' ? 'var(--warning)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Activity size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{act.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{act.desc}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(act.time).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
