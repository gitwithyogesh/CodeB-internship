import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    const runVerification = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`, { 
          method: 'POST' 
        });
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          setTimeout(() => navigate('/login'), 2500);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (e) {
        setStatus('error');
        setMessage('Network error connecting to backend.');
      }
    };

    runVerification();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card glass animate-fade" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <h1 className="gradient-text">Account Verification</h1>
        
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
            <p style={{ color: 'var(--text-secondary)' }}>Checking verification status...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
            <CheckCircle2 size={40} color="var(--success)" />
            <h3 style={{ color: 'var(--success)' }}>Verification Successful!</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{message}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Redirecting to Login page shortly...</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
            <XCircle size={40} color="var(--danger)" />
            <h3 style={{ color: 'var(--danger)' }}>Verification Failed</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
