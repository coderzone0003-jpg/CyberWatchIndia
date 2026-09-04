import React, { useState } from 'react';

function Settings() {
  const [portalStatus, setPortalStatus] = useState('Active');
  const [autoAssign, setAutoAssign] = useState('Enabled');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="contact-form p-4 rounded-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">System Settings</h4>
        <span className="badge bg-success">Admin Only</span>
      </div>
      {saved && <div className="alert alert-success py-2" role="alert">Settings saved successfully.</div>}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="portal-status">Portal Status</label>
          <select id="portal-status" className="form-select" value={portalStatus} onChange={(e) => setPortalStatus(e.target.value)}>
            <option>Active</option>
            <option>Maintenance</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="auto-assign">Auto-Assign Officer</label>
          <select id="auto-assign" className="form-select" value={autoAssign} onChange={(e) => setAutoAssign(e.target.value)}>
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
        </div>
        <div className="col-12">
          <button className="btn btn-success" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
