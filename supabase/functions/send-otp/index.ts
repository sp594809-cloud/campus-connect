import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { phone_number, email, full_name } = await req.json();
    if (!phone_number || !email) {
      return new Response(JSON.stringify({ error: "phone_number and email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalidate prior unconsumed codes for this phone
    await supabase.from("otp_codes").update({ consumed: true }).eq("phone_number", phone_number).eq("consumed", false);
    const { error: insErr } = await supabase.from("otp_codes").insert({ phone_number, code_hash, expires_at });
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const greeting = full_name ? `Hi ${String(full_name).split(" ")[0]},` : "Hi,";
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#ffffff;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 12px">Campus Connect Verification</h1>
        <p style="color:#475569;margin:0 0 20px">${greeting} use the code below to verify your account.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#eef2ff;color:#4338ca;padding:16px;text-align:center;border-radius:12px">${code}</div>
        <p style="color:#64748b;font-size:13px;margin-top:20px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">— Campus Connect</p>
      </div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Campus Connect <onboarding@resend.dev>",
        to: [email],
        subject: `Your Campus Connect verification code: ${code}`,
        html,
        text: `Your Campus Connect Verification Code is: ${code}`,
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `Email send failed: ${t}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});