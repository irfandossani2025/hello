import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/common/Badge';

function fmt(num) {
  if (!num && num !== 0) return '—';
  return Number(num).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCurrency(num) {
  if (!num && num !== 0) return 'Rs 0';
  return 'Rs ' + Number(num).toLocaleString('en-PK');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(function() {
    api.get('/dashboard/stats')
      .then(function(res) {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(function(err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  var stats = data || {};
  var calls = stats.calls || {};
  var leads = stats.leads || {};
  var quotations = stats.quotations || {};
  var revenue = stats.revenue || {};
  var recent = stats.recent || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue">☎</div>
          <div className="stat-card-label">Total Calls</div>
          <div className="stat-card-value">{fmt(calls.total)}</div>
          <div className="stat-card-sub">{fmt(calls.this_month)} this month</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon purple">◈</div>
          <div className="stat-card-label">Total Leads</div>
          <div className="stat-card-value">{fmt(leads.total)}</div>
          <div className="stat-card-sub">{fmt(leads.new)} new leads</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon yellow">◫</div>
          <div className="stat-card-label">Quotations</div>
          <div className="stat-card-value">{fmt(quotations.total)}</div>
          <div className="stat-card-sub">{quotations.win_rate}% win rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green">✓</div>
          <div className="stat-card-label">Deals Won</div>
          <div className="stat-card-value">{fmt(quotations.won)}</div>
          <div className="stat-card-sub">{fmt(quotations.lost)} lost</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green">$</div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>{fmtCurrency(revenue.total)}</div>
          <div className="stat-card-sub">{fmtCurrency(revenue.this_month)} this month</div>
        </div>
      </div>

      {/* Quotation Pipeline */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 15 }}>Quotation Pipeline</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Draft', count: quotations.draft, color: '#94a3b8' },
            { label: 'Sent', count: quotations.sent, color: '#3b82f6' },
            { label: 'Won', count: quotations.won, color: '#10b981' },
            { label: 'Lost', count: quotations.lost, color: '#ef4444' }
          ].map(function(item) {
            return (
              <div key={item.label} style={{
                flex: '1 1 120px',
                background: '#f8fafc',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '12px 16px',
                borderLeft: '4px solid ' + item.color
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmt(item.count)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Calls */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <span className="table-title">Recent Calls</span>
            <Link to="/calls" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(!recent.calls || recent.calls.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>No calls yet</td></tr>
                )}
                {(recent.calls || []).map(function(c) {
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.caller_name}</div>
                        <div className="td-muted">{c.company_name || '—'}</div>
                      </td>
                      <td><Badge value={c.status} /></td>
                      <td className="td-muted">{fmtDate(c.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <span className="table-title">Recent Leads</span>
            <Link to="/leads" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!recent.leads || recent.leads.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>No leads yet</td></tr>
                )}
                {(recent.leads || []).map(function(l) {
                  return (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{l.name}</div>
                        <div className="td-muted">{l.company_name || '—'}</div>
                      </td>
                      <td><Badge value={l.source} /></td>
                      <td><Badge value={l.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Quotations */}
      <div className="table-wrapper" style={{ marginTop: 20 }}>
        <div className="table-toolbar">
          <span className="table-title">Recent Quotations</span>
          <Link to="/quotations" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(!recent.quotations || recent.quotations.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>No quotations yet</td></tr>
              )}
              {(recent.quotations || []).map(function(q) {
                var lead = q.lead || {};
                return (
                  <tr key={q.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{q.quotation_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.name || '—'}</div>
                      <div className="td-muted">{lead.company_name || ''}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(q.total_amount)}</td>
                    <td><Badge value={q.status} /></td>
                    <td className="td-muted">{fmtDate(q.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
