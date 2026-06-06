import { supabase } from "@/integrations/supabase/client";

export type ModerationDecision = "approved" | "rejected" | "shadow";

export interface ModerationResult {
  decision: ModerationDecision;
  reason: string | null;
  banned: boolean;
  matched_terms: string[];
  scores?: Record<string, number> | null;
}

export async function moderate(
  text: string,
  target_table: "posts" | "community_messages",
  community_id?: string | null,
): Promise<ModerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("moderate-content", {
      body: { text, target_table, community_id: community_id ?? null },
    });
    if (error || !data) {
      // Fail-open to 'shadow' so nothing is published silently while broken.
      return { decision: "shadow", reason: "Moderation unavailable; awaiting review.", banned: false, matched_terms: [] };
    }
    return data as ModerationResult;
  } catch {
    return { decision: "shadow", reason: "Moderation unavailable; awaiting review.", banned: false, matched_terms: [] };
  }
}