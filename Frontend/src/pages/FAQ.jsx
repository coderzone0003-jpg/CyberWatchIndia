import React from 'react';

const faqs = [
  {
    question: 'How do I report a cyber crime?',
    answer: 'Use the Report Crime page, complete the complaint form, and upload relevant evidence. A complaint ID will be generated instantly.'
  },
  {
    question: 'How can I track my complaint?',
    answer: 'Use the Track Complaint page and enter your complaint ID to view the current investigation stage and updates.'
  },
  {
    question: 'What documents are required?',
    answer: 'You may upload screenshots, transaction receipts, email evidence, screenshots of chat conversations, and any supporting documents.'
  },
  {
    question: 'How long does the investigation take?',
    answer: 'The timeline depends on case complexity. The portal assigns status updates as investigations progress.'
  }
];

function FAQPage() {
  return (
    <section className="section py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">FAQ</span>
          <h2 className="fw-bold mt-3">Frequently asked questions</h2>
        </div>
        <div className="accordion" id="faqAccordion">
          {faqs.map((item, index) => (
            <div className="accordion-item" key={item.question}>
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#faq-${index}`}>
                  {item.question}
                </button>
              </h2>
              <div id={`faq-${index}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQPage;
