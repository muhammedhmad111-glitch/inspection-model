import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Read a value from an env secret first, else the access-controlled app_secrets table.
async function getSecret(name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const url = Deno.env.get("SUPABASE_URL");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !svc) return null;
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  const { data } = await admin
    .from("app_secrets")
    .select("value")
    .eq("key", name)
    .maybeSingle();
  return data?.value ?? null;
}

type Transport = {
  hostname: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
  via: string;
};

/**
 * Any SMTP host wins over Gmail, so moving the reports onto the company mail
 * server is a matter of filling in three secrets — no redeploy.
 */
async function resolveTransport(): Promise<Transport | null> {
  const host = await getSecret("SMTP_HOST");
  const user = await getSecret("SMTP_USER");
  const pass = await getSecret("SMTP_PASSWORD");
  if (host && user && pass) {
    const port = Number(await getSecret("SMTP_PORT")) || 587;
    // 465 is implicit TLS; everything else (587, 25) negotiates STARTTLS.
    return { hostname: host, port, tls: port === 465, username: user, password: pass, via: host };
  }

  const gmailUser = await getSecret("GMAIL_USER");
  const gmailPass = await getSecret("GMAIL_APP_PASSWORD");
  if (gmailUser && gmailPass) {
    return {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      username: gmailUser,
      password: gmailPass,
      via: "gmail",
    };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { to, subject, text, html, filename, pdfBase64 } = await req.json();
    if (!Array.isArray(to) || to.length === 0) {
      return json({ error: "No recipients" }, 400);
    }
    const subj = subject ?? "Daily Inspection Report";
    const fromName = (await getSecret("REPORT_FROM_NAME")) ?? "CPIIS Inspection Reports";

    const smtp = await resolveTransport();
    if (smtp) {
      // The mailbox the report should appear to come from. Gmail only honours it
      // once it is a verified "Send mail as" address; otherwise it silently
      // rewrites the header back to the authenticated account.
      const fromEmail = (await getSecret("REPORT_FROM_EMAIL")) ?? smtp.username;
      const client = new SMTPClient({
        connection: {
          hostname: smtp.hostname,
          port: smtp.port,
          tls: smtp.tls,
          auth: { username: smtp.username, password: smtp.password },
        },
      });
      try {
        await client.send({
          from: `${fromName} <${fromEmail}>`,
          // Replies belong with the sender, not with whatever mailbox authenticated.
          replyTo: fromEmail,
          to,
          subject: subj,
          content: text && text.length ? text : " ",
          html: html || undefined,
          attachments: pdfBase64
            ? [
                {
                  filename: filename ?? "Daily-Inspection-Report.pdf",
                  content: pdfBase64,
                  encoding: "base64",
                  contentType: "application/pdf",
                },
              ]
            : [],
        });
      } finally {
        await client.close();
      }
      return json({ ok: true, via: smtp.via, from: fromEmail });
    }

    // ---- Fallback: Resend ----
    const apiKey = await getSecret("RESEND_API_KEY");
    if (!apiKey) {
      return json({ error: "خدمة الإيميل غير مفعّلة — لم تُضبط SMTP أو Resend بعد" }, 400);
    }
    // Resend refuses any domain that has not been verified in its dashboard, so
    // this keeps its own sandbox sender unless one is configured explicitly.
    const configured = await getSecret("REPORT_FROM_EMAIL");
    const from = configured ? `${fromName} <${configured}>` : "CPIIS <onboarding@resend.dev>";
    const payload: Record<string, unknown> = { from, to, subject: subj, text: text ?? "" };
    if (configured) payload.reply_to = configured;
    if (html) payload.html = html;
    if (pdfBase64) {
      payload.attachments = [
        { filename: filename ?? "Daily-Inspection-Report.pdf", content: pdfBase64 },
      ];
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json({ error: data?.message ?? data?.name ?? "Failed to send email", detail: data }, 400);
    }
    return json({ ok: true, via: "resend", id: data?.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
