import { createClient as createBrowserClient } from "@/utils/supabase/client";

export type StorageBucket = "pqrs-attachments" | "announcement-attachments" | "payment-supports";

export const BUCKETS = {
  PQRS: (process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PQRS ?? "pqrs-attachments") as StorageBucket,
  ANNOUNCEMENTS: (process.env.NEXT_PUBLIC_SUPABASE_BUCKET_ANNOUNCEMENTS ??
    "announcement-attachments") as StorageBucket,
  PAYMENTS: (process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PAYMENTS ?? "payment-supports") as StorageBucket,
} as const;

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function buildObjectPath(prefix: string, fileName: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${stamp}-${safe}`;
}

export async function uploadFromBrowser(
  bucket: StorageBucket,
  path: string,
  file: File,
): Promise<{ path: string; publicUrl: string | null }> {
  const client = createBrowserClient();
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(`Falla al subir archivo: ${error.message}`);
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data?.publicUrl ?? null };
}

export function validateFile(file: { size: number; type: string }): { ok: true } | { ok: false; reason: string } {
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: `El archivo supera el tamano maximo (${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB).` };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, reason: `Tipo de archivo no permitido (${file.type || "desconocido"}).` };
  }
  return { ok: true };
}
