import { supabase } from "@/integrations/supabase/client";

// Buckets are private in this workspace, so stored files are referenced as
// `storage://<bucket>/<path>` and resolved to short-lived signed URLs on read.
// Legacy rows may hold `.../storage/v1/object/public/<bucket>/<path>` URLs —
// those are parsed and signed too.

const cache = new Map<string, { url: string; expires: number }>();
const TTL_SECONDS = 60 * 60 * 6;

export function makeRef(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

export function parseRef(value: string): { bucket: string; path: string } | null {
  if (!value) return null;
  if (value.startsWith("storage://")) {
    const rest = value.slice("storage://".length);
    const i = rest.indexOf("/");
    if (i < 1) return null;
    return { bucket: rest.slice(0, i), path: rest.slice(i + 1) };
  }
  const m = value.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (m) return { bucket: m[1], path: decodeURIComponent(m[2]) };
  return null;
}

export async function resolveStorageUrl(value: string | null | undefined): Promise<string> {
  if (!value) return "";
  const ref = parseRef(value);
  if (!ref) return value; // external URL (e.g. Unsplash) — use as-is

  const key = `${ref.bucket}/${ref.path}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.url;

  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, TTL_SECONDS);
  if (error || !data?.signedUrl) return "";
  cache.set(key, { url: data.signedUrl, expires: Date.now() + (TTL_SECONDS - 300) * 1000 });
  return data.signedUrl;
}
