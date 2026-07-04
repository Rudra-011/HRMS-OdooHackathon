const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"HRMS System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    };
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
};

const sendVerificationEmail = async (email, name, verificationUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">Verify Your Email</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering with HRMS. Please verify your email address by clicking the button below:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verificationUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px;">If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
      <p style="color: #ef4444; font-size: 13px;">This link expires in 24 hours.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from HRMS.</p>
    </div>
  `;
  await sendEmail({ to: email, subject: 'HRMS - Verify Your Email Address', html });
};

const sendRegistrationPendingEmail = async (hrEmail, employeeName, employeeEmail) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">New Employee Registration</h2>
      <p>Hello,</p>
      <p>A new employee has registered and is pending your approval:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${employeeName}</p>
        <p><strong>Email:</strong> ${employeeEmail}</p>
      </div>
      <p>Please login to the HRMS system to approve or reject this registration.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Review Registration
        </a>
      </div>
      <hr style="margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from HRMS.</p>
    </div>
  `;
  await sendEmail({ to: hrEmail, subject: 'HRMS - New Employee Registration Pending Approval', html });
};

const sendRegistrationStatusEmail = async (email, name, status, rejectionReason) => {
  const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
  const statusMessage = status === 'approved'
    ? 'Your registration has been approved. You can now login to the HRMS system.'
    : `Your registration has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">Registration Update</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your registration status has been updated to: 
        <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span>
      </p>
      <p>${statusMessage}</p>
      ${status === 'approved' ? `
        <div style="margin: 20px 0; text-align: center;">
          <a href="${process.env.CLIENT_URL}/signin" 
             style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Login Now
          </a>
        </div>
      ` : ''}
      <hr style="margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from HRMS.</p>
    </div>
  `;
  await sendEmail({ to: email, subject: `HRMS - Registration ${status.charAt(0).toUpperCase() + status.slice(1)}`, html });
};

const sendWelcomeEmail = async (email, loginId, password, name, verificationUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">Welcome to HRMS!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account has been created successfully. Here are your login credentials:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Login ID:</strong> ${loginId}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p style="color: #ef4444;"><strong>Important:</strong> Please change your password after first login.</p>
      ${verificationUrl ? `
        <p>First, please verify your email by clicking the button below:</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; word-break: break-all;">Or copy: ${verificationUrl}</p>
      ` : `
        <p>Login at: <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
      `}
      <hr style="margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from HRMS.</p>
    </div>
  `;
  await sendEmail({ to: email, subject: 'Welcome to HRMS - Your Login Credentials', html });
};

const sendLeaveStatusEmail = async (email, name, status, leaveType, startDate, endDate) => {
  const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">Leave Request Update</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your leave request has been <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span>.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Leave Type:</strong> ${leaveType}</p>
        <p><strong>From:</strong> ${new Date(startDate).toLocaleDateString()}</p>
        <p><strong>To:</strong> ${new Date(endDate).toLocaleDateString()}</p>
      </div>
    </div>
  `;
  await sendEmail({ to: email, subject: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendRegistrationPendingEmail,
  sendRegistrationStatusEmail,
  sendWelcomeEmail,
  sendLeaveStatusEmail
};