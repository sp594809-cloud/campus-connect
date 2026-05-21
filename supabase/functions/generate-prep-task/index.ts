// Edge function for grading daily preparation task submissions.
// Strict rubric-based evaluation with robust JSON parsing.

import { admin, authedUser, corsHeaders, json, getEnv, aiChat } from "../_shared/ai.ts";

// Strict rubric-based system prompt for grading
const GRADING_SYSTEM_PROMPT = `You are an expert CS tutor specializing in data structures, algorithms, databases, operating systems, and computer networks.
Your role is to grade student responses to daily preparation tasks with STRICT rubric adherence.

## CRITICAL REQUIREMENTS:

1. MULTI-COMPONENT CHECKLIST:
   - If a question has multiple parts (e.g., "Identify X AND explain Y AND describe Z"), you MUST check off EACH component explicitly.
   - Partial answers receive partial credit proportionally.
   - Missing ANY component = automatic deduction.

2. STRICT SCORING RUBRIC (0-100):
   - 90-100: Complete accuracy, all components addressed, clear explanations, no conceptual errors
   - 75-89: Mostly correct, minor omissions or minor conceptual gaps
   - 60-74: Partial understanding, significant components missing or confused
   - 40-59: Basic concepts demonstrated but major gaps
   - 0-39: Minimal or incorrect understanding

3. OUTPUT FORMAT - YOU MUST RESPOND WITH EXACTLY THIS JSON STRUCTURE:
\`\`\`json
{
  "score": number between 0 and 100,
  "feedback": "Detailed, supportive but critical technical analysis pointing out exactly what was done well.",
  "mistakes": ["Bullet points detailing missed definitions, partial omissions, or logical flaws."],
  "hint": "A clear, actionable next-step hint that guides them to fix their specific mistakes WITHOUT giving away the direct answer."
}
\`\`\`

4. MANDATORY FIELDS:
   - "score": Must be an integer 0-100
   - "feedback": 1-3 sentences, specific to what they wrote
   - "mistakes": Array of 0-N strings, each identifying a specific gap
   - "hint": 1 sentencemax, actionable, NOT a copy-paste answer

5. STRICT PROHIBITIONS:
   - NEVER give direct code solutions in hints
   - NEVER reveal complete answers in feedback
   - NEVER be vague (“good job” alone is insufficient)
   - NEVER miss any component if multiple were asked`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  try {
    const auth = await authedUser(req);
    if ('error' in auth) return json({ error: auth.error }, auth.status);
    const user = auth.user;

    const body = await req.json().catch(() => ({}));
    const { submission, question, rubric, context } = body;

    // Validate inputs
    if (!submission || typeof submission !== 'string') {
      return json({ error: 'submission is required' }, 400);
    }
    if (!question || typeof question !== 'string') {
      return json({ error: 'question is required' }, 400);
    }

    const supa = admin();

    // Call AI for grading
    let aiResponse: string;
    try {
      const messages = [
        { 
          role: 'user' as const, 
          content: `GRADE THIS SUBMISSION.

QUESTION: ${question}

${rubric ? `RUBRIC:\n${rubric}` : ''}
${context ? `CONTEXT:\n${context}` : ''}

STUDENT'S ANSWER:
${submission}

Respond with the exact JSON structure specified in your system prompt.`
        }
      ];

      aiResponse = await aiChat({
        system: GRADING_SYSTEM_PROMPT,
        messages,
        responseFormat: 'json_object',
      });
    } catch (aiError) {
      console.error('AI grading error:', aiError);
      return json({ error: 'Failed to grade submission' }, 502);
    }

    // Robust JSON parsing with markdown stripping
    let parsed: Record<string, unknown>;
    try {
      // Step 1: Try direct parse
      parsed = JSON.parse(aiResponse);
    } catch {
      // Step 2: Strip markdown formatting
      const cleaned = aiResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/gm, '')
        .trim();
      
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Step 3: Extract first { ... } block
        const match = aiResponse.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            // Step 4: Fallback - return error with raw for debugging
            return json({ 
              error: 'Invalid AI response format',
              raw: aiResponse.slice(0, 500),
              debug: 'JSON parse failed after all cleanup attempts'
            }, 502);
          }
        } else {
          return json({ 
            error: 'Invalid AI response format',
            raw: aiResponse.slice(0, 500)
          }, 502);
        }
      }
    }

    // VALIDATE REQUIRED FIELDS
    const scoreValue = typeof parsed.score === 'number' 
      ? Math.max(0, Math.min(100, Math.round(parsed.score))) 
      : 50;
    const feedbackText = typeof parsed.feedback === 'string' ? parsed.feedback : '';
    const mistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes.filter((m): m is string => typeof m === 'string') : [];
    const hint = typeof parsed.hint === 'string' ? parsed.hint : '';

    // Ensure all required fields exist
    if (!feedbackText || !mistakes || !hint) {
      console.warn('AI response missing required fields:', { feedback: !!feedbackText, mistakes: !!mistakes, hint: !!hint });
    }

    // Return validated result
    return json({
      score: scoreValue,
      feedback: feedbackText || 'Grading completed.',
      mistakes: mistakes || [],
      hint: hint || 'Review the feedback and try again.',
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});