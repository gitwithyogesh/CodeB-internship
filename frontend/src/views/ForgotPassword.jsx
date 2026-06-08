import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import SimulatedEmails from '../components/SimulatedEmails';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Password reset instruction sent! Please check the mock inbox below.');
        setEmail('');
      } else {
        setError(data.message || 'Error requesting reset.');
      }
    } catch (e) {
      setError('Connection to backend failed. Make sure the Spring Boot server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '440px' }}>
        <div className="auth-card glass animate-fade">
          <div className="auth-header">
            <h1 className="gradient-text">Reset Password</h1>
            <p>Enter your email to receive a password reset token</p>
          </div>

          {error && (
            <div className="alert alert-danger animate-fade">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="alert alert-success animate-fade">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
              {loading ? (
                <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
              ) : (
                <>
                  <Send size={16} /> Send Reset Link
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            <Link to="/login" className="link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>

        {/* Mock email display so users can see verification and password resets */}
        <SimulatedEmails />
      </div>
    </div>
  );
}
