import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useAuth();
  const history = useHistory();
  const location = useLocation();
  const from = (location.state && location.state.from && location.state.from.pathname) || '/';

  function handleChange(e) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[e.target.name] = e.target.value;
      return next;
    });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      auth.login(res.data.token, res.data.user);
      history.replace(from);
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">Gifting CRM</div>
          <div className="login-logo-sub">Corporate Gifting Management</div>
        </div>

        <div className="login-title">Sign in to your account</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              className="form-control"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16, marginRight: 6 }} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Default: admin@giftingcrm.com / Admin@123
        </p>
      </div>
    </div>
  );
}

export default Login;
