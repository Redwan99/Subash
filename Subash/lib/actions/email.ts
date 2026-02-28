"use server";
// lib/actions/email.ts
// Phase 12 — Email Engine powered by Resend

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Welcome Email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(userEmail: string, userName: string) {
    const firstName = userName.split(" ")[0];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Subash</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05));border:1px solid rgba(139,92,246,0.3);border-radius:16px;">
                <span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#8B5CF6,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">সুবাশ</span>
                <span style="display:block;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6B7280;margin-top:-2px;">Subash</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

              <!-- Purple top bar -->
              <div style="height:4px;background:linear-gradient(90deg,#8B5CF6,#A78BFA,#6D28D9);"></div>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 36px 32px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#8B5CF6;">Welcome to the Fold</p>
                    <h1 style="margin:0 0 20px;font-size:32px;font-weight:900;color:#F9FAFB;line-height:1.2;">
                      Hello, ${firstName}. 👋
                    </h1>
                    <p style="margin:0 0 24px;font-size:15px;color:#9CA3AF;line-height:1.7;">
                      Your account is ready on <strong style="color:#E5E7EB;">Subash</strong> — Bangladesh's first premium fragrance platform. 
                      You can now explore thousands of scents, review your favourites, build your wardrobe, and connect with fellow fragrance enthusiasts.
                    </p>

                    <!-- Feature bullets -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      ${[
            ["🗂️", "Fragrance Encyclopedia", "10,000+ perfumes with accord maps"],
            ["⭐", "Community Reviews", "Rate longevity, sillage, and more"],
            ["🧴", "Your Wardrobe", "Track what you have, had, and want"],
            ["🤖", "Nose AI", "Get personalized scent recommendations"],
        ].map(([emoji, title, desc]) => `
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;vertical-align:top;font-size:18px;">${emoji}</td>
                              <td style="vertical-align:top;">
                                <p style="margin:0;font-size:14px;font-weight:700;color:#E5E7EB;">${title}</p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6B7280;">${desc}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join("")}
                    </table>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://subash.app"}" 
                             style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8B5CF6,#A78BFA);border-radius:14px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(139,92,246,0.4);">
                            Explore Now →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer area inside card -->
              <div style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;color:#4B5563;line-height:1.6;">
                  You're receiving this because you just joined Subash. 
                  If this wasn't you, please ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#374151;">
                © ${new Date().getFullYear()} Subash — Bangladesh's Premier Fragrance Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
        const { data, error } = await resend.emails.send({
            from: "Subash <welcome@subash.app>",
            to: [userEmail],
            subject: `Welcome to Subash, ${firstName}! 🌸`,
            html,
        });

        if (error) {
            console.error("[email] sendWelcomeEmail error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (err) {
        console.error("[email] sendWelcomeEmail threw:", err);
        return { success: false, error: String(err) };
    }
}

// ── Newsletter Subscription Email ─────────────────────────────────────────────
export async function sendNewsletterConfirmation(email: string) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>You're subscribed — Subash</title></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:36px;text-align:center;">
              <p style="margin:0 0 16px;font-size:40px;">💌</p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#F9FAFB;">You&apos;re subscribed!</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#9CA3AF;line-height:1.7;">
                Welcome to the Subash newsletter. You&apos;ll be among the first to know about new drops, 
                exclusive reviews, and fragrance news from Bangladesh and beyond.
              </p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://subash.app"}"
                 style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#8B5CF6,#A78BFA);border-radius:12px;font-size:13px;font-weight:800;color:#ffffff;text-decoration:none;">
                Check it out →
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="font-size:11px;color:#374151;">© ${new Date().getFullYear()} Subash</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
        const { data, error } = await resend.emails.send({
            from: "Subash <newsletter@subash.app>",
            to: [email],
            subject: "You're subscribed to Subash 💌",
            html,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, id: data?.id };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}
