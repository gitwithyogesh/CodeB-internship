import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

export default function SimulatedEmails({ onVerificationSuccess }) {
  const [emails, setEmailList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState({});

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/auth/emails');
      if (res.ok) {
        const data = await res.json();
        setEmailList(data);
      }
    } catch (e) {
      console.error("Failed to fetch simulated emails", e);
    }
  };

  const clearEmails = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/emails/clear', { method: 'POST' });
      setEmailList([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerVerification = async (token) => {
    setVerifying(prev => ({ ...prev, [token]: true }));
    try {
      const res = await fetch(`/api/auth/verify?token=${token}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Account verified successfully!");
        fetchEmails();
        if (onVerificationSuccess) onVerificationSuccess();
      } else {
        alert(data.message || "Verification failed");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setVerifying(prev => ({ ...prev, [token]: false }));
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="simulated-inbox animate-fade">
      <div className="simulated-inbox-header">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={16} /> Mock Email Inbox (Simulator)
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchEmails} 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '10px' }}
            title="Refresh Inbox"
          >
            <RefreshCw size={12} />
          </button>
          <button 
            onClick={clearEmails} 
            className="btn btn-danger" 
            style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(239,68,68,0.1)' }}
            disabled={loading}
            title="Clear Inbox"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {emails.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          No emails sent yet. Try registering an account or clicking "Forgot Password"!
        </div>
      ) : (
        emails.map((email, idx) => (
          <div key={idx} className="email-item">
            <div className="email-item-header">
              To: {email.recipient}
            </div>
            <div style={{ fontWeight: '600', margin: '4px 0', fontSize: '11px', color: 'var(--text-main)' }}>
              Subject: {email.subject}
            </div>
            <div className="email-item-content">
              {email.content}
            </div>
            
            {email.subject.includes("Verification") && (
              <button 
                onClick={() => triggerVerification(email.token)}
                className="btn btn-success"
                style={{ 
                  marginTop: '8px', 
                  padding: '4px 10px', 
                  fontSize: '11px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  width: '100%'
                }}
                disabled={verifying[email.token]}
              >
                <CheckCircle2 size={12} /> 
                {verifying[email.token] ? 'Verifying...' : 'Click Here to Automatically Verify Email'}
              </button>
            )}

            {email.subject.includes("Reset") && (
              <a 
                href={`/reset-password?token=${email.token}`}
                className="btn btn-primary"
                style={{ 
                  marginTop: '8px', 
                  padding: '4px 10px', 
                  fontSize: '11px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: 'white',
                  width: '100%'
                }}
              >
                Click Here to Reset Password
              </a>
            )}
            
            <div className="email-item-time">
              {new Date(email.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
