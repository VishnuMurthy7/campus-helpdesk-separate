import { ENV } from "./_core/env";

type ResetEmail = { to: string; collegeName: string; resetUrl: string };

/** Sends a reset link when production email credentials are configured. Never returns email-provider details to callers. */
export async function sendAdminPasswordResetEmail({ to, collegeName, resetUrl }: ResetEmail) {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] Password reset requested but Resend is not configured.");
    return { delivered: false, reason: "not_configured" as const };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ENV.resendFromEmail,
      to: [to],
      subject: `Reset your ${collegeName} Campus Helpdesk password`,
      html: `<main style="font-family:Arial,sans-serif;line-height:1.55;color:#102a43;max-width:600px;margin:auto;padding:24px"><h1 style="font-size:24px">Reset your administrator password</h1><p>We received a request to reset the administrator password for <strong>${collegeName}</strong>.</p><p><a href="${resetUrl}" style="display:inline-block;background:#102a43;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Reset password</a></p><p>This link expires in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p></main>`,
    }),
  });
  if (!response.ok) throw new Error("Password reset email delivery failed.");
  return { delivered: true as const };
}
