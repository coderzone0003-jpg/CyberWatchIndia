import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function AdminLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <section className="section py-4 admin-layout">
      <div className="container-fluid px-3 px-md-4">
        <div className="d-lg-none mb-3">
          <button
            type="button"
            className="btn btn-success w-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin menu"
          >
            <i className="bi bi-list me-2"></i>
            Admin Menu
          </button>
        </div>

        <div
          className={`admin-sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        <div className="row g-4">
          <div className={`col-lg-3 admin-sidebar-panel ${sidebarOpen ? 'show' : ''}`}>
            <Sidebar
              onLogout={onLogout}
              onNavigate={closeSidebar}
              onClose={closeSidebar}
            />
          </div>
          <div className="col-lg-9 admin-content-panel">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminLayout;
