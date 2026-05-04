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
    const { phone_number, code, mode } = await req.json();
    if (!phone_number || !code) {
      return new Response(JSON.stringify({ error: "phone_number and code required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const phoneDigits = String(phone_number).replace(/\D/g, "");
    const codeStr = String(code).replace(/\D/g, "");
    if (codeStr.length !== 6) {
      return new Response(JSON.stringify({ error: "Enter the 6-digit code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row } = await supabase
      .from("otp_codes")
      .select("id, code_hash, expires_at, attempts, consumed")
      .eq("phone_number", phoneDigits)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) {
      return new Response(JSON.stringify({ error: "No code found. Request a new one." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (row.consumed) {
      return new Response(JSON.stringify({ error: "Code already used. Request a new one." }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Code expired. Request a new one." }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (row.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Request a new code." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hash = await sha256(codeStr);
    if (hash !== row.code_hash) {
      await supabase.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Incorrect code." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("otp_codes").update({ consumed: true }).eq("id", row.id);

    // Look up student
    const { data: student } = await supabase
      .from("student1")
      .select("full_name, enrollment_id, phone_number")
      .eq("phone_number", phoneDigits)
      .maybeSingle();
    if (!student) {
      return new Response(JSON.stringify({ error: "Student record not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If registering, mark phone as registered
    if (mode === "register") {
      const { error: regErr } = await supabase.from("registered_phones").insert({
        phone_number: phoneDigits,
        full_name: student.full_name,
        enrollment_id: student.enrollment_id,
      });
      if (regErr && !String(regErr.message).includes("duplicate")) {
        return new Response(JSON.stringify({ error: regErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ ok: true, student }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("verify-otp error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});