import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

function fmtCurrency(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
}

var EMPTY_FORM = {
  name: '', sku: '', description: '',
  unit_price: 0, category: '', unit: 'piece', active: true
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const auth = useAuth();
  var isAdmin = auth.user && auth.user.role === 'admin';

  const load = useCallback(function() {
    setLoading(true);
    var params = {};
    if (search) params.search = search;
    if (activeFilter !== '') params.active = activeFilter;
    api.get('/products', { params: params })
      .then(function(res) {
        setProducts(res.data.data || []);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, [search, activeFilter]);

  useEffect(function() { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      unit_price: product.unit_price || 0,
      category: product.category || '',
      unit: product.unit || 'piece',
      active: product.active !== false
    });
    setFormError('');
    setShowModal(true);
  }

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[name] = value;
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError('Product name is required'); return; }
    if (Number(form.unit_price) < 0) { setFormError('Price cannot be negative'); return; }
    setSaving(true);
    setFormError('');
    try {
      var payload = {
        name: form.name.trim(),
        sku: form.sku || null,
        description: form.description || null,
        unit_price: Number(form.unit_price) || 0,
        category: form.category || null,
        unit: form.unit || 'piece',
        active: form.active
      };
      if (editing) {
        await api.put('/products/' + editing.id, payload);
        setSuccessMsg('Product updated');
      } else {
        await api.post('/products', payload);
        setSuccessMsg('Product added');
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

  async function handleDeactivate(id) {
    try {
      await api.delete('/products/' + id);
      setConfirmId(null);
      setSuccessMsg('Product deactivated');
      load();
      setTimeout(function() { setSuccessMsg(''); }, 2000);
    } catch (err) {
      alert('Failed to deactivate');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">Manage your corporate gifting products</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        )}
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {!isAdmin && (
        <div className="alert" style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0c4a6e', marginBottom: 16 }}>
          View mode — only admins can add or edit products.
        </div>
      )}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-title">{products.length} products</span>
          <div className="table-actions">
            <div className="search-input">
              <span className="search-icon">⌕</span>
              <input
                placeholder="Search name, SKU..."
                value={search}
                onChange={function(e) { setSearch(e.target.value); }}
              />
            </div>
            <select className="filter-select" value={activeFilter} onChange={function(e) { setActiveFilter(e.target.value); }}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
              <option value="">All</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Unit</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="spinner" />
                </td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">⬡</div>
                    <p>No products found. {isAdmin ? 'Add your first product!' : ''}</p>
                  </div>
                </td></tr>
              )}
              {!loading && products.map(function(product) {
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{product.name}</div>
                      <div className="td-muted" style={{ fontSize: 12, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description || ''}
                      </div>
                    </td>
                    <td className="td-muted" style={{ fontFamily: 'monospace' }}>{product.sku || '—'}</td>
                    <td className="td-muted">{product.category || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(product.unit_price)}</td>
                    <td className="td-muted">{product.unit || 'piece'}</td>
                    <td>
                      <Badge value={product.active ? 'active' : 'inactive'} label={product.active ? 'Active' : 'Inactive'} />
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={function() { openEdit(product); }}>Edit</button>
                          {product.active && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}
                              onClick={function() { setConfirmId(product.id); }}>
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && isAdmin && (
        <Modal
          title={editing ? 'Edit Product' : 'Add Product'}
          onClose={function() { setShowModal(false); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setShowModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editing ? 'Update Product' : 'Add Product')}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Product Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Branded Mug" />
            </div>
            <div className="form-group">
              <label className="form-label">SKU Code</label>
              <input className="form-control" name="sku" value={form.sku} onChange={handleChange} placeholder="MUG-001" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-control" name="category" value={form.category} onChange={handleChange} placeholder="Drinkware, Stationery..." />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" name="unit" value={form.unit} onChange={handleChange}>
                <option value="piece">Piece</option>
                <option value="set">Set</option>
                <option value="box">Box</option>
                <option value="dozen">Dozen</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Unit Price (Rs)</label>
              <input className="form-control" type="number" min="0" step="0.01" name="unit_price"
                value={form.unit_price} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                Product is active
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Describe the product, branding options, minimum order..." />
          </div>
        </Modal>
      )}

      {confirmId && isAdmin && (
        <Modal
          title="Deactivate Product"
          onClose={function() { setConfirmId(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={function() { setConfirmId(null); }}>Cancel</button>
              <button className="btn btn-danger" onClick={function() { handleDeactivate(confirmId); }}>Deactivate</button>
            </>
          }
        >
          <p>Deactivate this product? It will no longer appear in quotation dropdowns but existing quotes are preserved.</p>
        </Modal>
      )}
    </div>
  );
}

export default Products;
