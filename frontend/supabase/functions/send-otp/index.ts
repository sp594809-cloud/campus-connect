import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TEXTBEE_API_KEY = Deno.env.get("TEXTBEE_API_KEY") ?? "";
const TEXTBEE_DEVICE_ID = Deno.env.get("TEXTBEE_DEVICE_ID") ?? "";
const PEPPER = Deno.env.get("OTP_SIGNING_SECRET") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PHONE_RE = /^[6-9]\d{9}$/;
const CODE_TTL_MIN = 5;
const MAX_SENDS_PER_WINDOW = 3;
const WINDOW_MIN = 15;

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { phone } = await req.json().catch(() => ({ phone: "" }));
    const phoneNumber = String(phone ?? "").replace(/\D/g, "");
    if (!PHONE_RE.test(phoneNumber)) {
      return json({ error: "Enter a valid 10-digit Indian mobile number." }, 400);
    }

    if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
      return json({ error: "SMS service is not configured. Contact your college administration." }, 503);
    }

    // Must exist in the college roster
    const { data: student, error: sErr } = await admin
      .from("student1")
      .select("full_name, enrollment_id, phone_number")
      .eq("phone_number", phoneNumber)
      .maybeSingle();
    if (sErr) return json({ error: "Lookup failed. Please try again." }, 500);
    if (!student) return json({ error: "This number is not in our college records." }, 404);

    // Rate limit
    const windowStart = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const { count } = await admin
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("phone_number", phoneNumber)
      .gte("created_at", windowStart);
    if ((count ?? 0) >= MAX_SENDS_PER_WINDOW) {
      return json({ error: "Too many code requests. Please wait a few minutes and try again." }, 429);
    }

    // Invalidate previous unconsumed codes
    await admin
      .from("otp_codes")
      .update({ consumed: true })
      .eq("phone_number", phoneNumber)
      .eq("consumed", false);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256Hex(`${phoneNumber}:${code}:${PEPPER}`);
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();

    const { error: insErr } = await admin.from("otp_codes").insert({
      phone_number: phoneNumber,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (insErr) return json({ error: "Could not create verification code." }, 500);

    const message = `${code} is your Campus Connect verification code. It expires in ${CODE_TTL_MIN} minutes. Do not share it with anyone.`;

    const smsRes = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: { "x-api-key": TEXTBEE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: [`+91${phoneNumber}`], message }),
      },
    );

    if (!smsRes.ok) {
      const detail = await smsRes.text().catch(() => "");
      console.error("TextBee send failed", smsRes.status, detail.slice(0, 300));
      await admin
        .from("otp_codes")
        .update({ consumed: true })
        .eq("phone_number", phoneNumber)
        .eq("code_hash", codeHash);
      return json({ error: "Couldn't send the SMS right now. Please try again in a moment." }, 502);
    }

    return json({ success: true, expires_in: CODE_TTL_MIN * 60 });
  } catch (e) {
    console.error("send-otp error", e instanceof Error ? e.message : e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
