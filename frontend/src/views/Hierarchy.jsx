import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, GitBranch, Layers, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

export default function Hierarchy({ userRole }) {
  const [activeTab, setActiveTab] = useState('groups');
  
  // Data States
  const [groups, setGroups] = useState([]);
  const [subzones, setSubzones] = useState([]);
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Loading & Errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals / Forms
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState(''); // 'group', 'subzone', 'chain', 'brand'
  
  // Form Fields
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  
  const [subzoneName, setSubzoneName] = useState('');
  const [subzoneRegion, setSubzoneRegion] = useState('');
  
  const [chainName, setChainName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  const [brandName, setBrandName] = useState('');
  const [selectedChainId, setSelectedChainId] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [gRes, sRes, cRes, bRes] = await Promise.all([
        fetch('/api/groups', { headers }),
        fetch('/api/subzones', { headers }),
        fetch('/api/chains', { headers }),
        fetch('/api/brands', { headers })
      ]);

      if (gRes.ok) setGroups(await gRes.json());
      if (sRes.ok) setSubzones(await sRes.json());
      if (cRes.ok) setChains(await cRes.json());
      if (bRes.ok) setBrands(await bRes.json());
      
    } catch (e) {
      setError('Failed to fetch hierarchy database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const clearForm = () => {
    setGroupName('');
    setGroupDesc('');
    setSubzoneName('');
    setSubzoneRegion('');
    setChainName('');
    setSelectedGroupId('');
    setBrandName('');
    setSelectedChainId('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    let url = '';
    let bodyObj = {};

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    if (formType === 'group') {
      url = '/api/groups';
      bodyObj = { groupName, description: groupDesc };
    } else if (formType === 'subzone') {
      url = '/api/subzones';
      bodyObj = { subzoneName, region: subzoneRegion };
    } else if (formType === 'chain') {
      url = '/api/chains';
      bodyObj = { 
        chainName, 
        group: { groupId: parseInt(selectedGroupId, 10) } 
      };
    } else if (formType === 'brand') {
      url = '/api/brands';
      bodyObj = { 
        brandName, 
        chain: { chainId: parseInt(selectedChainId, 10) } 
      };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyObj)
      });

      if (res.ok) {
        setSuccess(`Successfully added new ${formType}!`);
        setShowModal(false);
        clearForm();
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.message || `Failed to create ${formType}.`);
      }
    } catch (e) {
      setError('Database submission failed.');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This may affect linked clients.`)) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess(`${type} deleted successfully.`);
        fetchData();
      } else {
        setError(`Failed to delete ${type}. Make sure you have administrator privileges.`);
      }
    } catch (e) {
      setError('Connection to server failed.');
    }
  };

  const openAddModal = (type) => {
    setFormType(type);
    clearForm();
    setShowModal(true);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: 700 }}>
            Client Hierarchy
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Configure client Groups, Chains, Brands, and Subzones to structure invoicing.
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

      {/* Tabs Row */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '24px'
      }}>
        {[
          { id: 'groups', name: 'Groups', icon: Tag },
          { id: 'subzones', name: 'Subzones (Geography)', icon: MapPin },
          { id: 'chains', name: 'Chains', icon: GitBranch },
          { id: 'brands', name: 'Brands', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 4px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <Icon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="glass" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ textTransform: 'capitalize', fontSize: '18px', fontWeight: 600 }}>
                Existing {activeTab}
              </h3>
              <button 
                onClick={() => openAddModal(activeTab.slice(0, -1))} 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={14} /> Add {activeTab.slice(0, -1)}
              </button>
            </div>

            {/* Tab: Groups */}
            {activeTab === 'groups' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Group ID</th>
                    <th style={{ padding: '12px' }}>Group Name</th>
                    <th style={{ padding: '12px' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No groups found. Click "Add Group" to get started!</td>
                    </tr>
                  ) : (
                    groups.map((g) => (
                      <tr key={g.groupId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>#{g.groupId}</td>
                        <td style={{ padding: '12px' }}>{g.groupName}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{g.description || 'N/A'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDelete('group', g.groupId)} 
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

            {/* Tab: Subzones */}
            {activeTab === 'subzones' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Subzone ID</th>
                    <th style={{ padding: '12px' }}>Subzone Name</th>
                    <th style={{ padding: '12px' }}>Geographical Region</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subzones.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No subzones found.</td>
                    </tr>
                  ) : (
                    subzones.map((s) => (
                      <tr key={s.subzoneId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>#{s.subzoneId}</td>
                        <td style={{ padding: '12px' }}>{s.subzoneName}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.region || 'N/A'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDelete('subzone', s.subzoneId)} 
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

            {/* Tab: Chains */}
            {activeTab === 'chains' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Chain ID</th>
                    <th style={{ padding: '12px' }}>Chain Name</th>
                    <th style={{ padding: '12px' }}>Belongs To Group</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chains.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No chains found. Link chains to your groups.</td>
                    </tr>
                  ) : (
                    chains.map((c) => (
                      <tr key={c.chainId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>#{c.chainId}</td>
                        <td style={{ padding: '12px' }}>{c.chainName}</td>
                        <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 500 }}>{c.group?.groupName || 'N/A'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDelete('chain', c.chainId)} 
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

            {/* Tab: Brands */}
            {activeTab === 'brands' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Brand ID</th>
                    <th style={{ padding: '12px' }}>Brand Name</th>
                    <th style={{ padding: '12px' }}>Belongs To Chain</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No brands found.</td>
                    </tr>
                  ) : (
                    brands.map((b) => (
                      <tr key={b.brandId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>#{b.brandId}</td>
                        <td style={{ padding: '12px' }}>{b.brandName}</td>
                        <td style={{ padding: '12px', color: 'var(--secondary)', fontWeight: 500 }}>{b.chain?.chainName || 'N/A'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDelete('brand', b.brandId)} 
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
        )}
      </div>

      {/* CRUD Modal dialog */}
      {showModal && (
        <div className="inactivity-overlay">
          <div className="inactivity-modal glass animate-fade" style={{ maxWidth: '460px', textAlign: 'left' }}>
            <h3 style={{ textTransform: 'capitalize', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Add New {formType}
            </h3>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              
              {/* Form fields: Group */}
              {formType === 'group' && (
                <>
                  <div className="form-group">
                    <label>Group Name</label>
                    <div className="input-wrapper no-icon">
                      <input 
                        type="text" 
                        value={groupName} 
                        onChange={(e) => setGroupName(e.target.value)} 
                        required 
                        placeholder="e.g. Retail Clients"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <div className="input-wrapper no-icon">
                      <textarea 
                        value={groupDesc} 
                        onChange={(e) => setGroupDesc(e.target.value)} 
                        rows="3" 
                        placeholder="Describe the group category"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Form fields: Subzone */}
              {formType === 'subzone' && (
                <>
                  <div className="form-group">
                    <label>Subzone Name</label>
                    <div className="input-wrapper no-icon">
                      <input 
                        type="text" 
                        value={subzoneName} 
                        onChange={(e) => setSubzoneName(e.target.value)} 
                        required 
                        placeholder="e.g. North Zone - DL"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Region</label>
                    <div className="input-wrapper no-icon">
                      <input 
                        type="text" 
                        value={subzoneRegion} 
                        onChange={(e) => setSubzoneRegion(e.target.value)} 
                        placeholder="e.g. New Delhi NCR"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Form fields: Chain */}
              {formType === 'chain' && (
                <>
                  <div className="form-group">
                    <label>Chain Name</label>
                    <div className="input-wrapper no-icon">
                      <input 
                        type="text" 
                        value={chainName} 
                        onChange={(e) => setChainName(e.target.value)} 
                        required 
                        placeholder="e.g. Reliance Smart"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Belongs to Parent Group</label>
                    <div className="input-wrapper no-icon">
                      <select 
                        value={selectedGroupId} 
                        onChange={(e) => setSelectedGroupId(e.target.value)} 
                        required
                      >
                        <option value="">-- Select Group --</option>
                        {groups.map(g => (
                          <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Form fields: Brand */}
              {formType === 'brand' && (
                <>
                  <div className="form-group">
                    <label>Brand Name</label>
                    <div className="input-wrapper no-icon">
                      <input 
                        type="text" 
                        value={brandName} 
                        onChange={(e) => setBrandName(e.target.value)} 
                        required 
                        placeholder="e.g. Reliance Fresh"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Belongs to Parent Chain</label>
                    <div className="input-wrapper no-icon">
                      <select 
                        value={selectedChainId} 
                        onChange={(e) => setSelectedChainId(e.target.value)} 
                        required
                      >
                        <option value="">-- Select Chain --</option>
                        {chains.map(c => (
                          <option key={c.chainId} value={c.chainId}>{c.chainName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Details
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
