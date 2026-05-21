import { supabase } from "@/integrations/supabase/client";

export type AttachmentKind = "image" | "pdf";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const detectKind = (file: File): AttachmentKind | null => {
  if (ALLOWED_IMAGE_MIME.has(file.type)) return "image";
  if (file.type === "application/pdf") return "pdf";
  return null;
};

export async function uploadAttachment(
  file: File,
  bucket: "chat-media" | "post-media",
  userId: string,
): Promise<{ url: string; type: AttachmentKind } | null> {
  const kind = detectKind(file);
  if (!kind) throw new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF, or PDF.");
  if (file.size <= 0) throw new Error("File is empty");
  if (file.size > MAX_BYTES) throw new Error("File too large (max 10MB)");
  const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "pdf" ? "pdf" : "bin");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, type: kind };
}