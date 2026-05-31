import nodemailer from 'nodemailer';

const APP_NAME = process.env.APP_NAME || 'School ERP';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const roleLabels = {
  admin: 'Administrator',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

const buildCredentialsEmail = ({ name, email, password, role }) => {
  const roleLabel = roleLabels[role] || role;
  const subject = `${APP_NAME} – Your ${roleLabel} account has been created`;

  const text = `
Hello ${name},

An account has been created for you on ${APP_NAME}.

Role: ${roleLabel}
Email: ${email}
Password: ${password}

Sign in at: ${CLIENT_URL}/login

Please change your password after your first login.

If you did not expect this email, contact your school administrator.

— ${APP_NAME}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">${APP_NAME}</h2>
  <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
  <p>Your <strong>${escapeHtml(roleLabel)}</strong> account has been created. Use the credentials below to sign in:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 8px;">
    <tr><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;"><strong>Name</strong></td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(email)}</td></tr>
    <tr><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;"><strong>Password</strong></td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;"><code style="background:#fff;padding:2px 6px;border-radius:4px;">${escapeHtml(password)}</code></td></tr>
    <tr><td style="padding: 10px 14px;"><strong>Role</strong></td><td style="padding: 10px 14px;">${escapeHtml(roleLabel)}</td></tr>
  </table>
  <p><a href="${escapeHtml(CLIENT_URL)}/login" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Sign in</a></p>
  <p style="font-size: 13px; color: #64748b;">Please change your password after your first login.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8;">If you did not expect this email, contact your school administrator.</p>
</body>
</html>`.trim();

  return { subject, text, html };
};

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Send login credentials to a newly created user.
 * Returns { sent: boolean, error?: string } — never throws (account creation should not fail on email).
 */
export const sendAccountCredentialsEmail = async ({ name, email, password, role }) => {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] SMTP not configured — skipping credentials email to', email);
    }
    return { sent: false, skipped: true, reason: 'SMTP not configured' };
  }

  const transport = getTransporter();
  const from =
    process.env.MAIL_FROM || `"${APP_NAME}" <${process.env.SMTP_USER}>`;
  const { subject, text, html } = buildCredentialsEmail({ name, email, password, role });

  try {
    await transport.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send credentials to', email, err.message);
    return { sent: false, error: err.message };
  }
};

const buildPasswordResetEmail = ({ name, resetUrl }) => {
  const subject = `${APP_NAME} – Reset your password`;
  const text = `
Hello ${name},

You requested a password reset for your ${APP_NAME} account.

Reset your password by opening this link (valid for 1 hour):
${resetUrl}

If you did not request this, ignore this email. Your password will not change.

— ${APP_NAME}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">${APP_NAME}</h2>
  <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
  <p>You requested a password reset. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset password</a>
  </p>
  <p style="font-size: 13px; color: #64748b;">Or copy this link into your browser:<br/><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email.</p>
</body>
</html>`.trim();

  return { subject, text, html };
};

export const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  if (!isEmailConfigured()) {
    return { sent: false, skipped: true, reason: 'SMTP not configured' };
  }

  const transport = getTransporter();
  const from = process.env.MAIL_FROM || `"${APP_NAME}" <${process.env.SMTP_USER}>`;
  const { subject, text, html } = buildPasswordResetEmail({ name, resetUrl });

  try {
    await transport.sendMail({ from, to: email, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send password reset to', email, err.message);
    return { sent: false, error: err.message };
  }
};

export const verifyEmailConnection = async () => {
  const transport = getTransporter();
  if (!transport) return { ok: false, message: 'SMTP not configured' };
  try {
    await transport.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
