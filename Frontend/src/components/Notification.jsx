import React, { useEffect } from 'react';

function Notification({ message, type, onClose, autoHideMs = 5000 }) {
  useEffect(() => {
    if (!message || !autoHideMs) return undefined;

    const timer = setTimeout(() => {
      onClose?.();
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [message, autoHideMs, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-show alert alert-${type} d-flex align-items-center justify-content-between`} role="status">
      <span>{message}</span>
      <button type="button" className="btn-close" onClick={onClose} aria-label="Close notification"></button>
    </div>
  );
}

export default Notification;
