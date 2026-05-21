import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Missing auth" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    const materialId = String(body?.material_id ?? "");
    if (!materialId) return json({ error: "material_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify access: seller OR has a purchase row
    const { data: mat } = await admin
      .from("study_materials")
      .select("id, seller_id, type")
      .eq("id", materialId)
      .maybeSingle();
    if (!mat) return json({ error: "Not found" }, 404);

    let allowed = mat.seller_id === user.id;
    if (!allowed) {
      const { data: p } = await admin
        .from("material_purchases")
        .select("id")
        .eq("material_id", materialId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      allowed = !!p;
    }
    if (!allowed) return json({ error: "Locked" }, 403);

    const { data: secret } = await admin
      .from("study_material_secrets")
      .select("pdf_path, meeting_link")
      .eq("material_id", materialId)
      .maybeSingle();
    if (!secret) return json({ error: "No content" }, 404);

    let signedUrl: string | null = null;
    if (secret.pdf_path) {
      const { data: signed, error: sErr } = await admin
        .storage.from("study-materials")
        .createSignedUrl(secret.pdf_path, 60 * 60); // 1 hour
      if (sErr) return json({ error: sErr.message }, 500);
      signedUrl = signed?.signedUrl ?? null;
    }

    return json({ signed_url: signedUrl, meeting_link: secret.meeting_link ?? null });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}