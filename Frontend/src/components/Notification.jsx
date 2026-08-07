import React from 'react';

function Notification({ message, type, onClose }) {
  if (!message) return null;

  return (
    <div className={`toast-show alert alert-${type} d-flex align-items-center justify-content-between`} role="status">
      <span>{message}</span>
      <button className="btn-close" onClick={onClose}></button>
    </div>
  );
}

export default Notification;
