import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Notifications({ authUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const notifyRef = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (notifyRef.current && !notifyRef.current.contains(e.target)) setIsOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) {
      document.addEventListener('mousedown', h);
      document.addEventListener('keydown', k);
      return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
    }
  }, [isOpen]);

  useEffect(() => {
    if (authUser) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [authUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markAsRead(id);
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill text-success';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'error':
        return 'bi-x-circle-fill text-danger';
      default:
        return 'bi-info-circle-fill text-info';
    }
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'success':
        return 'border-success';
      case 'warning':
        return 'border-warning';
      case 'error':
        return 'border-danger';
      default:
        return 'border-info';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!authUser) return null;

  return (
    <div className="notifications-dropdown" ref={notifyRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-link position-relative p-2"
        style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchNotifications();
          // close sibling panels via custom event
          if (next) window.dispatchEvent(new CustomEvent('navbar:panel-open', { detail: 'notifications' }));
        }}
        title="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className="bi bi-bell" style={{ fontSize: '1.15rem' }}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 1040, background: 'rgba(0,0,0,0.18)' }} onClick={() => setIsOpen(false)} aria-hidden="true" />
        <div className="dropdown-menu show shadow border-0 rounded-3" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, left: 'auto', zIndex: 1050, display: 'block', width: 'min(90vw, 320px)', maxWidth: 'calc(100vw - 16px)', minWidth: '220px', background: '#fff', overflow: 'hidden' }}>
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-decoration-none"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="dropdown-item-text" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-bell-slash fs-1 mb-2"></i>
                <p className="mb-0">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item p-3 border-start border-4 mb-2 ${getNotificationTypeClass(notification.type)} ${notification.is_read ? 'opacity-50' : 'bg-light'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="d-flex align-items-start">
                    <i className={`bi ${getNotificationIcon(notification.type)} fs-5 me-2 mt-1`}></i>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <strong className="mb-1">{notification.title}</strong>
                        {!notification.is_read && (
                          <span className="badge bg-primary ms-2">New</span>
                        )}
                      </div>
                      <p className="mb-1 text-muted small">{notification.message}</p>
                      <small className="text-muted">{formatTime(notification.created_at)}</small>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer text-center border-top pt-2 mt-2">
              <button
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default Notifications;