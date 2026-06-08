import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Check, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

export default function Estimates({ userRole }) {
  const [estimates, setEstimates] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  
  // Line items state
  const [lineItems, setLineItems] = useState([
    { name: '', description: '', unitPrice: '', quantity: '' }
  ]);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([
        fetch('/api/estimates', { headers }),
        fetch('/api/clients', { headers })
      ]);
      if (eRes.ok) setEstimates(await eRes.json());
      if (cRes.ok) setClients(await cRes.json());
    } catch (e) {
      setError('Failed to fetch estimates data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    setLineItems([...lineItems, { name: '', description: '', unitPrice: '', quantity: '' }]);
  };

  const handleRemoveItem = (index) => {
    const copy = [...lineItems];
    copy.splice(index, 1);
    setLineItems(copy);
  };

  const handleItemChange = (index, field, value) => {
    const copy = [...lineItems];
    copy[index][field] = value;
    setLineItems(copy);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((acc, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return acc + (price * qty);
    }, 0);
  };

  const handleSaveEstimate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedClientId) {
      setError('Please select a client.');
      return;
    }

    const client = clients.find(c => c.clientId === parseInt(selectedClientId, 10));
    const subtotal = calculateSubtotal();

    const estimateBody = {
      client: { clientId: client.clientId },
      chain: client.chain ? { chainId: client.chain.chainId } : null,
      estimateDate: new Date().toISOString().split('T')[0],
      validityDate: new Date(Date.now() + parseInt(validityDays, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subTotal: subtotal,
      status: 'APPROVED', // Auto-approve for ease of invoicing in demo
      itemsJson: JSON.stringify(lineItems)
    };

    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(estimateBody)
      });

      if (res.ok) {
        setSuccess('Estimate generated and approved successfully!');
        setShowModal(false);
        setLineItems([{ name: '', description: '', unitPrice: '', quantity: '' }]);
        setSelectedClientId('');
        fetchData();
      } else {
        setError('Failed to save estimate.');
      }
    } catch (e) {
      setError('Server communication failure.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const est = estimates.find(e => e.estimateId === id);
      const res = await fetch(`/api/estimates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...est, status })
      });
      if (res.ok) {
        setSuccess(`Estimate updated to ${status}.`);
        fetchData();
      }
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  const handleConvertToInvoice = async (estimate) => {
    setError('');
    setSuccess('');

    const invoiceBody = {
      estimate: { estimateId: estimate.estimateId },
      client: { clientId: estimate.client.clientId },
      chain: estimate.chain ? { chainId: estimate.chain.chainId } : null,
      subTotal: estimate.subTotal,
      gstRate: 18.00,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'UNPAID'
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceBody)
      });

      if (res.ok) {
        setSuccess(`Successfully converted Estimate ${estimate.estimateNumber} to Invoice!`);
        fetchData();
      } else {
        setError('Invoicing transformation failed.');
      }
    } catch (e) {
      setError('Failed to connect to backend.');
    }
  };

  const handleDeleteEstimate = async (id) => {
    if (!window.confirm('Delete this estimate record permanently?')) return;
    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSuccess('Estimate deleted.');
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: 700 }}>
            Sales Estimates
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Build quotes, specify quantities, pre-calculate totals, and convert quotes to invoices.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Create Estimate
        </button>
      </div>

      {error && (
        <div className="alert alert-danger animate-fade">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success animate-fade">
          <CheckCircle size={16} />
          <div>{success}</div>
        </div>
      )}

      {/* Main List */}
      <div className="glass" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Estimate #</th>
                <th style={{ padding: '12px' }}>Client</th>
                <th style={{ padding: '12px' }}>Amount (Incl. GST 18%)</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Validity</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimates.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No estimates created. Click "Create Estimate" to configure a quotation.
                  </td>
                </tr>
              ) : (
                estimates.map((est) => (
                  <tr key={est.estimateId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="var(--primary)" /> {est.estimateNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500 }}>{est.client.name}</div>
                      {est.chain && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>C: {est.chain.chainName}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(est.totalAmount)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Taxable: {formatCurrency(est.subTotal)}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="verify-badge" style={{ 
                        background: est.status === 'INVOICED' ? 'rgba(59,130,246,0.15)' :
                                    est.status === 'APPROVED' ? 'var(--success-bg)' :
                                    est.status === 'REJECTED' ? 'var(--danger-bg)' : 'rgba(255,255,255,0.05)',
                        color: est.status === 'INVOICED' ? 'var(--info)' :
                               est.status === 'APPROVED' ? 'var(--success)' :
                               est.status === 'REJECTED' ? 'var(--danger)' : 'var(--text-secondary)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px'
                      }}>
                        {est.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{est.validityDate}</td>
                    <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      
                      {est.status === 'APPROVED' && (
                        <button 
                          onClick={() => handleConvertToInvoice(est)} 
                          className="btn btn-success"
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Generate Invoice"
                        >
                          <FileSpreadsheet size={12} /> Convert to Invoice
                        </button>
                      )}

                      {est.status === 'DRAFT' && (
                        <>
                          <button 
                            onClick={() => updateStatus(est.estimateId, 'APPROVED')} 
                            className="btn btn-success"
                            style={{ padding: '4px 8px' }}
                            title="Approve"
                          >
                            <Check size={12} />
                          </button>
                          <button 
                            onClick={() => updateStatus(est.estimateId, 'REJECTED')} 
                            className="btn btn-danger"
                            style={{ padding: '4px 8px' }}
                            title="Reject"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}

                      <button 
                        onClick={() => handleDeleteEstimate(est.estimateId)} 
                        className="btn btn-danger"
                        style={{ padding: '6px 8px' }}
                        disabled={userRole !== 'ADMIN'}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Estimate Modal */}
      {showModal && (
        <div className="inactivity-overlay">
          <div className="inactivity-modal glass animate-fade" style={{ maxWidth: '720px', textAlign: 'left' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Create Sales Estimate
            </h3>
            
            <form onSubmit={handleSaveEstimate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Select Target Client</label>
                  <div className="input-wrapper no-icon">
                    <select 
                      value={selectedClientId} 
                      onChange={(e) => setSelectedClientId(e.target.value)} 
                      required
                    >
                      <option value="">-- Choose Customer --</option>
                      {clients.map(c => (
                        <option key={c.clientId} value={c.clientId}>{c.name} ({c.organizationDetails || 'No Org'})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Validity Period</label>
                  <div className="input-wrapper no-icon">
                    <select 
                      value={validityDays} 
                      onChange={(e) => setValidityDays(e.target.value)}
                    >
                      <option value="15">15 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Line Items Builder */}
              <div>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Line Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {lineItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Item Name" 
                        value={item.name} 
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)} 
                        required 
                        style={{ flex: 2, padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', fontSize: '13px' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Unit Price" 
                        value={item.unitPrice} 
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} 
                        required 
                        min="0"
                        style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', fontSize: '13px' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Qty" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} 
                        required 
                        min="1"
                        style={{ width: '60px', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', fontSize: '13px' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(idx)} 
                        className="btn btn-danger"
                        disabled={lineItems.length === 1}
                        style={{ padding: '8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', marginTop: '10px', padding: '6px 12px' }}
                >
                  <Plus size={12} /> Add Row
                </button>
              </div>

              {/* Totals Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '240px', alignSelf: 'flex-end' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST (18%):</span>
                  <span>{formatCurrency(calculateSubtotal() * 0.18)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
                  <span>Total:</span>
                  <span className="gradient-text">{formatCurrency(calculateSubtotal() * 1.18)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Approve & Generate Quote
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
