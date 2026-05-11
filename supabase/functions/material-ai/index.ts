import { admin, aiChat, aiEmbed, assertUnlocked, authedUser, corsHeaders, ensureMaterialContent, json } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authedUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const user = auth.user;

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const supa = admin();

    if (action === "search") {
      // Semantic search across the user's purchased library (and own listings).
      const query = String(body?.query ?? "").trim();
      if (!query) return json({ results: [] });
      const embedding = await aiEmbed(query);
      const { data: purchased } = await supa
        .from("material_purchases").select("material_id").eq("buyer_id", user.id);
      const { data: owned } = await supa
        .from("study_materials").select("id").eq("seller_id", user.id);
      const allIds = [
        ...new Set([
          ...(purchased ?? []).map((r) => r.material_id),
          ...(owned ?? []).map((r) => r.id),
        ]),
      ];
      if (allIds.length === 0) return json({ results: [] });
      const { data: candidates } = await supa
        .from("study_material_secrets")
        .select("material_id, embedding")
        .in("material_id", allIds)
        .not("embedding", "is", null);
      const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
      const norm = (a: number[]) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
      const qn = norm(embedding) || 1;
      const scored = (candidates ?? []).map((c) => {
        const e = (c.embedding as unknown as number[]) ?? [];
        const sim = e.length ? dot(e, embedding) / ((norm(e) || 1) * qn) : 0;
        return { material_id: c.material_id, similarity: sim };
      }).sort((a, b) => b.similarity - a.similarity).slice(0, 12);
      return json({ results: scored });
    }

    // All other actions need a material_id + access check.
    const materialId = String(body?.material_id ?? "");
    if (!materialId) return json({ error: "material_id required" }, 400);
    const access = await assertUnlocked(supa, materialId, user.id);
    if ("error" in access) return json({ error: access.error }, access.status);

    if (action === "prepare") {
      const text = await ensureMaterialContent(supa, materialId);
      return json({ ok: true, chars: text.length });
    }

    if (action === "quiz") {
      const text = await ensureMaterialContent(supa, materialId);
      if (!text || text.trim().length < 50) {
        return json({ error: "Not enough content to build a quiz" }, 422);
      }
      const raw = await aiChat({
        system:
          "You generate study quizzes. Reply ONLY with valid JSON matching: " +
          `{"questions":[{"q":string,"choices":[string,string,string,string],"answer":number,"explanation":string}]}. ` +
          "Make exactly 10 questions. answer is the 0-based index of the correct choice. Use clear, concise wording.",
        messages: [
          { role: "user", content: `Source notes:\n\n${text.slice(0, 18000)}` },
        ],
        responseFormat: "json_object",
      });
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { return json({ error: "Bad AI output", raw }, 502); }
      return json(parsed);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[material-ai]", e);
    return json({ error: (e as Error).message }, 500);
  }
});