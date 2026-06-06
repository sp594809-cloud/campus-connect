import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Decision = "approved" | "rejected" | "shadow";

interface Body {
  text: string;
  target_table: "posts" | "community_messages";
  community_id?: string | null;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function classifyWithAi(text: string) {
  if (!LOVABLE_API_KEY) return null;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a strict content safety classifier for a college community app. Score the user's message 0-1 on each axis. Reply ONLY with compact JSON: {\"hate\":n,\"harassment\":n,\"sexual\":n,\"violence\":n,\"self_harm\":n,\"spam\":n}. Hate covers slurs, dehumanizing language, or incitement based on race, religion, gender, caste, sexuality, disability, nationality.",
          },
          { role: "user", content: text.slice(0, 4000) },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(raw) as Record<string, number>;
  } catch (e) {
    console.error("[moderate] ai", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: u } = await userClient.auth.getUser();
    const author_id = u?.user?.id;
    if (!author_id) return json({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    const text = (body.text ?? "").toString();
    const target_table = body.target_table;
    if (!text.trim() || !["posts", "community_messages"].includes(target_table)) {
      return json({ error: "bad request" }, 400);
    }

    const lower = text.toLowerCase();
    const { data: terms } = await admin.from("banned_terms").select("term,category,severity");
    const matched: string[] = [];
    let zeroTolerance = false;
    for (const t of terms ?? []) {
      if (lower.includes(String(t.term).toLowerCase())) {
        matched.push(String(t.term));
        if (t.severity === "zero_tolerance") zeroTolerance = true;
      }
    }

    let decision: Decision = "approved";
    let reason: string | null = null;
    let scores: Record<string, number> | null = null;

    if (zeroTolerance) {
      decision = "rejected";
      reason = "Zero-tolerance violation (hate speech / threats).";
    } else {
      scores = await classifyWithAi(text);
      if (scores) {
        const max = Math.max(
          scores.hate ?? 0,
          scores.harassment ?? 0,
          scores.violence ?? 0,
          scores.sexual ?? 0,
        );
        if ((scores.hate ?? 0) >= 0.85 || (scores.harassment ?? 0) >= 0.9) {
          decision = "rejected";
          reason = "Content violates community guidelines.";
        } else if (max >= 0.6) {
          decision = "shadow";
          reason = "Flagged for moderator review.";
        }
      } else if (matched.length) {
        decision = "shadow";
        reason = "Flagged for moderator review.";
      }
    }

    // Log moderation event
    await admin.from("moderation_events").insert({
      target_table,
      target_id: "00000000-0000-0000-0000-000000000000",
      author_id,
      decision,
      model: scores ? "google/gemini-3.5-flash" : "rules-only",
      scores: scores ?? null,
      matched_terms: matched,
      reason,
    });

    let banned = false;
    if (zeroTolerance) {
      await admin.from("user_bans").insert({
        user_id: author_id,
        scope: "global",
        reason: reason ?? "Hate speech",
        evidence_ref: text.slice(0, 280),
        permanent: true,
      });
      // Remove memberships immediately
      await admin.from("community_members").delete().eq("user_id", author_id);
      banned = true;
    }

    return json({ decision, reason, scores, matched_terms: matched, banned });
  } catch (e) {
    console.error("[moderate] err", e);
    return json({ error: "server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}