import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callLovableAi, safeJson, corsHeaders } from "../_shared/lovableAi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { taskId, submission } = await req.json();
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: corsHeaders });

    const { data: task } = await supabase.from("daily_tasks").select("*").eq("id", taskId).single();
    if (!task) throw new Error("Task not found");

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const aiText = await callLovableAi({
      apiKey,
      system: "You are a friendly programming/CS tutor grading a student's submission. Output STRICT JSON only.",
      user: `Topic: ${task.topic_title}
Question: ${task.question}
Exercise: ${task.exercise_prompt}
Expected (summary): ${task.expected_answer_summary}
Student submission:
"""
${String(submission).slice(0, 4000)}
"""
Grade fairly. Return:
{ "score": 0-100 integer, "passed": boolean (true if score >= 70), "feedback": "1-3 sentences encouraging + specific", "mistakes": "main mistakes or empty", "hint": "one actionable hint" }`,
      json: true,
    });
    const parsed = safeJson<{ score: number; passed: boolean; feedback: string; mistakes: string; hint: string }>(aiText) ?? {
      score: 0, passed: false, feedback: "Could not grade automatically. Please retry.", mistakes: "", hint: "",
    };
    const score = Math.max(0, Math.min(100, Math.round(parsed.score ?? 0)));
    const passed = score >= 70;

    const { data: sub, error: subErr } = await supabase.from("task_submissions").insert({
      task_id: taskId,
      user_id: user.id,
      submission_text: String(submission).slice(0, 8000),
      ai_score: score,
      ai_feedback: parsed.feedback ?? "",
      ai_mistakes: parsed.mistakes ?? "",
      ai_hint: parsed.hint ?? "",
      passed,
    }).select().single();
    if (subErr) throw subErr;

    if (passed) {
      // Award karma based on difficulty
      const points = task.difficulty === "hard" ? 15 : task.difficulty === "easy" ? 5 : 10;
      // Use service role for karma insert (karma_events has no INSERT policy)
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("karma_events").insert({
        user_id: user.id,
        action: "aspire_engage",
        points,
        ref_id: taskId,
        note: `Prep: ${task.topic_title}`,
      });
      // Advance plan current_day if this task matches
      const { data: plan } = await supabase.from("user_learning_plans").select("*").eq("id", task.plan_id).single();
      if (plan && task.day_number >= plan.current_day) {
        const nextDay = task.day_number + 1;
        const done = nextDay > plan.pace_days;
        await supabase.from("user_learning_plans").update({
          current_day: done ? plan.pace_days : nextDay,
          status: done ? "completed" : "active",
          completed_at: done ? new Date().toISOString() : null,
        }).eq("id", plan.id);
      }
    }

    return new Response(JSON.stringify({ submission: sub, score, passed, feedback: parsed.feedback, mistakes: parsed.mistakes, hint: parsed.hint }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});