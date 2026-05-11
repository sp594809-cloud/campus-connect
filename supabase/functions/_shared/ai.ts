// Shared helpers for Lovable AI Gateway + access checks.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function getEnv() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  return { SUPABASE_URL, SERVICE_KEY, ANON_KEY, LOVABLE_API_KEY };
}

export async function authedUser(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Missing auth", status: 401 as const };
  const { SUPABASE_URL, ANON_KEY } = getEnv();
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return { error: "Invalid session", status: 401 as const };
  return { user };
}

export function admin(): SupabaseClient {
  const { SUPABASE_URL, SERVICE_KEY } = getEnv();
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

/** Returns null if the user can read this material, or an error response */
export async function assertUnlocked(supa: SupabaseClient, materialId: string, userId: string) {
  const { data: mat } = await supa
    .from("study_materials")
    .select("id, seller_id")
    .eq("id", materialId)
    .maybeSingle();
  if (!mat) return { error: "Material not found", status: 404 as const };
  if (mat.seller_id === userId) return { ok: true, mat };
  const { data: p } = await supa
    .from("material_purchases")
    .select("id")
    .eq("material_id", materialId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (!p) return { error: "You must purchase this material first", status: 403 as const };
  return { ok: true, mat };
}

/** Lovable AI Gateway chat completion (non-streaming). */
export async function aiChat(opts: {
  model?: string;
  system?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  responseFormat?: "json_object";
}) {
  const { LOVABLE_API_KEY } = getEnv();
  const messages = opts.system
    ? [{ role: "system" as const, content: opts.system }, ...opts.messages]
    : opts.messages;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages,
      ...(opts.responseFormat ? { response_format: { type: opts.responseFormat } } : {}),
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${txt}`);
  }
  const j = await resp.json();
  return j.choices?.[0]?.message?.content as string ?? "";
}

/** Streaming chat — returns the raw upstream Response so the caller can pipe it. */
export async function aiChatStream(opts: {
  model?: string;
  system?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}) {
  const { LOVABLE_API_KEY } = getEnv();
  const messages = opts.system
    ? [{ role: "system" as const, content: opts.system }, ...opts.messages]
    : opts.messages;
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      stream: true,
      messages,
    }),
  });
}

/** Embeddings via Lovable AI Gateway (OpenAI-compatible). 1536 dims. */
export async function aiEmbed(text: string): Promise<number[]> {
  const { LOVABLE_API_KEY } = getEnv();
  const clipped = text.slice(0, 24000);
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: clipped,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Embeddings ${resp.status}: ${txt}`);
  }
  const j = await resp.json();
  return j.data?.[0]?.embedding as number[];
}

/** Download a PDF from the private bucket and extract its text. */
export async function extractPdfText(supa: SupabaseClient, pdfPath: string): Promise<string> {
  const { data, error } = await supa.storage.from("study-materials").download(pdfPath);
  if (error || !data) throw new Error(error?.message ?? "PDF download failed");
  const buf = new Uint8Array(await data.arrayBuffer());
  const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
  const pdf = await getDocumentProxy(buf);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : (text as string);
}

/** Loads cached content_text + embedding for a material; extracts/embeds on first use. */
export async function ensureMaterialContent(supa: SupabaseClient, materialId: string) {
  const { data: secret } = await supa
    .from("study_material_secrets")
    .select("pdf_path, meeting_link, content_text, embedding")
    .eq("material_id", materialId)
    .maybeSingle();
  if (!secret) throw new Error("No content");

  let content = secret.content_text ?? "";
  let needEmbed = !secret.embedding;

  if (!content) {
    if (secret.pdf_path) {
      content = await extractPdfText(supa, secret.pdf_path);
    } else {
      // Live masterclass — synthesise from meeting link description
      content = `Live masterclass session. ${secret.meeting_link ? "Meeting link available." : ""}`;
    }
    await supa
      .from("study_material_secrets")
      .update({ content_text: content })
      .eq("material_id", materialId);
    needEmbed = true;
  }

  if (needEmbed && content.trim().length > 0) {
    try {
      const embedding = await aiEmbed(content);
      await supa
        .from("study_material_secrets")
        .update({ embedding: embedding as unknown as string })
        .eq("material_id", materialId);
    } catch (e) {
      console.warn("[ensureMaterialContent] embed failed", (e as Error).message);
    }
  }

  return content;
}