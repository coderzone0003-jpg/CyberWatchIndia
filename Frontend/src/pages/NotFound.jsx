import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="section py-5 text-center">
      <div className="container">
        <h1 className="display-1 fw-bold text-success">404</h1>
        <h3 className="fw-bold">Page Not Found</h3>
        <p className="text-muted">The page you are trying to access does not exist or has been moved.</p>
        <Link className="btn btn-success" to="/">Return Home</Link>
      </div>
    </section>
  );
}

export default NotFound;
