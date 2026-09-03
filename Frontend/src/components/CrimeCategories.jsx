import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const crimeIcons = {
  'cyber bullying': 'bi-emoji-angry-fill',
  'phishing': 'bi-fishing',
  'online fraud': 'bi-credit-card-fill',
  'data theft': 'bi-database-fill-lock',
  'hacking': 'bi-terminal-fill',
  'identity theft': 'bi-person-fill-lock',
  'ransomware': 'bi-file-earmark-lock-fill',
  'cyber stalking': 'bi-eye-fill',
  'financial fraud': 'bi-cash-stack',
  'email fraud': 'bi-envelope-at-fill',
  'social media fraud': 'bi-megaphone-fill',
  'default': 'bi-shield-fill-check'
};

function getIcon(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, icon] of Object.entries(crimeIcons)) {
    if (lower.includes(key)) return icon;
  }
  return crimeIcons.default;
}

function CrimeCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.getComplaintCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  return (
    <section className="section py-5 bg-white">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Crime Categories</span>
          <h2 className="fw-bold mt-3">Common cyber crime types we support</h2>
        </div>
        <div className="row g-4">
          {categories.map((category) => (
            <div className="col-sm-6 col-lg-3" key={category.id || category.name}>
              <div className="category-card p-4 h-100 text-center">
                <i className={`bi ${getIcon(category.name)} display-6 text-success mb-3`}></i>
                <h3 className="fw-bold fs-5">{category.name}</h3>
                {category.description && <p className="text-muted small mt-2 mb-0">{category.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CrimeCategories;
