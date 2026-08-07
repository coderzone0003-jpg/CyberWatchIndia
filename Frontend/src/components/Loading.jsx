import React from 'react';

function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-card text-center">
        <div className="spinner"></div>
        <h4 className="fw-bold mt-3">Loading Secure Portal</h4>
        <p className="text-muted mb-0">Preparing the national cyber reporting system...</p>
      </div>
    </div>
  );
}

export default Loading;
