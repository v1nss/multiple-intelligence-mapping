import crypto from 'crypto';
import nodemailer from 'nodemailer';

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

function getResetSecret() {
  return process.env.JWT_RESET_SECRET || process.env.JWT_SECRET;
}

function getResetTokenTtlMs() {
  const minutes = parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '30', 10);
  return minutes * 60 * 1000;
}

function createTokenHash(token) {
  return crypto
    .createHmac('sha256', getResetSecret())
    .update(token)
    .digest('hex');
}

export function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = createTokenHash(rawToken);
  const expiresAt = new Date(Date.now() + getResetTokenTtlMs());

  return { rawToken, tokenHash, expiresAt };
}

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASS
      && process.env.SMTP_FROM
  );
}

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(email, rawToken) {
  const resetUrl = `${getClientUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const from = process.env.SMTP_FROM || 'no-reply@example.com';

  if (!isSmtpConfigured()) {
    console.warn(`[PasswordReset] SMTP not configured. Reset link for ${email}: ${resetUrl}`);
    return { sent: false, resetUrl };
  }

  const transporter = buildTransporter();
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset your password',
    text: `You requested a password reset. Open this link within 30 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
    `,
  });

  return { sent: true, resetUrl };
}

export function verifyPasswordResetToken(rawToken, tokenHashFromDb, expiresAt) {
  if (!rawToken || !tokenHashFromDb || !expiresAt) return false;
  if (new Date(expiresAt).getTime() < Date.now()) return false;
  return createTokenHash(rawToken) === tokenHashFromDb;
}
