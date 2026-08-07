import React from 'react';

const faqs = [
  {
    question: 'How do I report a cyber crime?',
    answer: 'Create an account, fill out the complaint form, and upload any evidence you have. A case ID will be generated for tracking.'
  },
  {
    question: 'Can I track my complaint later?',
    answer: 'Yes. You can use the Track Complaint section with your complaint ID to review status updates.'
  },
  {
    question: 'What kind of evidence should I upload?',
    answer: 'Screenshots, transaction receipts, messages, emails, and account details are useful evidence.'
  },
  {
    question: 'Is the platform available 24/7?',
    answer: 'Yes. You can submit reports at any time, and emergency helpline numbers are available for urgent support.'
  }
];

function FAQ() {
  return (
    <section className="section py-5 bg-white">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">FAQ</span>
          <h2 className="fw-bold mt-3">Frequently asked questions</h2>
        </div>
        <div className="accordion" id="faqAccordion">
          {faqs.map((faq, index) => (
            <div className="accordion-item" key={faq.question}>
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#faq-${index}`}
                  aria-expanded="false"
                  aria-controls={`faq-${index}`}
                >
                  {faq.question}
                </button>
              </h2>
              <div id={`faq-${index}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
