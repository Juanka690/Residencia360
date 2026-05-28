import "server-only";

import { createClient as createServerClient } from "@/utils/supabase/server";

import type { StorageBucket } from "./supabase-storage";

export async function createSignedUploadUrlServer(bucket: StorageBucket, path: string) {
  const client = await createServerClient();
  const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw new Error(`No se pudo crear URL de subida: ${error.message}`);
  return data;
}

export async function createSignedReadUrlServer(bucket: StorageBucket, path: string, ttlSeconds = 60 * 60) {
  const client = await createServerClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error) throw new Error(`No se pudo firmar URL de lectura: ${error.message}`);
  return data.signedUrl;
}
