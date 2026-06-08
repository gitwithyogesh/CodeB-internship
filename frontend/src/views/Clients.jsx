import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Mail, Phone, MapPin, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';

export default function Clients({ userRole }) {
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subzones, setSubzones] = useState([]);
  
  // Dynamic cascading dropdown arrays
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [orgDetails, setOrgDetails] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedChainId, setSelectedChainId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedSubzoneId, setSelectedSubzoneId] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchClientsAndHierarchy = async () => {
    setLoading(true);
    try {
      const [cRes, gRes, sRes] = await Promise.all([
        fetch('/api/clients', { headers }),
        fetch('/api/groups', { headers }),
        fetch('/api/subzones', { headers })
      ]);

      if (cRes.ok) setClients(await cRes.json());
      if (gRes.ok) setGroups(await gRes.json());
      if (sRes.ok) setSubzones(await sRes.json());
    } catch (e) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsAndHierarchy();
  }, []);

  // Cascading Selection Trigger 1: Group Changed
  const handleGroupChange = async (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedChainId('');
    setSelectedBrandId('');
    setChains([]);
    setBrands([]);

    if (!groupId) return;

    try {
      const res = await fetch(`/api/chains/by-group/${groupId}`, { headers });
      if (res.ok) {
        setChains(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cascading Selection Trigger 2: Chain Changed
  const handleChainChange = async (chainId) => {
    setSelectedChainId(chainId);
    setSelectedBrandId('');
    setBrands([]);

    if (!chainId) return;

    try {
      const res = await fetch(`/api/brands/by-chain/${chainId}`, { headers });
      if (res.ok) {
        setBrands(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const clientBody = {
      name,
      organizationDetails: orgDetails,
      email,
      phone,
      gstNumber,
      address,
      group: selectedGroupId ? { groupId: parseInt(selectedGroupId, 10) } : null,
      chain: selectedChainId ? { chainId: parseInt(selectedChainId, 10) } : null,
      brand: selectedBrandId ? { brandId: parseInt(selectedBrandId, 10) } : null,
      subzone: selectedSubzoneId ? { subzoneId: parseInt(selectedSubzoneId, 10) } : null
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientBody)
      });

      if (res.ok) {
        setSuccess('Client created successfully!');
        setShowModal(false);
        // Clear fields
        setName('');
        setOrgDetails('');
        setEmail('');
        setPhone('');
        setGstNumber('');
        setAddress('');
        setSelectedGroupId('');
        setSelectedChainId('');
        setSelectedBrandId('');
        setSelectedSubzoneId('');
        fetchClientsAndHierarchy();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save client.');
      }
    } catch (e) {
      setError('Database connection error.');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client? This will delete all estimates and invoices mapped to them.')) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setSuccess('Client profile deleted successfully.');
        fetchClientsAndHierarchy();
      } else {
        setError('Unauthorized: Admin rights are required.');
      }
    } catch (e) {
      setError('Server connection error.');
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: 700 }}>
            Clients Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage organization clients, GST codes, billing addresses, and parent structures.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Add Client
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

      {/* Main Table */}
      <div className="glass" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Client Info</th>
                <th style={{ padding: '12px' }}>Organization Details</th>
                <th style={{ padding: '12px' }}>GST Number</th>
                <th style={{ padding: '12px' }}>Hierarchy Mapping</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No clients found. Click "Add Client" to populate the database.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.clientId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Mail size={10} /> {c.email}</span>
                        {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Phone size={10} /> {c.phone}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{c.organizationDetails || 'N/A'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{c.gstNumber || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      {c.group && <span className="verify-badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '2px 6px', marginRight: '4px' }}>G: {c.group.groupName}</span>}
                      {c.chain && <span className="verify-badge" style={{ background: 'rgba(236,72,153,0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)', padding: '2px 6px', marginRight: '4px' }}>C: {c.chain.chainName}</span>}
                      {c.brand && <span className="verify-badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid var(--warning)', padding: '2px 6px', marginRight: '4px' }}>B: {c.brand.brandName}</span>}
                      {c.subzone && <span className="verify-badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid var(--success)', padding: '2px 6px' }}>Z: {c.subzone.subzoneName}</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteClient(c.clientId)} 
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
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

      {/* Add Client Modal */}
      {showModal && (
        <div className="inactivity-overlay">
          <div className="inactivity-modal glass animate-fade" style={{ maxWidth: '580px', textAlign: 'left' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Add New Client
            </h3>
            
            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Client Name</label>
                  <div className="input-wrapper no-icon">
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Organization Details</label>
                  <div className="input-wrapper no-icon">
                    <input 
                      type="text" 
                      value={orgDetails} 
                      onChange={(e) => setOrgDetails(e.target.value)} 
                      placeholder="e.g. Rel Ltd"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper no-icon">
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="client@org.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper no-icon">
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>GST Number (GSTIN)</label>
                  <div className="input-wrapper no-icon">
                    <input 
                      type="text" 
                      value={gstNumber} 
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())} 
                      maxLength={15}
                      placeholder="07AAAAA1111A1Z1"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subzone (Geographic)</label>
                  <div className="input-wrapper no-icon">
                    <select 
                      value={selectedSubzoneId} 
                      onChange={(e) => setSelectedSubzoneId(e.target.value)}
                    >
                      <option value="">-- Select Subzone --</option>
                      {subzones.map(s => (
                        <option key={s.subzoneId} value={s.subzoneId}>{s.subzoneName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cascade Hierarchy Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '10px' }}>1. Group</label>
                  <div className="input-wrapper no-icon">
                    <select 
                      value={selectedGroupId} 
                      onChange={(e) => handleGroupChange(e.target.value)}
                    >
                      <option value="">-- Select Group --</option>
                      {groups.map(g => (
                        <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '10px' }}>2. Chain (Cascading)</label>
                  <div className="input-wrapper no-icon">
                    <select 
                      value={selectedChainId} 
                      onChange={(e) => handleChainChange(e.target.value)}
                      disabled={!selectedGroupId}
                    >
                      <option value="">-- Select Chain --</option>
                      {chains.map(c => (
                        <option key={c.chainId} value={c.chainId}>{c.chainName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '10px' }}>3. Brand (Cascading)</label>
                  <div className="input-wrapper no-icon">
                    <select 
                      value={selectedBrandId} 
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      disabled={!selectedChainId}
                    >
                      <option value="">-- Select Brand --</option>
                      {brands.map(b => (
                        <option key={b.brandId} value={b.brandId}>{b.brandName}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              <div className="form-group">
                <label>Billing Address</label>
                <div className="input-wrapper no-icon">
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    rows="2" 
                    placeholder="Enter complete billing address"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Client
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
