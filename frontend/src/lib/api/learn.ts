import { useMutation, useQuery } from "@tanstack/react-query";

const BASE = (import.meta.env.REACT_APP_BACKEND_URL as string | undefined) || "";

export type ExplainRequest = {
  subject: string;
  topic: string;
  question: string;
  options?: string[];
};

export type TheoryExplanation = {
  simple_explanation: string;
  analogy: string;
  mermaid_diagram: string;
  emoji_visual: string;
  cached: boolean;
};

export type CodingExplanation = {
  expected_output: string;
  logic_steps: string[];
  skeleton_code: string;
  example_walkthrough: string;
  cached: boolean;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LearnAPI ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export function explainTheory(req: ExplainRequest): Promise<TheoryExplanation> {
  return postJson<TheoryExplanation>("/api/learn/explain-theory", req);
}

export function explainCoding(req: ExplainRequest): Promise<CodingExplanation> {
  return postJson<CodingExplanation>("/api/learn/explain-coding", req);
}

export function useTheoryExplain(req: ExplainRequest, enabled = true) {
  return useQuery({
    queryKey: ["learn", "theory", req.subject, req.topic, req.question],
    queryFn: () => explainTheory(req),
    enabled: enabled && !!req.subject && !!req.topic && !!req.question,
    staleTime: 60 * 60 * 1000, // 1h client cache
    retry: 1,
  });
}

export function useCodingExplain(req: ExplainRequest, enabled = true) {
  return useQuery({
    queryKey: ["learn", "coding", req.subject, req.topic, req.question],
    queryFn: () => explainCoding(req),
    enabled: enabled && !!req.subject && !!req.topic && !!req.question,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}

// Real custom hooks (must start with `use`) — fixes the rules-of-hooks violation
// from the previous learnMutations.theory() / .coding() factory pattern.
export function useTheoryExplainMutation() {
  return useMutation({ mutationFn: explainTheory });
}

export function useCodingExplainMutation() {
  return useMutation({ mutationFn: explainCoding });
}
