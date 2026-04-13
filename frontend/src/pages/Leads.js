import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
}

var EMPTY_FORM = {
  name: '', company_name: '', phone: '', email: '',
  source: 'direct', status: 'new', notes: '', assigned_to: ''
};

function Leads() {
  const [leads, setLeads] = useState([]);
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
  const [creating, setCreating] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const history = useHistory();

  const load = useCallback(function() {
    setLoading(true);
    var params = { page: page, limit: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get('/leads', { params: params })
      .then(function(res) {
        setLeads(res.data.data || []);
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

  function openEdit(lead) {
    setEditing(lead);
    setForm({
      name: lead.name || '',
      company_name: lead.company_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'direct',
      status: lead.status || 'new',
      notes: lead.notes || '',
      assigned_to: lead.assigned_to || ''
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
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError('');
    try {
      var payload = Object.assign({}, form);
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.email) payload.email = null;
      if (!payload.phone) payload.phone = null;

      if (editing) {
        await api.put('/leads/' + editing.id, payload);
        setSuccessMsg('Lead updated');
      } else {
        await api.post('/leads', payload);
        setSuccessMsg('Lead created');
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
      await api.delete('/leads/' + id);
      setConfirmId(null);
      setSuccessMsg('Lead deleted');
      load();
      setTimeout(function() { setSuccessMsg(''); }, 2000);
    } catch (err) {
      alert('Delete failed');
    }
  }

  async function handleCreateQuotation(lead) {
    setCreating(lead.id);
    try {
      var res = await api.post('/leads/' + lead.id + '/create-quotation');
      setSuccessMsg('Quotation created: ' + res.data.data.quotation_number);
      setTimeout(function() {
        history.push('/quotations');
      }, 1200);
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Failed to create quotation';
      alert(msg);
    } finally {
      setCreating(null);
    }
  }

  var startItem = (page - 1) * 20 + 1;
  var endItem = Math.min(page * 20, total);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Manage your sales pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Lead</button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-title">{total} leads</span>
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
              <option value="converted">Converted</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Phone / Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="spinner" />
                </td></tr>
              )}
              {!loading && leads.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">◈</div>
                    <p>No leads found. Add your first lead!</p>
                  </div>
                </td></tr>
              )}
              {!loading && leads.map(function(lead) {
                return (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.name}</div>
                      <div className="td-muted">{lead.company_name || '—'}</div>
                    </td>
                    <td>
                      <div>{lead.phone || '—'}</div>
                      <div className="td-muted">{lead.email || ''}</div>
                    </td>
                    <td><Badge value={lead.source} /></td>
                    <td><Badge value={lead.status} /></td>
                    <td className="td-muted">{fmtDate(lead.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={function() { openEdit(lead); }}>Edit</button>
                        {lead.status !== 'converted' && lead.status !== 'unqualified' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-success)' }}
                            onClick={function() { handleCreateQuotation(lead); }}
                            disabled={creating === lead.id}
                            title="Create Quotation"
                          >
                            {creating === lead.id ? '...' : '→ Quote'}
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={function() { setConfirmId(lead.id); }}
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

      {showModal && (
        <Modal
          title={editing ? 'Edit Lead' : 'Add New Lead'}
          onClose={function() { setShowModal(false); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setShowModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editing ? 'Update Lead' : 'Add Lead')}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Contact person name" />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-control" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 1234567" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@company.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-control" name="source" value={form.source} onChange={handleChange}>
                <option value="direct">Direct</option>
                <option value="call">From Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referral">Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned To</label>
            <select className="form-control" name="assigned_to" value={form.assigned_to} onChange={handleChange}>
              <option value="">— Assign to self —</option>
              {users.map(function(u) { return <option key={u.id} value={u.id}>{u.name}</option>; })}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Requirements, interests, anything relevant..." rows={3} />
          </div>
        </Modal>
      )}

      {confirmId && (
        <Modal
          title="Delete Lead"
          onClose={function() { setConfirmId(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setConfirmId(null); }}>Cancel</button>
              <button className="btn btn-danger" onClick={function() { handleDelete(confirmId); }}>Delete</button>
            </>
          }
        >
          <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}

export default Leads;
