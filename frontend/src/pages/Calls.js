import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
}

var EMPTY_FORM = {
  caller_name: '', company_name: '', phone: '', email: '',
  call_date: '', duration_minutes: '', status: 'pending',
  notes: '', outcome: '', assigned_to: ''
};

function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirmId, setConfirmId] = useState(null);
  const [converting, setConverting] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(function() {
    setLoading(true);
    var params = { page: page, limit: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get('/calls', { params: params })
      .then(function(res) {
        setCalls(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, [page, search, statusFilter]);

  useEffect(function() { load(); }, [load]);

  useEffect(function() {
    api.get('/dashboard/users').then(function(res) { setUsers(res.data.data || []); }).catch(function() {});
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(call) {
    setEditing(call);
    setForm({
      caller_name: call.caller_name || '',
      company_name: call.company_name || '',
      phone: call.phone || '',
      email: call.email || '',
      call_date: call.call_date ? call.call_date.substring(0, 16) : '',
      duration_minutes: call.duration_minutes || '',
      status: call.status || 'pending',
      notes: call.notes || '',
      outcome: call.outcome || '',
      assigned_to: call.assigned_to || ''
    });
    setFormError('');
    setShowModal(true);
  }

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.value;
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[name] = value;
      return next;
    });
  }

  async function handleSave() {
    if (!form.caller_name.trim()) { setFormError('Caller name is required'); return; }
    if (!form.phone.trim()) { setFormError('Phone is required'); return; }
    setSaving(true);
    setFormError('');
    try {
      var payload = Object.assign({}, form);
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.duration_minutes) payload.duration_minutes = null;
      if (!payload.call_date) payload.call_date = null;
      if (!payload.email) payload.email = null;

      if (editing) {
        await api.put('/calls/' + editing.id, payload);
        setSuccessMsg('Call updated successfully');
      } else {
        await api.post('/calls', payload);
        setSuccessMsg('Call logged successfully');
      }
      setShowModal(false);
      load();
      setTimeout(function() { setSuccessMsg(''); }, 3000);
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Failed to save';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete('/calls/' + id);
      setConfirmId(null);
      setSuccessMsg('Call deleted');
      load();
      setTimeout(function() { setSuccessMsg(''); }, 2000);
    } catch (err) {
      alert('Delete failed: ' + ((err.response && err.response.data && err.response.data.message) || err.message));
    }
  }

  async function handleConvert(call) {
    setConverting(call.id);
    try {
      await api.post('/calls/' + call.id + '/convert-to-lead');
      setSuccessMsg('Lead created from call!');
      load();
      setTimeout(function() { setSuccessMsg(''); }, 3000);
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Conversion failed';
      alert(msg);
    } finally {
      setConverting(null);
    }
  }

  var startItem = (page - 1) * 20 + 1;
  var endItem = Math.min(page * 20, total);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Call Logs</h1>
          <p className="page-subtitle">Track all cold calls and follow-ups</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Log Call</button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-title">{total} calls</span>
          <div className="table-actions">
            <div className="search-input">
              <span className="search-icon">⌕</span>
              <input
                placeholder="Search name, company, phone..."
                value={search}
                onChange={function(e) { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="filter-select" value={statusFilter} onChange={function(e) { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="follow_up">Follow Up</option>
              <option value="no_answer">No Answer</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Caller</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Date</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="spinner" />
                </td></tr>
              )}
              {!loading && calls.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">☎</div>
                    <p>No calls found. Log your first call!</p>
                  </div>
                </td></tr>
              )}
              {!loading && calls.map(function(call) {
                return (
                  <tr key={call.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{call.caller_name}</div>
                      <div className="td-muted">{call.company_name || '—'}</div>
                    </td>
                    <td>{call.phone}</td>
                    <td><Badge value={call.status} /></td>
                    <td className="td-muted">{fmtDate(call.call_date || call.created_at)}</td>
                    <td className="td-muted">{call.assignee ? call.assignee.name : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={function() { openEdit(call); }}>Edit</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-primary)' }}
                          onClick={function() { handleConvert(call); }}
                          disabled={converting === call.id}
                          title="Convert to Lead"
                        >
                          {converting === call.id ? '...' : '→ Lead'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={function() { setConfirmId(call.id); }}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="pagination">
            <span className="pagination-info">Showing {startItem}–{endItem} of {total}</span>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={function() { setPage(function(p) { return p - 1; }); }} disabled={page === 1}>&laquo;</button>
              {Array.from({ length: pages }, function(_, i) { return i + 1; }).map(function(p) {
                return (
                  <button key={p} className={'pagination-btn' + (p === page ? ' active' : '')} onClick={function() { setPage(p); }}>{p}</button>
                );
              })}
              <button className="pagination-btn" onClick={function() { setPage(function(p) { return p + 1; }); }} disabled={page === pages}>&raquo;</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit Call' : 'Log New Call'}
          onClose={function() { setShowModal(false); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setShowModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editing ? 'Update Call' : 'Log Call')}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Caller Name</label>
              <input className="form-control" name="caller_name" value={form.caller_name} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label required">Phone</label>
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 1234567" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-control" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@company.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="follow_up">Follow Up</option>
                <option value="no_answer">No Answer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (min)</label>
              <input className="form-control" type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} placeholder="0" min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Call Date & Time</label>
              <input className="form-control" type="datetime-local" name="call_date" value={form.call_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <select className="form-control" name="assigned_to" value={form.assigned_to} onChange={handleChange}>
                <option value="">— Assign to self —</option>
                {users.map(function(u) { return <option key={u.id} value={u.id}>{u.name}</option>; })}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="What was discussed..." rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Outcome</label>
            <input className="form-control" name="outcome" value={form.outcome} onChange={handleChange} placeholder="Call outcome or next steps..." />
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmId && (
        <Modal
          title="Delete Call"
          onClose={function() { setConfirmId(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setConfirmId(null); }}>Cancel</button>
              <button className="btn btn-danger" onClick={function() { handleDelete(confirmId); }}>Delete</button>
            </>
          }
        >
          <p>Are you sure you want to delete this call log? This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}

export default Calls;
