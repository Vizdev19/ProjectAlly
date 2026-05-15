/**
 * Thin Resend client — no SDK dependency, just fetch.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

type SendArgs = {
  to:      string | string[];
  subject: string;
  html:    string;
  text:    string;
  /** Optional reply-to address (e.g. the inviting admin) */
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Sends a transactional email through Resend. Returns ok:false if the API key
 * is missing (so callers can degrade gracefully) or the API rejects the call.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  // Default sender — works out of the box for testing on a Resend account.
  // Set RESEND_FROM to override once you've verified your own domain.
  const from = process.env.RESEND_FROM || "AllyTracker <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
        reply_to: replyTo,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
