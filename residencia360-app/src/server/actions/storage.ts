"use server";

import type { StorageBucket } from "@/lib/supabase-storage";
import { createSignedReadUrlServer } from "@/lib/supabase-storage-server";

export async function getSignedReadUrlAction(
  bucket: StorageBucket,
  path: string,
  ttlSeconds = 60 * 60,
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  try {
    const url = await createSignedReadUrlServer(bucket, path, ttlSeconds);
    return { success: true, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo generar el enlace.";
    return { success: false, message };
  }
}
