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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number, mode } = await req.json();
    if (!phone_number || typeof phone_number !== "string") {
      return jsonResponse({ error: "phone_number required" }, 400);
    }
    const phoneDigits = phone_number.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return jsonResponse({ error: "Invalid phone number" }, 400);
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
      return jsonResponse({ error: "This number is not in our college records." }, 404);
    }

    // Check registration state
    const { data: reg } = await supabase
      .from("registered_phones")
      .select("phone_number")
      .eq("phone_number", phoneDigits)
      .maybeSingle();

    if (mode === "register" && reg) {
      return jsonResponse({ error: "This number is already registered. Please log in instead." }, 409);
    }
    if (mode === "login" && !reg) {
      return jsonResponse({ error: "No account found for this number. Please register first." }, 404);
    }

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase.from("otp_codes").select("id", { count: "exact", head: true }).eq("phone_number", phoneDigits).gte("created_at", since);
    if ((count ?? 0) >= 3) {
      return jsonResponse({ error: "Too many requests. Please wait a few minutes." }, 429);
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
      await supabase.from("otp_codes").delete().eq("phone_number", phoneDigits).eq("code_hash", code_hash);
      return jsonResponse({ ok: false, error: "SMS provider is not configured yet. Please update the Twilio settings." });
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

      await supabase.from("otp_codes").delete().eq("phone_number", phoneDigits).eq("code_hash", code_hash);

      let message = "SMS delivery is temporarily unavailable. Please try again later.";
      try {
        const twilioError = JSON.parse(errText);
        if (tw.status === 401 || twilioError?.code === 20003) {
          message = "SMS provider authentication failed. Please update the Twilio Account SID and Auth Token.";
        } else if (tw.status === 400 && twilioError?.message) {
          message = `SMS could not be sent: ${twilioError.message}`;
        }
      } catch {
        // Keep the safe generic message if Twilio returns non-JSON text.
      }

      return jsonResponse({ ok: false, error: message, provider_status: tw.status });
    }

    return jsonResponse({ ok: true, masked: to.slice(0, 3) + "******" + to.slice(-2) });
  } catch (err) {
    console.error("send-otp error", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});