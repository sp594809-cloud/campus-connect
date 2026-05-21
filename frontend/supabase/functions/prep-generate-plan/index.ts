import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callLovableAi, safeJson, corsHeaders } from "../_shared/lovableAi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { trackId, level, paceDays } = await req.json();
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: corsHeaders });

    // Load track + topics
    const { data: track } = await supabase.from("learning_tracks").select("*").eq("id", trackId).single();
    if (!track) throw new Error("Track not found");
    const { data: topics } = await supabase
      .from("track_topics")
      .select("*")
      .eq("track_id", trackId)
      .eq("level", level)
      .order("order_index");
    const topicList = topics ?? [];
    if (topicList.length === 0) throw new Error("No topics for this level");

    // Create plan
    const { data: plan, error: planErr } = await supabase
      .from("user_learning_plans")
      .insert({ user_id: user.id, track_id: trackId, level, pace_days: paceDays })
      .select()
      .single();
    if (planErr) throw planErr;

    // Cycle topics across days
    const tasksPayload = [];
    for (let day = 1; day <= paceDays; day++) {
      tasksPayload.push(topicList[(day - 1) % topicList.length]);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const aiPrompt = `For the track "${track.name}" at level "${level}", generate one daily task per topic. For each, output a short conceptual question, a short hands-on exercise prompt (code or written), and a one-line expected answer summary.
Topics in order:
${tasksPayload.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}
Return strict JSON: { "tasks": [ { "question": "...", "exercise_prompt": "...", "expected_answer_summary": "...", "difficulty": "easy|medium|hard" } ] }
Exactly ${tasksPayload.length} items, in order.`;
    const aiText = await callLovableAi({
      apiKey,
      system: "You design daily learning tasks for students. Output STRICT JSON only.",
      user: aiPrompt,
      json: true,
    });
    const parsed = safeJson<{ tasks: Array<{ question: string; exercise_prompt: string; expected_answer_summary: string; difficulty: string }> }>(aiText);
    const tasks = parsed?.tasks ?? [];

    const rows = tasksPayload.map((t, i) => {
      const ai = tasks[i] ?? { question: `Explain: ${t.title}`, exercise_prompt: `Write a short example demonstrating ${t.title}.`, expected_answer_summary: "", difficulty: "medium" };
      const diff = ["easy", "medium", "hard"].includes(ai.difficulty) ? ai.difficulty : "medium";
      return {
        plan_id: plan.id,
        day_number: i + 1,
        topic_title: t.title,
        question: ai.question,
        exercise_prompt: ai.exercise_prompt,
        expected_answer_summary: ai.expected_answer_summary,
        source_url: t.source_url,
        difficulty: diff,
      };
    });
    const { error: taskErr } = await supabase.from("daily_tasks").insert(rows);
    if (taskErr) throw taskErr;

    return new Response(JSON.stringify({ planId: plan.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});