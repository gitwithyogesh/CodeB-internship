import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Trash2, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Download, 
  Send,
  Eye
} from 'lucide-react';

export default function Invoices({ userRole }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  // Selected contexts
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [receiptDetails, setReceiptDetails] = useState(null);

  // Payment Form Fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices', { headers });
      if (res.ok) {
        setInvoices(await res.json());
      } else {
        setError('Failed to fetch invoice listings.');
      }
    } catch (e) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount((invoice.totalAmount).toString());
    setTransactionRef('');
    setPaymentMode('UPI');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const paymentBody = {
      invoice: { invoiceId: selectedInvoice.invoiceId },
      amount: parseFloat(paymentAmount),
      paymentMode,
      transactionReference: transactionRef,
      status: 'COMPLETED'
    };

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentBody)
      });

      if (res.ok) {
        setSuccess(`Payment of ${formatCurrency(paymentAmount)} recorded against Invoice ${selectedInvoice.invoiceNumber}. Status updated!`);
        setShowPaymentModal(false);
        fetchInvoices();
      } else {
        setError('Failed to record payment transaction.');
      }
    } catch (e) {
      setError('Database submission failed.');
    }
  };

  const openReceiptModal = (invoice) => {
    // Determine items list (use estimate items if available, or fall back to mock service line items)
    let items = [];
    if (invoice.estimate && invoice.estimate.itemsJson) {
      try {
        items = JSON.parse(invoice.estimate.itemsJson);
      } catch (e) {
        items = [{ name: 'Billing Services', description: 'IMS Billing', unitPrice: invoice.subTotal, quantity: 1 }];
      }
    } else {
      items = [{ name: 'Standard IT Services', description: 'IMS Development & MIS Invoicing Service', unitPrice: invoice.subTotal, quantity: 1 }];
    }

    // Determine GST rule (intra-state vs inter-state)
    // Code-B is located in Haryana (state code "06").
    // If the customer's GSTIN starts with "06", apply CGST 9% and SGST 9%.
    // Otherwise, apply IGST 18%.
    const customerGst = invoice.client.gstNumber || '';
    const isIntrastate = customerGst.startsWith('06');

    setReceiptDetails({
      ...invoice,
      items,
      isIntrastate,
      vendorGst: '06ABCDE1234A1Z1',
      vendorAddress: 'Code-B Headquarters, Plot 21, Phase IV, Udyog Vihar, Gurugram, Haryana - 122016'
    });
    setShowReceiptModal(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice? This action is irreversible.')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSuccess('Invoice deleted successfully.');
        fetchInvoices();
      }
    } catch (e) {
      setError('Failed to delete invoice.');
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
            Invoices & Payments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Track sales billing receipts, record client payments, and view dynamic GST-compliant bills.
          </p>
        </div>
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
                <th style={{ padding: '12px' }}>Invoice Number</th>
                <th style={{ padding: '12px' }}>Client</th>
                <th style={{ padding: '12px' }}>Total Amount</th>
                <th style={{ padding: '12px' }}>GST Details</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No invoices generated yet. Convert an Approved Estimate to generate an invoice.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.invoiceId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={16} color="var(--secondary)" /> {inv.invoiceNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500 }}>{inv.client.name}</div>
                      {inv.client.gstNumber && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GSTIN: {inv.client.gstNumber}</div>}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div>Tax: {formatCurrency(inv.gstAmount)}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rate: {inv.gstRate}%</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="verify-badge" style={{ 
                        background: inv.status === 'PAID' ? 'var(--success-bg)' :
                                    inv.status === 'PARTIALLY_PAID' ? 'var(--warning-bg)' :
                                    inv.status === 'CANCELLED' ? 'rgba(255,255,255,0.05)' : 'var(--danger-bg)',
                        color: inv.status === 'PAID' ? 'var(--success)' :
                               inv.status === 'PARTIALLY_PAID' ? 'var(--warning)' :
                               inv.status === 'CANCELLED' ? 'var(--text-muted)' : 'var(--danger)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px'
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      
                      <button 
                        onClick={() => openReceiptModal(inv)} 
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} /> View Bill
                      </button>

                      {inv.status !== 'PAID' && (
                        <button 
                          onClick={() => openPaymentModal(inv)} 
                          className="btn btn-success"
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CreditCard size={12} /> Record Payment
                        </button>
                      )}

                      <button 
                        onClick={() => handleDeleteInvoice(inv.invoiceId)} 
                        className="btn btn-danger"
                        style={{ padding: '6px 8px' }}
                        disabled={userRole !== 'ADMIN'}
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

      {/* Record Payment Dialog */}
      {showPaymentModal && (
        <div className="inactivity-overlay">
          <div className="inactivity-modal glass animate-fade" style={{ maxWidth: '440px', textAlign: 'left' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Record Payment
            </h3>
            
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <div className="input-wrapper no-icon">
                  <input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    required 
                    min="0"
                    step="0.01"
                    placeholder="Enter amount paid"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <div className="input-wrapper no-icon">
                  <select 
                    value={paymentMode} 
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="UPI">UPI (Paytm/GPay/PhonePe)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Transaction Reference ID</label>
                <div className="input-wrapper no-icon">
                  <input 
                    type="text" 
                    value={transactionRef} 
                    onChange={(e) => setTransactionRef(e.target.value)} 
                    placeholder="e.g. UPI Ref, NEFT Transaction Number"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Complete Payment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* GST Receipt Modal */}
      {showReceiptModal && receiptDetails && (
        <div className="inactivity-overlay">
          <div className="inactivity-modal glass animate-fade" style={{ maxWidth: '640px', textAlign: 'left', padding: '30px', background: 'rgba(10,11,18,0.95)' }}>
            
            {/* Header branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-title)', color: 'white', fontSize: '20px' }}>TAX INVOICE</h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>GSTIN: {receiptDetails.vendorGst}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 className="gradient-text" style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Code-B</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>INVOICING SERVICE</span>
              </div>
            </div>

            {/* Billing addresses grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '20px 0', fontSize: '12px' }}>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>Billed By:</h4>
                <div style={{ fontWeight: 600, marginTop: '4px', color: 'white' }}>Code-B Private Limited</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{receiptDetails.vendorAddress}</div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>Billed To:</h4>
                <div style={{ fontWeight: 600, marginTop: '4px', color: 'white' }}>{receiptDetails.client.name}</div>
                {receiptDetails.client.organizationDetails && <div style={{ color: 'var(--text-secondary)' }}>{receiptDetails.client.organizationDetails}</div>}
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{receiptDetails.client.address || 'Billing Address Not Available'}</div>
                {receiptDetails.client.gstNumber && <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '4px', fontFamily: 'monospace' }}>GSTIN: {receiptDetails.client.gstNumber}</div>}
              </div>
            </div>

            {/* Reference metadata info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '11px', marginBottom: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span>
                <span style={{ fontWeight: 600, marginLeft: '4px', color: 'white' }}>{receiptDetails.invoiceNumber}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ fontWeight: 600, marginLeft: '4px', color: 'white' }}>{receiptDetails.invoiceDate}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Due Date:</span>
                <span style={{ fontWeight: 600, marginLeft: '4px', color: 'white' }}>{receiptDetails.dueDate}</span>
              </div>
            </div>

            {/* Invoice Line items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px' }}>Item Description</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {receiptDetails.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.description}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial breakdown: Taxable, CGST, SGST, IGST, net totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '260px', marginLeft: 'auto', fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Taxable Value:</span>
                <span style={{ color: 'white' }}>{formatCurrency(receiptDetails.subTotal)}</span>
              </div>

              {/* Dynamic state tax check */}
              {receiptDetails.isIntrastate ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CGST (9.0%):</span>
                    <span style={{ color: 'white' }}>{formatCurrency(receiptDetails.gstAmount / 2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>SGST (9.0%):</span>
                    <span style={{ color: 'white' }}>{formatCurrency(receiptDetails.gstAmount / 2)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>IGST (18.0%):</span>
                  <span style={{ color: 'white' }}>{formatCurrency(receiptDetails.gstAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                <span>Total Amount:</span>
                <span className="gradient-text">{formatCurrency(receiptDetails.totalAmount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button onClick={() => setShowReceiptModal(false)} className="btn btn-primary" style={{ width: '100%' }}>
                Close Invoice Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
