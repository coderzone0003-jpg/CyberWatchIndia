const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@cyberportal.gov';
const FROM_NAME = process.env.FROM_NAME || 'Cyber Crime Portal';

function getFrontendUrl(path = '') {
  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Send an email using Resend
 */
async function sendEmail({ to, subject, html, text }) {
  if (!resend) {
    console.warn('⚠️  Resend not configured. Email would be sent to:', to);
    console.warn('Subject:', subject);
    console.warn('Set RESEND_API_KEY in .env to enable email sending');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const response = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    });

    console.log('✅ Email sent successfully:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send complaint confirmation email
 */
async function sendComplaintConfirmation({ to, trackingId, title, userName }) {
  const subject = `Complaint Submitted Successfully - ${trackingId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complaint Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .tracking-id { background: #e7f3ff; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .tracking-id h2 { margin: 0; color: #0066cc; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Complaint Submitted Successfully</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          <p>Your complaint has been successfully submitted to the Cyber Crime Reporting Portal.</p>
          
          <div class="tracking-id">
            <h2>${trackingId}</h2>
            <p><strong>Your Complaint Tracking ID</strong></p>
          </div>
          
          <p><strong>Complaint Details:</strong></p>
          <ul>
            <li>Title: ${title}</li>
            <li>Tracking ID: ${trackingId}</li>
            <li>Status: Pending</li>
          </ul>
          
          <p>You can track the status of your complaint using the tracking ID above.</p>
          
          <a href="${getFrontendUrl('/track')}" class="button">Track Your Complaint</a>
          
          <p>If you have any questions or need to provide additional information, please contact our helpline.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>Cyber Crime Reporting Portal - Government of India</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Complaint Submitted Successfully
    
    Dear ${userName},
    
    Your complaint has been successfully submitted to the Cyber Crime Reporting Portal.
    
    Your Complaint Tracking ID: ${trackingId}
    Complaint Title: ${title}
    Status: Pending
    
    You can track the status of your complaint using the tracking ID above.
    
    If you have any questions or need to provide additional information, please contact our helpline.
    
    This is an automated email. Please do not reply to this message.
    
    Cyber Crime Reporting Portal - Government of India
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send complaint status update email
 */
async function sendStatusUpdate({ to, trackingId, title, newStatus, oldStatus }) {
  const subject = `Complaint Status Updated - ${trackingId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .status-change { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Complaint Status Updated</h1>
        </div>
        <div class="content">
          <p>Your complaint status has been updated.</p>
          
          <div class="status-change">
            <p><strong>Status Change:</strong></p>
            <p><span style="text-decoration: line-through; color: #999;">${oldStatus}</span> → <strong>${newStatus}</strong></p>
          </div>
          
          <p><strong>Complaint Details:</strong></p>
          <ul>
            <li>Tracking ID: ${trackingId}</li>
            <li>Title: ${title}</li>
            <li>New Status: ${newStatus}</li>
          </ul>
          
          <a href="${getFrontendUrl('/track')}" class="button">View Complaint Details</a>
          
          <p>If you have any questions about this status change, please contact our helpline.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>Cyber Crime Reporting Portal - Government of India</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Complaint Status Updated
    
    Your complaint status has been updated.
    
    Status Change: ${oldStatus} → ${newStatus}
    
    Complaint Details:
    Tracking ID: ${trackingId}
    Title: ${title}
    New Status: ${newStatus}
    
    If you have any questions about this status change, please contact our helpline.
    
    This is an automated email. Please do not reply to this message.
    
    Cyber Crime Reporting Portal - Government of India
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send officer assignment email
 */
async function sendOfficerAssignment({ to, trackingId, title, officerName }) {
  const subject = `New Complaint Assigned - ${trackingId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .assignment { background: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #17a2b8; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Complaint Assigned</h1>
        </div>
        <div class="content">
          <p>Dear ${officerName},</p>
          <p>A new complaint has been assigned to you for investigation.</p>
          
          <div class="assignment">
            <p><strong>Assignment Details:</strong></p>
            <p>Tracking ID: ${trackingId}</p>
            <p>Title: ${title}</p>
          </div>
          
          <p>Please review the complaint details and begin the investigation process.</p>
          
          <a href="${getFrontendUrl('/admin')}" class="button">View Assigned Complaint</a>
          
          <p>If you have any questions, please contact your supervisor.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>Cyber Crime Reporting Portal - Government of India</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    New Complaint Assigned
    
    Dear ${officerName},
    
    A new complaint has been assigned to you for investigation.
    
    Assignment Details:
    Tracking ID: ${trackingId}
    Title: ${title}
    
    Please review the complaint details and begin the investigation process.
    
    If you have any questions, please contact your supervisor.
    
    This is an automated email. Please do not reply to this message.
    
    Cyber Crime Reporting Portal - Government of India
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail({ to, resetLink, userName }) {
  const subject = 'Password Reset Request - Cyber Crime Portal';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Dear ${userName || 'User'},</p>
          <p>We received a request to reset your password for your Cyber Crime Portal account.</p>
          <p>If you did not make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you have any questions, please contact our helpline.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>Cyber Crime Reporting Portal - Government of India</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request
    
    Dear ${userName || 'User'},
    
    We received a request to reset your password for your Cyber Crime Portal account.
    
    If you did not make this request, you can safely ignore this email.
    
    To reset your password, visit this link:
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you have any questions, please contact our helpline.
    
    This is an automated email. Please do not reply to this message.
    
    Cyber Crime Reporting Portal - Government of India
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send email verification email
 */
async function sendVerificationEmail({ to, verificationLink, userName }) {
  const subject = 'Verify Your Email - Cyber Crime Portal';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Dear ${userName || 'User'},</p>
          <p>Thank you for registering with the Cyber Crime Reporting Portal.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${verificationLink}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you have any questions, please contact our helpline.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>Cyber Crime Reporting Portal - Government of India</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Verify Your Email
    
    Dear ${userName || 'User'},
    
    Thank you for registering with the Cyber Crime Reporting Portal.
    
    Please verify your email address by visiting this link:
    ${verificationLink}
    
    This link will expire in 24 hours.
    
    If you have any questions, please contact our helpline.
    
    This is an automated email. Please do not reply to this message.
    
    Cyber Crime Reporting Portal - Government of India
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send notification to admin when a new contact message is received
 */
async function sendContactMessageNotification({ name, email, phone, subject: msgSubject, message, createdAt }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberportal.gov';
  const subject = `[Contact Us] New Message from ${name}: ${msgSubject}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Us Message</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16A34A; color: white; padding: 15px; border-radius: 6px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 6px; margin-top: 15px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #16A34A; }
        .message-box { background: #fff; padding: 15px; border-left: 4px solid #16A34A; border-radius: 4px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Us Message Received</h2>
        </div>
        <div class="content">
          <div class="field"><span class="label">Sender:</span> ${name}</div>
          <div class="field"><span class="label">Email:</span> ${email}</div>
          <div class="field"><span class="label">Phone:</span> ${phone || 'Not provided'}</div>
          <div class="field"><span class="label">Subject:</span> ${msgSubject}</div>
          <div class="field"><span class="label">Received:</span> ${createdAt || new Date().toLocaleString('en-IN')}</div>
          <div class="field">
            <span class="label">Message:</span>
            <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    New Contact Us Message Received:
    Sender: ${name}
    Email: ${email}
    Phone: ${phone || 'Not provided'}
    Subject: ${msgSubject}
    Date: ${createdAt || new Date().toLocaleString('en-IN')}
    
    Message:
    ${message}
  `;

  return sendEmail({ to: adminEmail, subject, html, text });
}

module.exports = {
  sendEmail,
  sendComplaintConfirmation,
  sendStatusUpdate,
  sendOfficerAssignment,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendContactMessageNotification
};