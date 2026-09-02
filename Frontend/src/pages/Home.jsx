import React from 'react';
import { useNavigate } from 'react-router-dom';
import About from '../components/About';
import CrimeCategories from '../components/CrimeCategories';
import ReportProcess from '../components/ReportProcess';
import Helpline from '../components/Helpline';
import SafetyTips from '../components/SafetyTips';
import Statistics from '../components/Statistics';
import FAQ from '../components/FAQ';
import Contact from '../components/Contact';
import { getUserToken } from '../utils/authStorage';

function Home() {
  const navigate = useNavigate();
  
  const handleReportClick = () => {
    const token = getUserToken();
    if (token) {
      navigate('/report');
    } else {
      navigate('/login');
    }
  };

  const handleTrackClick = () => {
    const token = getUserToken();
    if (token) {
      navigate('/track');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <section className="hero-section py-5">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-success">Secure Reporting</span>
                <span className="badge bg-white text-success">24/7 Support</span>
                <span className="badge bg-white text-success">Official Portal</span>
              </div>
              <h1 className="display-5 fw-bold mb-3 hero-title">National Cyber Crime Reporting Portal</h1>
              <p className="lead text-white mb-4">Report cyber crimes safely and securely with verified government support, evidence guidance, and real-time case tracking.</p>
              <div className="d-flex flex-wrap gap-3">
                <button className="btn btn-light btn-lg text-success" onClick={handleReportClick}>Report Cyber Crime</button>
                <button className="btn btn-outline-light btn-lg" onClick={handleTrackClick}>Track Complaint</button>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="hero-card p-4 shadow-sm">
                <h3 className="fw-bold mb-3">Immediate Response Channels</h3>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2"><i className="bi bi-telephone-fill text-success me-2"></i>National Cyber Helpline: 1930</li>
                  <li className="mb-2"><i className="bi bi-shield-fill-check text-success me-2"></i>Emergency Police: 112</li>
                  <li className="mb-2"><i className="bi bi-upload text-success me-2"></i>Secure Evidence Submission</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <About />
      <CrimeCategories />
      <ReportProcess />
      <Helpline />
      <SafetyTips />
      <Statistics />
      <FAQ />
      <Contact />
    </>
  );
}

export default Home;
