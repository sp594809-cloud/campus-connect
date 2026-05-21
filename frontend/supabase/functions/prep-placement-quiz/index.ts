import { callLovableAi, safeJson, corsHeaders } from "../_shared/lovableAi.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { trackName, trackSlug, answers } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    if (Array.isArray(answers) && answers.length > 0) {
      // Score answers and return level
      const correct = answers.filter((a: { correct: boolean }) => a.correct).length;
      const total = answers.length;
      const pct = correct / total;
      const level = pct < 0.4 ? "beginner" : pct < 0.75 ? "intermediate" : "advanced";
      return new Response(
        JSON.stringify({ level, score: correct, total }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 5 MCQs
    const text = await callLovableAi({
      apiKey,
      system: "You generate placement test multiple choice questions. Output STRICT JSON only.",
      user: `Create 5 multiple-choice questions to assess a student's level in "${trackName}" (slug: ${trackSlug}).
Mix difficulties: 2 easy, 2 medium, 1 hard. Each question has 4 options and exactly one correct.
Return JSON:
{ "questions": [ { "q": "...", "options": ["a","b","c","d"], "correctIndex": 0, "difficulty": "easy|medium|hard" } ] }`,
      json: true,
    });
    const parsed = safeJson<{ questions: unknown[] }>(text);
    if (!parsed?.questions) throw new Error("Bad AI output");
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});