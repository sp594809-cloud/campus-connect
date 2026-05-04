import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits; // assume India
  if (raw.startsWith("+")) return "+" + digits;
  return "+" + digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number, mode } = await req.json();
    if (!phone_number || typeof phone_number !== "string") {
      return new Response(JSON.stringify({ error: "phone_number required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const phoneDigits = phone_number.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check student exists in college roster
    const { data: student, error: sErr } = await supabase
      .from("student1")
      .select("full_name, enrollment_id, phone_number")
      .eq("phone_number", phoneDigits)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!student) {
      return new Response(JSON.stringify({ error: "This number is not in our college records." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check registration state
    const { data: reg } = await supabase
      .from("registered_phones")
      .select("phone_number")
      .eq("phone_number", phoneDigits)
      .maybeSingle();

    if (mode === "register" && reg) {
      return new Response(JSON.stringify({ error: "This number is already registered. Please log in instead." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (mode === "login" && !reg) {
      return new Response(JSON.stringify({ error: "No account found for this number. Please register first." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase.from("otp_codes").select("id", { count: "exact", head: true }).eq("phone_number", phoneDigits).gte("created_at", since);
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insErr } = await supabase.from("otp_codes").insert({ phone_number: phoneDigits, code_hash, expires_at });
    if (insErr) throw insErr;

    // Send via Twilio
    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const from = Deno.env.get("TWILIO_FROM_NUMBER");
    if (!sid || !token || !from) {
      return new Response(JSON.stringify({ error: "SMS provider not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const to = normalizePhone(phoneDigits);
    const body = `Your Campus Connect OTP is ${code}. Valid for 5 minutes.`;
    const tw = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${sid}:${token}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!tw.ok) {
      const errText = await tw.text();
      console.error("Twilio error:", tw.status, errText);
      return new Response(JSON.stringify({ error: "Failed to send SMS. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, masked: to.slice(0, 3) + "******" + to.slice(-2) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-otp error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});