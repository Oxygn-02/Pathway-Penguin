import { Resend } from "resend";

export interface OutgoingEmail { to: string; subject: string; html: string; text: string }

/** Tests replace this to capture emails instead of sending them. */
export const mailerHooks: { transport: null | ((m: OutgoingEmail) => Promise<void>) } = { transport: null };

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY || !!mailerHooks.transport;
}

/** Public base URL of the web app, used to build links in emails. */
export function appBaseUrl(): string {
  return process.env.APP_DOMAIN
    ? `https://${process.env.APP_DOMAIN}`
    : "http://localhost:3000";
}

/** Sends an email through Resend. Throws if sending fails or email isn't configured. */
export async function sendEmail(m: OutgoingEmail): Promise<void> {
  if (mailerHooks.transport) return mailerHooks.transport(m);
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email is not configured (RESEND_API_KEY missing).");
  const from = process.env.RESEND_FROM
    ? `Pathway Penguin <${process.env.RESEND_FROM}>`
    : "Pathway Penguin <onboarding@resend.dev>";
  const { error } = await new Resend(apiKey).emails.send({ from, to: m.to, subject: m.subject, html: m.html, text: m.text });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

/** Shared branded layout for transactional emails. `url` is the button target. */
export function emailTemplate(opts: { heading: string; intro: string; button: string; url: string; footer: string }): { html: string; text: string } {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1a3a4f;">
      <div style="background:#daeefa;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;font-size:20px;color:#1a3a4f;">🐧 Pathway Penguin</h2>
      </div>
      <div style="background:#ffffff;padding:32px;border:1px solid #daeefa;border-top:none;border-radius:0 0 12px 12px;">
        <h3 style="margin-top:0;color:#1a3a4f;">${opts.heading}</h3>
        <p>${opts.intro}</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${opts.url}" style="display:inline-block;padding:13px 28px;background:#5baed4;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">${opts.button}</a>
        </div>
        <p style="font-size:13px;color:#555;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size:12px;word-break:break-all;background:#f4f9fc;padding:10px 12px;border-radius:6px;color:#1a3a4f;">${opts.url}</p>
        <hr style="border:none;border-top:1px solid #eef7fd;margin:24px 0;">
        <p style="font-size:12px;color:#999;margin:0;">${opts.footer}</p>
      </div>
    </div>`;
  const text = `${opts.heading}\n\n${opts.intro.replace(/<[^>]+>/g, "")}\n\n${opts.url}\n\n${opts.footer}`;
  return { html, text };
}
