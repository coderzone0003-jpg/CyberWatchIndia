import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function AdminLayout({ onLogout }) {
  return (
    <section className="section py-4">
      <div className="container-fluid">
        <div className="row g-4">
          <div className="col-lg-3">
            <Sidebar onLogout={onLogout} />
          </div>
          <div className="col-lg-9">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminLayout;
