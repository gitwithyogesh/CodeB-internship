import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Shield, UserPlus, AlertCircle } from 'lucide-react';
import SimulatedEmails from '../components/SimulatedEmails';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALES_PERSON'); // Default
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Registration successful! Check the simulated inbox below to verify.');
        // Clear fields
        setFullName('');
        setEmail('');
        setPassword('');
      } else {
        setError(data.message || 'Registration failed. Try again.');
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
            <h1 className="gradient-text">Create Account</h1>
            <p>Register a new user in the Code-B IMS</p>
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

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>System Role</label>
              <div className="input-wrapper">
                <Shield className="input-icon" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="SALES_PERSON">Sales Person (Non-Admin)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
              {loading ? (
                <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
              ) : (
                <>
                  <UserPlus size={16} /> Register
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign In here
            </Link>
          </div>
        </div>

        {/* Mock email display so users can see verification and password resets */}
        <SimulatedEmails onVerificationSuccess={() => navigate('/login')} />
      </div>
    </div>
  );
}
