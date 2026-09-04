import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

function ManageContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, new: 0, read: 0, replied: 0, archived: 0, unread: 0 });
  const [filters, setFilters] = useState({ status: '', is_read: '', search: '' });
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [viewModal, setViewModal] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { ...filters, limit: pagination.limit, offset: pagination.offset };
      const data = await api.getContactMessages(params);
      setMessages(data.messages || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (err) {
      console.error('Failed to fetch contact messages:', err);
      setError(err.message || 'Failed to load contact messages.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getContactStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleViewMessage = async (id) => {
    try {
      const msg = await api.getContactMessageById(id);
      setSelectedMsg(msg);
      setViewModal(true);
      // Update local read status
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true, status: m.status === 'new' ? 'read' : m.status } : m));
      fetchStats();
    } catch (err) {
      setError('Failed to load message details');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateContactStatus(id, status);
      fetchMessages();
      fetchStats();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleToggleRead = async (id) => {
    try {
      await api.toggleContactRead(id);
      fetchMessages();
      fetchStats();
    } catch (err) {
      setError('Failed to toggle read status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
    try {
      await api.deleteContactMessage(id);
      fetchMessages();
      fetchStats();
      if (selectedMsg?.id === id) {
        setViewModal(false);
        setSelectedMsg(null);
      }
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      setError('Please select at least one message');
      return;
    }
    const actionLabels = { delete: 'delete', mark_read: 'mark as read', archive: 'archive' };
    if (!window.confirm(`Are you sure you want to ${actionLabels[action]} ${selectedIds.length} message(s)?`)) return;

    try {
      await api.bulkContactAction(selectedIds, action);
      setSelectedIds([]);
      fetchMessages();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Bulk action failed');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(messages.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
    setSelectedIds([]);
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: Math.max(0, newOffset) }));
    setSelectedIds([]);
  };

  const getStatusBadge = (status) => {
    const map = {
      new: 'bg-danger',
      read: 'bg-primary',
      replied: 'bg-success',
      archived: 'bg-secondary'
    };
    return map[status] || 'bg-secondary';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && messages.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading messages...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total', value: stats.total, icon: 'bi-envelope', color: 'primary' },
          { label: 'New', value: stats.new, icon: 'bi-envelope-plus', color: 'danger' },
          { label: 'Unread', value: stats.unread, icon: 'bi-envelope-open', color: 'warning' },
          { label: 'Replied', value: stats.replied, icon: 'bi-reply', color: 'success' },
          { label: 'Archived', value: stats.archived, icon: 'bi-archive', color: 'secondary' }
        ].map(s => (
          <div className="col-md" key={s.label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className={`bi ${s.icon} text-${s.color} fs-4`}></i>
                <h4 className="fw-bold mt-2 mb-0">{s.value}</h4>
                <small className="text-muted">{s.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="contact-form p-4 rounded-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h4 className="fw-bold mb-0">Contact Messages</h4>
          <div className="d-flex gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <>
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleBulkAction('mark_read')}>
                  <i className="bi bi-envelope-open me-1"></i>Mark Read ({selectedIds.length})
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleBulkAction('archive')}>
                  <i className="bi bi-archive me-1"></i>Archive ({selectedIds.length})
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleBulkAction('delete')}>
                  <i className="bi bi-trash me-1"></i>Delete ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="row g-2 mb-4">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search name, email, subject..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-3">
            <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" name="is_read" value={filters.is_read} onChange={handleFilterChange}>
              <option value="">All Read Status</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={() => { setFilters({ status: '', is_read: '', search: '' }); setPagination(prev => ({ ...prev, offset: 0 })); }}>
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" className="form-check-input" onChange={handleSelectAll} checked={selectedIds.length === messages.length && messages.length > 0} />
                </th>
                <th>From</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No messages found</td>
                </tr>
              ) : (
                messages.map(msg => (
                  <tr key={msg.id} className={!msg.is_read ? 'table-light' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.includes(msg.id)}
                        onChange={() => handleSelectOne(msg.id)}
                      />
                    </td>
                    <td>
                      <div>
                        <strong className={!msg.is_read ? 'text-dark' : 'text-muted'}>{msg.name}</strong>
                        {!msg.is_read && <span className="badge bg-danger ms-2" style={{ fontSize: '0.6rem' }}>NEW</span>}
                      </div>
                      <small className="text-muted">{msg.email}</small>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: '250px' }}>{msg.subject}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(msg.status)}`}>{msg.status}</span>
                    </td>
                    <td><small>{formatDate(msg.created_at)}</small></td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" title="View" onClick={() => handleViewMessage(msg.id)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-outline-warning" title={msg.is_read ? 'Mark Unread' : 'Mark Read'} onClick={() => handleToggleRead(msg.id)}>
                          <i className={`bi ${msg.is_read ? 'bi-envelope' : 'bi-envelope-open'}`}></i>
                        </button>
                        <button className="btn btn-outline-danger" title="Delete" onClick={() => handleDelete(msg.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </small>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.offset === 0 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(pagination.offset - pagination.limit)}>Prev</button>
              </li>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const startPage = Math.max(0, Math.floor(pagination.offset / pagination.limit) - 2);
                const page = startPage + i;
                if (page >= totalPages) return null;
                return (
                  <li key={page} className={`page-item ${pagination.offset === page * pagination.limit ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(page * pagination.limit)}>{page + 1}</button>
                  </li>
                );
              })}
              <li className={`page-item ${pagination.offset + pagination.limit >= pagination.total ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(pagination.offset + pagination.limit)}>Next</button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {/* View Message Modal */}
      {viewModal && selectedMsg && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="msg-modal-title" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => setViewModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold" id="msg-modal-title">
                  <i className="bi bi-envelope me-2 text-success"></i>
                  {selectedMsg.subject}
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">From</small>
                    <strong>{selectedMsg.name}</strong>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Email</small>
                    <a href={`mailto:${selectedMsg.email}`}>{selectedMsg.email}</a>
                  </div>
                  {selectedMsg.phone && (
                    <div className="col-md-6">
                      <small className="text-muted d-block">Phone</small>
                      <a href={`tel:${selectedMsg.phone}`}>{selectedMsg.phone}</a>
                    </div>
                  )}
                  <div className="col-md-6">
                    <small className="text-muted d-block">Date</small>
                    {formatDate(selectedMsg.created_at)}
                  </div>
                </div>
                <hr />
                <div className="p-3 rounded" style={{ background: '#f8f9fa', whiteSpace: 'pre-wrap' }}>
                  {selectedMsg.message}
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={selectedMsg.status}
                    onChange={(e) => {
                      handleStatusChange(selectedMsg.id, e.target.value);
                      setSelectedMsg(prev => ({ ...prev, status: e.target.value }));
                    }}
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => { handleDelete(selectedMsg.id); setViewModal(false); }}>
                    <i className="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageContacts;
