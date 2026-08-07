import React from 'react';

const categories = [
  'UPI Fraud',
  'OTP Scam',
  'Phishing',
  'Hacking',
  'Identity Theft',
  'Social Media Fraud',
  'Online Shopping Fraud',
  'Cyber Bullying'
];

function CrimeCategories() {
  return (
    <section className="section py-5 bg-white">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Crime Categories</span>
          <h2 className="fw-bold mt-3">Common cyber crime types we support</h2>
        </div>
        <div className="row g-4">
          {categories.map((category) => (
            <div className="col-sm-6 col-lg-3" key={category}>
              <div className="category-card p-4 h-100 text-center">
                <i className="bi bi-shield-fill-check display-6 text-success mb-3"></i>
                <h5 className="fw-bold">{category}</h5>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CrimeCategories;
