type InviteEmailArgs = {
  orgName:     string;
  inviterName: string;
  role:        "admin" | "employee";
  acceptUrl:   string;
};

export function inviteEmail({ orgName, inviterName, role, acceptUrl }: InviteEmailArgs) {
  const roleLabel = role === "admin" ? "workspace admin" : "team member";
  const subject   = `${inviterName} invited you to join ${orgName} on AllyTracker`;

  const text = [
    `${inviterName} invited you to join ${orgName} on AllyTracker as a ${roleLabel}.`,
    "",
    `Accept the invitation:`,
    acceptUrl,
    "",
    `If you didn't expect this email, you can safely ignore it. The link expires in 7 days.`,
    "",
    `— AllyTracker`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F5F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1424;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2DDD6;border-radius:14px;overflow:hidden;">
          <tr><td style="padding:32px 36px 12px;">
            <div style="display:inline-block;width:36px;height:36px;border-radius:8px;background:linear-gradient(115deg,#FF8A4C 0%,#FF4A8E 32%,#B254E8 64%,#5B6CFF 100%);"></div>
            <div style="font-size:13px;font-weight:600;color:#4A4259;margin-top:18px;letter-spacing:0.04em;text-transform:uppercase;">You've been invited</div>
            <h1 style="font-size:24px;line-height:1.25;font-weight:600;margin:6px 0 14px;color:#1A1424;">Join ${escapeHtml(orgName)} on AllyTracker</h1>
            <p style="font-size:15px;line-height:1.55;color:#4A4259;margin:0 0 22px;">
              <strong>${escapeHtml(inviterName)}</strong> invited you to join <strong>${escapeHtml(orgName)}</strong> as a <strong>${roleLabel}</strong>.
            </p>
            <a href="${acceptUrl}" style="display:inline-block;padding:13px 22px;background:linear-gradient(115deg,#FF8A4C 0%,#FF4A8E 32%,#B254E8 64%,#5B6CFF 100%);color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">
              Accept invitation
            </a>
            <p style="font-size:13px;color:#6B647A;margin:22px 0 0;">
              Or paste this link into your browser:<br/>
              <span style="word-break:break-all;color:#4A4259;">${acceptUrl}</span>
            </p>
          </td></tr>
          <tr><td style="padding:18px 36px 28px;border-top:1px solid #EEEAE4;">
            <p style="font-size:12px;color:#6B647A;line-height:1.55;margin:0;">
              If you didn't expect this email, you can safely ignore it. This invite expires in 7 days.
            </p>
          </td></tr>
        </table>
        <p style="font-size:11px;color:#888093;margin-top:18px;">
          AllyTracker — privacy-first time tracking
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
