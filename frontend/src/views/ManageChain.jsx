import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, AlertCircle, CheckCircle, Building2,
  Filter, X, RefreshCw, ChevronRight
} from 'lucide-react';

export default function ManageChain({ userRole }) {
  // ── Data ──────────────────────────────────────────────────
  const [chains, setChains]   = useState([]);
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Notifications ─────────────────────────────────────────
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // ── View mode: 'list' | 'add' | 'edit' ───────────────────
  const [viewMode, setViewMode] = useState('list');

  // ── Filter ────────────────────────────────────────────────
  const [filterGroupId, setFilterGroupId] = useState(null);

  // ── Form fields ───────────────────────────────────────────
  const [editingChain,  setEditingChain]  = useState(null);
  const [companyName,   setCompanyName]   = useState('');
  const [gstnNo,        setGstnNo]        = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [formLoading,   setFormLoading]   = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  // ── Derived Stats ─────────────────────────────────────────
  const totalGroups = groups.length;
  const totalChains = chains.length;

  // ── Fetch ─────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [gRes, cRes] = await Promise.all([
        fetch('/api/groups',  { headers }),
        fetch('/api/chains',  { headers }),
      ]);
      if (gRes.ok) setGroups(await gRes.json());
      if (cRes.ok) setChains(await cRes.json());
    } catch {
      setError('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Filtered data ─────────────────────────────────────────
  const displayedChains = filterGroupId
    ? chains.filter(c => c.group?.groupId === filterGroupId)
    : chains;

  // ── Form helpers ──────────────────────────────────────────
  const resetForm = () => {
    setCompanyName('');
    setGstnNo('');
    setSelectedGroup('');
    setEditingChain(null);
  };

  const openAdd = () => {
    resetForm();
    setError('');
    setSuccess('');
    setViewMode('add');
  };

  const openEdit = (chain) => {
    setEditingChain(chain);
    setCompanyName(chain.companyName || chain.chainName || '');
    setGstnNo(chain.gstnNo || '');
    setSelectedGroup(chain.group?.groupId?.toString() || '');
    setError('');
    setSuccess('');
    setViewMode('edit');
  };

  const goToList = () => {
    resetForm();
    setViewMode('list');
  };

  // ── GSTN client-side format check ─────────────────────────
  const gstnRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const validateForm = () => {
    if (!companyName.trim()) { setError('Company name is required.'); return false; }
    if (!gstnNo.trim())       { setError('GSTN number is required.'); return false; }
    if (!gstnRegex.test(gstnNo.toUpperCase().trim())) {
      setError('Invalid GSTN format. Example: 22AAAAA0000A1Z5'); return false;
    }
    if (!selectedGroup) { setError('Please select a group.'); return false; }
    return true;
  };

  // ── Add Chain ─────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const res = await fetch('/api/chains', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          companyName: companyName.trim(),
          gstnNo: gstnNo.toUpperCase().trim(),
          group: { groupId: parseInt(selectedGroup, 10) }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Company added successfully!');
        await fetchData();
        goToList();
      } else {
        setError(data.message || 'Failed to add company.');
      }
    } catch {
      setError('Connection to server failed.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update Chain ──────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/chains/${editingChain.chainId}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
          companyName: companyName.trim(),
          gstnNo: gstnNo.toUpperCase().trim(),
          group: { groupId: parseInt(selectedGroup, 10) }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Company updated successfully!');
        await fetchData();
        goToList();
      } else {
        setError(data.message || 'Failed to update company.');
      }
    } catch {
      setError('Connection to server failed.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Soft Delete Chain ─────────────────────────────────────
  const handleDelete = async (chainId, companyLabel) => {
    if (!window.confirm(`Delete "${companyLabel}"? This will check for linked brands first.`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/chains/${chainId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Company deleted successfully.');
        fetchData();
      } else {
        setError(data.message || 'Failed to delete company.');
      }
    } catch {
      setError('Connection to server failed.');
    }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} color="var(--primary)" />
            Manage Chain
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Add, update, and manage companies (chains) linked to groups.
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          title="Refresh"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          borderRadius: '12px', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Groups</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)', lineHeight: 1.1 }}>{totalGroups}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }}>
            <Filter size={80} color="white" />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          borderRadius: '12px', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Chains</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)', lineHeight: 1.1 }}>{totalChains}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }}>
            <Building2 size={80} color="white" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* ── ADD FORM ── */}
      {viewMode === 'add' && (
        <div className="glass animate-fade" style={{ padding: '28px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: 700 }}>
              Add Company
            </h2>
            <button onClick={goToList} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '480px' }}>
            <div className="form-group">
              <label><strong>Enter Company Name:</strong></label>
              <div className="input-wrapper no-icon">
                <input
                  id="add-company-name"
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label><strong>Enter GSTN:</strong></label>
              <div className="input-wrapper no-icon">
                <input
                  id="add-gstn"
                  type="text"
                  value={gstnNo}
                  onChange={e => setGstnNo(e.target.value.toUpperCase())}
                  placeholder="Enter GST Number (e.g. 22AAAAA0000A1Z5)"
                  maxLength={15}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label><strong>Select Group:</strong></label>
              <div className="input-wrapper no-icon">
                <select
                  id="add-group-select"
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  required
                >
                  <option value="">-- Select Group --</option>
                  {groups.map(g => (
                    <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={goToList} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formLoading} id="btn-add-company">
                {formLoading ? 'Adding...' : 'Add Company'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── EDIT FORM ── */}
      {viewMode === 'edit' && editingChain && (
        <div className="glass animate-fade" style={{ padding: '28px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: 700 }}>
              Update Company
            </h2>
            <button onClick={goToList} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '480px' }}>
            <div className="form-group">
              <label><strong>Enter Company Name:</strong></label>
              <div className="input-wrapper no-icon">
                <input
                  id="edit-company-name"
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label><strong>Enter GSTN:</strong></label>
              <div className="input-wrapper no-icon">
                <input
                  id="edit-gstn"
                  type="text"
                  value={gstnNo}
                  onChange={e => setGstnNo(e.target.value.toUpperCase())}
                  placeholder="Enter GST Number"
                  maxLength={15}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label><strong>Select Group:</strong></label>
              <div className="input-wrapper no-icon">
                <select
                  id="edit-group-select"
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  required
                >
                  <option value="">-- Select Group --</option>
                  {groups.map(g => (
                    <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={goToList} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formLoading} id="btn-update-company">
                {formLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* Main Table Panel */}
          <div className="glass" style={{ flex: 1, padding: '24px', borderRadius: '12px' }}>
            {/* Table Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: 600 }}>
                {filterGroupId
                  ? `Showing: ${groups.find(g => g.groupId === filterGroupId)?.groupName || 'Group'}`
                  : 'All Companies'}
                {filterGroupId && (
                  <button
                    onClick={() => setFilterGroupId(null)}
                    style={{ marginLeft: '10px', background: 'var(--danger-bg)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: 'var(--danger)', cursor: 'pointer' }}
                  >
                    Clear filter ×
                  </button>
                )}
              </h3>
              <button
                id="btn-open-add-company"
                onClick={openAdd}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
              >
                <Plus size={14} /> Add Company
              </button>
            </div>

            {/* Loading spinner */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span className="animate-spin" style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Sr.No</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Group Name</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>Company</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600 }}>GSTN</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'center' }}>Edit</th>
                      <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'center' }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedChains.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No companies found. Click <strong>Add Company</strong> to get started!
                        </td>
                      </tr>
                    ) : (
                      displayedChains.map((c, index) => (
                        <tr
                          key={c.chainId}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '13px 10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {index + 1}
                          </td>
                          <td style={{ padding: '13px 10px', fontWeight: 500 }}>
                            {c.group?.groupName || '—'}
                          </td>
                          <td style={{ padding: '13px 10px' }}>
                            {c.companyName || c.chainName || '—'}
                          </td>
                          <td style={{ padding: '13px 10px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                            {c.gstnNo || '—'}
                          </td>
                          <td style={{ padding: '13px 10px', textAlign: 'center' }}>
                            <button
                              id={`btn-edit-chain-${c.chainId}`}
                              onClick={() => openEdit(c)}
                              style={{
                                background: 'linear-gradient(135deg, #d97706, #b45309)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'opacity 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              <Edit2 size={11} /> Edit
                            </button>
                          </td>
                          <td style={{ padding: '13px 10px', textAlign: 'center' }}>
                            <button
                              id={`btn-delete-chain-${c.chainId}`}
                              onClick={() => handleDelete(c.chainId, c.companyName || c.chainName)}
                              style={{
                                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'opacity 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filter by Group Sidebar */}
          <div className="glass" style={{ width: '200px', flexShrink: 0, padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} /> Filter by Group
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => setFilterGroupId(null)}
                style={{
                  background: filterGroupId === null ? 'var(--primary-glow)' : 'transparent',
                  color: filterGroupId === null ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '13px',
                  fontWeight: filterGroupId === null ? 700 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                {filterGroupId === null && <ChevronRight size={12} />} All Groups
              </button>
              {groups.map(g => (
                <button
                  key={g.groupId}
                  id={`filter-group-${g.groupId}`}
                  onClick={() => setFilterGroupId(g.groupId)}
                  style={{
                    background: filterGroupId === g.groupId ? 'var(--primary-glow)' : 'transparent',
                    color: filterGroupId === g.groupId ? 'var(--primary)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '13px',
                    fontWeight: filterGroupId === g.groupId ? 700 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (filterGroupId !== g.groupId) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (filterGroupId !== g.groupId) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {filterGroupId === g.groupId && <ChevronRight size={12} />}
                  {g.groupName}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
