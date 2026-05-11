import { admin, aiChatStream, assertUnlocked, authedUser, corsHeaders, ensureMaterialContent, json } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authedUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const user = auth.user;

    const body = await req.json().catch(() => ({}));
    const materialId = String(body?.material_id ?? "");
    const question = String(body?.question ?? "").trim();
    const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
    if (!materialId || !question) return json({ error: "material_id and question required" }, 400);

    const supa = admin();
    const access = await assertUnlocked(supa, materialId, user.id);
    if ("error" in access) return json({ error: access.error }, access.status);

    const text = await ensureMaterialContent(supa, materialId);
    if (!text || text.trim().length < 20) {
      return json({ error: "No readable content for this material yet" }, 422);
    }

    const upstream = await aiChatStream({
      system:
        "You are a study assistant. Answer the student's question USING ONLY the provided notes. " +
        "If the answer isn't in the notes, say so honestly. Be concise and use bullet points where helpful. " +
        "Notes:\n\n" + text.slice(0, 18000),
      messages: [
        ...history.map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "assistant" as const : "user" as const,
          content: String(m.content ?? ""),
        })),
        { role: "user", content: question },
      ],
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      return json({ error: `AI ${upstream.status}: ${txt}` }, 502);
    }

    // Re-stream as plain text deltas (parse OpenAI-style SSE).
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const ln of lines) {
              const t = ln.trim();
              if (!t.startsWith("data:")) continue;
              const payload = t.slice(5).trim();
              if (payload === "[DONE]") { controller.close(); return; }
              try {
                const j = JSON.parse(payload);
                const delta = j?.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch { /* ignore */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[chat-with-pdf]", e);
    return json({ error: (e as Error).message }, 500);
  }
});