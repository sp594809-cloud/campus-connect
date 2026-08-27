import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PEPPER = Deno.env.get("OTP_SIGNING_SECRET") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PHONE_RE = /^[6-9]\d{9}$/;
const MAX_ATTEMPTS = 5;

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const enrKey = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const phoneNumber = String(body.phone ?? "").replace(/\D/g, "");
    const code = String(body.code ?? "").replace(/\D/g, "");

    if (!PHONE_RE.test(phoneNumber)) return json({ error: "Invalid phone number." }, 400);
    if (code.length !== 6) return json({ error: "Enter the 6-digit code." }, 400);

    const { data: row } = await admin
      .from("otp_codes")
      .select("id, code_hash, expires_at, attempts, consumed")
      .eq("phone_number", phoneNumber)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return json({ error: "No active code. Please request a new one." }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return json({ error: "This code has expired. Request a new one." }, 400);
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await admin.from("otp_codes").update({ consumed: true }).eq("id", row.id);
      return json({ error: "Too many wrong attempts. Request a new code." }, 429);
    }

    const hash = await sha256Hex(`${phoneNumber}:${code}:${PEPPER}`);
    if (hash !== row.code_hash) {
      await admin.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      const left = MAX_ATTEMPTS - (row.attempts + 1);
      return json({ error: `Incorrect code. ${left > 0 ? `${left} attempt(s) left.` : "Request a new code."}` }, 400);
    }

    await admin.from("otp_codes").update({ consumed: true }).eq("id", row.id);

    // Roster record drives the deterministic account
    const { data: student } = await admin
      .from("student1")
      .select("full_name, enrollment_id")
      .eq("phone_number", phoneNumber)
      .maybeSingle();
    if (!student) return json({ error: "This number is not in our college records." }, 404);

    const appId = `${slug(student.full_name)}-${enrKey(student.enrollment_id)}`;
    const email = `${enrKey(student.enrollment_id)}@mail.ljku.edu.in`;
    const password = `cc-${appId}-v1`;

    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let signIn = await anon.auth.signInWithPassword({ email, password });

    if (signIn.error || !signIn.data.session) {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: student.full_name, phone: phoneNumber },
      });
      if (createErr && !/already/i.test(createErr.message)) {
        console.error("createUser failed", createErr.message);
        return json({ error: "Could not create your account. Please try again." }, 500);
      }
      signIn = await anon.auth.signInWithPassword({ email, password });
    }

    if (signIn.error || !signIn.data.session) {
      console.error("sign-in failed", signIn.error?.message);
      return json({ error: "Verified, but sign-in failed. Please try again." }, 500);
    }

    // Record the registration server-side
    await admin.from("registered_phones").upsert(
      {
        phone_number: phoneNumber,
        full_name: student.full_name,
        enrollment_id: student.enrollment_id,
      },
      { onConflict: "phone_number" },
    );
    await admin.from("profiles").update({ name: student.full_name }).eq("id", signIn.data.user!.id);

    return json({
      success: true,
      access_token: signIn.data.session.access_token,
      refresh_token: signIn.data.session.refresh_token,
      full_name: student.full_name,
      enrollment_id: student.enrollment_id,
    });
  } catch (e) {
    console.error("verify-otp error", e instanceof Error ? e.message : e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
