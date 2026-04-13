import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtCurrency(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
}

var EMPTY_ITEM = { product_id: '', description: '', quantity: 1, unit_price: 0 };

var EMPTY_FORM = {
  lead_id: '', status: 'draft', discount_percent: 0,
  notes: '', valid_until: '', items: [Object.assign({}, EMPTY_ITEM)]
};

function calcSubtotal(items) {
  return items.reduce(function(sum, item) {
    return sum + (Number(item.quantity || 0) * Number(item.unit_price || 0));
  }, 0);
}

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmId, setConfirmId] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);

  const load = useCallback(function() {
    setLoading(true);
    var params = { page: page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    api.get('/quotations', { params: params })
      .then(function(res) {
        setQuotations(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, [page, statusFilter]);

  useEffect(function() { load(); }, [load]);

  useEffect(function() {
    api.get('/leads', { params: { limit: 200 } }).then(function(res) { setLeads(res.data.data || []); }).catch(function() {});
    api.get('/products', { params: { active: true } }).then(function(res) { setProducts(res.data.data || []); }).catch(function() {});
  }, []);

  useEffect(function() {
    if (!detailId) { setDetail(null); return; }
    setDetailLoading(true);
    api.get('/quotations/' + detailId)
      .then(function(res) { setDetail(res.data.data); setDetailLoading(false); })
      .catch(function() { setDetailLoading(false); });
  }, [detailId]);

  function openCreate() {
    setEditing(null);
    setForm(Object.assign({}, EMPTY_FORM, { items: [Object.assign({}, EMPTY_ITEM)] }));
    setFormError('');
    setShowModal(true);
  }

  function openEdit(q) {
    setEditing(q);
    api.get('/quotations/' + q.id).then(function(res) {
      var d = res.data.data;
      var items = (d.items && d.items.length > 0)
        ? d.items.map(function(i) {
            return { product_id: i.product_id || '', description: i.description || '', quantity: i.quantity, unit_price: Number(i.unit_price) };
          })
        : [Object.assign({}, EMPTY_ITEM)];
      setForm({
        lead_id: d.lead_id || '',
        status: d.status || 'draft',
        discount_percent: Number(d.discount_percent) || 0,
        notes: d.notes || '',
        valid_until: d.valid_until || '',
        items: items
      });
      setFormError('');
      setShowModal(true);
    });
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

  function handleItemChange(idx, field, value) {
    setForm(function(prev) {
      var newItems = prev.items.map(function(item, i) {
        if (i !== idx) return item;
        var newItem = Object.assign({}, item);
        newItem[field] = value;
        // Auto-fill description from product
        if (field === 'product_id' && value) {
          var product = products.find(function(p) { return String(p.id) === String(value); });
          if (product) {
            newItem.description = product.name;
            newItem.unit_price = Number(product.unit_price);
          }
        }
        return newItem;
      });
      return Object.assign({}, prev, { items: newItems });
    });
  }

  function addItem() {
    setForm(function(prev) {
      return Object.assign({}, prev, { items: prev.items.concat([Object.assign({}, EMPTY_ITEM)]) });
    });
  }

  function removeItem(idx) {
    setForm(function(prev) {
      var newItems = prev.items.filter(function(_, i) { return i !== idx; });
      return Object.assign({}, prev, { items: newItems.length ? newItems : [Object.assign({}, EMPTY_ITEM)] });
    });
  }

  async function handleSave() {
    if (!form.lead_id) { setFormError('Please select a lead'); return; }
    var validItems = form.items.filter(function(i) { return i.description && i.quantity > 0; });
    if (validItems.length === 0) { setFormError('Add at least one item'); return; }
    setSaving(true);
    setFormError('');
    try {
      var payload = {
        lead_id: Number(form.lead_id),
        status: form.status,
        discount_percent: Number(form.discount_percent) || 0,
        notes: form.notes || null,
        valid_until: form.valid_until || null,
        items: validItems.map(function(i) {
          return {
            product_id: i.product_id ? Number(i.product_id) : null,
            description: i.description,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price)
          };
        })
      };
      if (editing) {
        await api.put('/quotations/' + editing.id, payload);
        setSuccessMsg('Quotation updated');
      } else {
        await api.post('/quotations', payload);
        setSuccessMsg('Quotation created');
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

  async function handleStatusChange(id, newStatus) {
    try {
      await api.put('/quotations/' + id + '/status', { status: newStatus });
      setStatusModal(null);
      setDetailId(null);
      setSuccessMsg('Marked as ' + newStatus.toUpperCase() + '!');
      load();
      setTimeout(function() { setSuccessMsg(''); }, 3000);
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete('/quotations/' + id);
      setConfirmId(null);
      setSuccessMsg('Quotation deleted');
      load();
      setTimeout(function() { setSuccessMsg(''); }, 2000);
    } catch (err) {
      alert('Delete failed');
    }
  }

  var subtotal = calcSubtotal(form.items);
  var discount = subtotal * (Number(form.discount_percent) / 100);
  var grandTotal = subtotal - discount;

  var startItem = (page - 1) * 20 + 1;
  var endItem = Math.min(page * 20, total);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Track all client quotations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Quotation</button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-title">{total} quotations</span>
          <div className="table-actions">
            <select className="filter-select" value={statusFilter} onChange={function(e) { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="spinner" />
                </td></tr>
              )}
              {!loading && quotations.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">◫</div>
                    <p>No quotations yet. Create your first one!</p>
                  </div>
                </td></tr>
              )}
              {!loading && quotations.map(function(q) {
                var lead = q.lead || {};
                return (
                  <tr key={q.id}>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', padding: 0 }}
                        onClick={function() { setDetailId(q.id); }}>
                        {q.quotation_number}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.name || '—'}</div>
                      <div className="td-muted">{lead.company_name || ''}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(q.total_amount)}</td>
                    <td><Badge value={q.status} /></td>
                    <td className="td-muted">{fmtDate(q.valid_until)}</td>
                    <td className="td-muted">{fmtDate(q.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {q.status !== 'won' && q.status !== 'lost' && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={function() { openEdit(q); }}>Edit</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-success)' }}
                              onClick={function() { setStatusModal({ id: q.id, action: 'won' }); }}>Won</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}
                              onClick={function() { setStatusModal({ id: q.id, action: 'lost' }); }}>Lost</button>
                          </>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}
                          onClick={function() { setConfirmId(q.id); }}>Del</button>
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
                return <button key={p} className={'pagination-btn' + (p === page ? ' active' : '')} onClick={function() { setPage(p); }}>{p}</button>;
              })}
              <button className="pagination-btn" onClick={function() { setPage(function(p) { return p + 1; }); }} disabled={page === pages}>&raquo;</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailId && (
        <Modal title="Quotation Detail" size="lg" onClose={function() { setDetailId(null); }}
          footer={
            <>
              {detail && detail.status !== 'won' && detail.status !== 'lost' && (
                <>
                  <button className="btn btn-success" onClick={function() { setStatusModal({ id: detailId, action: 'won' }); }}>Mark Won</button>
                  <button className="btn btn-danger" onClick={function() { setStatusModal({ id: detailId, action: 'lost' }); }}>Mark Lost</button>
                </>
              )}
              <button className="btn btn-secondary" onClick={function() { setDetailId(null); }}>Close</button>
            </>
          }
        >
          {detailLoading && <div style={{ textAlign: 'center' }}><span className="spinner" /></div>}
          {!detailLoading && detail && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{detail.quotation_number}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    Created {fmtDate(detail.created_at)} by {detail.creator && detail.creator.name}
                  </div>
                </div>
                <Badge value={detail.status} />
              </div>

              <div className="detail-grid" style={{ marginBottom: 20 }}>
                <div className="detail-item">
                  <label>Client</label>
                  <span>{detail.lead && detail.lead.name}</span>
                </div>
                <div className="detail-item">
                  <label>Company</label>
                  <span>{(detail.lead && detail.lead.company_name) || '—'}</span>
                </div>
                <div className="detail-item">
                  <label>Valid Until</label>
                  <span>{fmtDate(detail.valid_until)}</span>
                </div>
                <div className="detail-item">
                  <label>Discount</label>
                  <span>{detail.discount_percent}%</span>
                </div>
              </div>

              {detail.notes && (
                <div className="card" style={{ marginBottom: 16, background: 'var(--color-bg)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>NOTES</div>
                  <p style={{ fontSize: 13 }}>{detail.notes}</p>
                </div>
              )}

              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Description</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map(function(item, i) {
                    return (
                      <tr key={i}>
                        <td>{item.description}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{fmtCurrency(item.unit_price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(item.total_price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {Number(detail.discount_percent) > 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'right', fontWeight: 500, color: 'var(--color-text-muted)' }}>Discount ({detail.discount_percent}%)</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                        – {fmtCurrency((detail.items || []).reduce(function(s, i) { return s + Number(i.total_price); }, 0) * Number(detail.discount_percent) / 100)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>Grand Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--color-primary)' }}>
                      {fmtCurrency(detail.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit Quotation' : 'New Quotation'}
          size="xl"
          onClose={function() { setShowModal(false); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setShowModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editing ? 'Update' : 'Create Quotation')}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Lead / Client</label>
              <select className="form-control" name="lead_id" value={form.lead_id} onChange={handleChange}>
                <option value="">— Select Lead —</option>
                {leads.map(function(l) {
                  return <option key={l.id} value={l.id}>{l.name}{l.company_name ? ' – ' + l.company_name : ''}</option>;
                })}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Discount %</label>
              <input className="form-control" type="number" name="discount_percent" min="0" max="100" step="0.5"
                value={form.discount_percent} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Valid Until</label>
              <input className="form-control" type="date" name="valid_until" value={form.valid_until} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Terms, delivery notes..." />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>Line Items</strong>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Row</button>
            </div>
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Product</th>
                  <th style={{ width: '30%' }}>Description</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '18%' }}>Unit Price</th>
                  <th style={{ width: '12%' }}>Total</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map(function(item, idx) {
                  var rowTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
                  return (
                    <tr key={idx}>
                      <td>
                        <select value={item.product_id} onChange={function(e) { handleItemChange(idx, 'product_id', e.target.value); }}>
                          <option value="">— Custom —</option>
                          {products.map(function(p) { return <option key={p.id} value={p.id}>{p.name}</option>; })}
                        </select>
                      </td>
                      <td>
                        <input value={item.description} onChange={function(e) { handleItemChange(idx, 'description', e.target.value); }} placeholder="Description" />
                      </td>
                      <td>
                        <input type="number" min="1" value={item.quantity} onChange={function(e) { handleItemChange(idx, 'quantity', e.target.value); }} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={item.unit_price} onChange={function(e) { handleItemChange(idx, 'unit_price', e.target.value); }} />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtCurrency(rowTotal)}</td>
                      <td>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: 16 }}
                          onClick={function() { removeItem(idx); }}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: 12, textAlign: 'right' }}>
              {Number(form.discount_percent) > 0 && (
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  Subtotal: {fmtCurrency(subtotal)} — Discount: –{fmtCurrency(discount)}
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                Grand Total: <span style={{ color: 'var(--color-primary)' }}>{fmtCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Confirmation */}
      {statusModal && (
        <Modal
          title={statusModal.action === 'won' ? 'Mark as WON' : 'Mark as LOST'}
          onClose={function() { setStatusModal(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setStatusModal(null); }}>Cancel</button>
              <button
                className={statusModal.action === 'won' ? 'btn btn-success' : 'btn btn-danger'}
                onClick={function() { handleStatusChange(statusModal.id, statusModal.action); }}
              >
                Confirm {statusModal.action === 'won' ? 'WON' : 'LOST'}
              </button>
            </>
          }
        >
          <p>
            {statusModal.action === 'won'
              ? 'Congratulations! Mark this quotation as WON? The lead will be updated to Converted.'
              : 'Mark this quotation as LOST? The lead will be updated to Unqualified.'}
          </p>
        </Modal>
      )}

      {confirmId && (
        <Modal
          title="Delete Quotation"
          onClose={function() { setConfirmId(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setConfirmId(null); }}>Cancel</button>
              <button className="btn btn-danger" onClick={function() { handleDelete(confirmId); }}>Delete</button>
            </>
          }
        >
          <p>Delete this quotation and all its line items? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}

export default Quotations;
