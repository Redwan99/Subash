// lib/email.ts
// SMTP email system for transactional emails.
// Uses nodemailer with configurable SMTP transport.

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const FROM = process.env.SMTP_FROM || "Subash <noreply@subash.rico.bd>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://subash.rico.bd";

// ── Helpers ──────────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="font-size:24px;font-weight:700;color:#E84393;margin:0">Subash</h1>
      <p style="font-size:12px;color:#999;margin:4px 0 0">Bangladesh's Fragrance Community</p>
    </div>
    <div style="background:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;padding:32px 24px">
      <h2 style="font-size:18px;font-weight:600;color:#fff;margin:0 0 16px">${title}</h2>
      ${body}
    </div>
    <p style="text-align:center;font-size:11px;color:#666;margin-top:24px">
      &copy; ${new Date().getFullYear()} Subash. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Welcome to Subash!",
    html: baseTemplate(
      `Welcome, ${name}!`,
      `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 16px">
        Your account has been created successfully. You can now explore Bangladesh's largest fragrance encyclopedia, write reviews, and connect with the community.
      </p>
      <a href="${SITE_URL}" style="display:inline-block;background:#E84393;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Start Exploring
      </a>`
    ),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (!process.env.SMTP_HOST) return;
  const resetUrl = `${SITE_URL}/forgot-password?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset Your Password — Subash",
    html: baseTemplate(
      "Password Reset",
      `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 16px">
        We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#E84393;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Reset Password
      </a>
      <p style="color:#888;font-size:12px;margin-top:16px">
        If you didn't request this, you can safely ignore this email.
      </p>`
    ),
  });
}

export async function sendAdminNewUserNotification(
  adminEmail: string,
  newUser: { name: string; email: string }
) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `New User Signup — ${newUser.name}`,
    html: baseTemplate(
      "New User Registered",
      `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 8px">
        A new user has joined Subash:
      </p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr>
          <td style="color:#888;font-size:13px;padding:4px 0">Name</td>
          <td style="color:#fff;font-size:13px;padding:4px 0;font-weight:600">${newUser.name}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:13px;padding:4px 0">Email</td>
          <td style="color:#fff;font-size:13px;padding:4px 0">${newUser.email}</td>
        </tr>
      </table>
      <a href="${SITE_URL}/admin" style="display:inline-block;background:#E84393;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        View in Admin Panel
      </a>`
    ),
  });
}

export async function sendAccountInfoEmail(
  to: string,
  info: { name: string; email: string; role: string }
) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your Account Information — Subash",
    html: baseTemplate(
      "Account Information",
      `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 8px">
        Here are your account details:
      </p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr>
          <td style="color:#888;font-size:13px;padding:4px 0">Name</td>
          <td style="color:#fff;font-size:13px;padding:4px 0;font-weight:600">${info.name}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:13px;padding:4px 0">Email</td>
          <td style="color:#fff;font-size:13px;padding:4px 0">${info.email}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:13px;padding:4px 0">Role</td>
          <td style="color:#fff;font-size:13px;padding:4px 0">${info.role}</td>
        </tr>
      </table>
      <a href="${SITE_URL}/profile" style="display:inline-block;background:#E84393;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        View Profile
      </a>`
    ),
  });
}

export async function sendPasswordChangedEmail(to: string, name: string) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Password Changed — Subash",
    html: baseTemplate(
      "Password Updated",
      `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 16px">
        Hi ${name}, your password was successfully changed. If you did not make this change, please contact us immediately.
      </p>`
    ),
  });
}
