import { supabase } from "@/integrations/supabase/client";
import { makeRef } from "@/lib/storage";

export async function uploadFile(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return makeRef(bucket, path);
}
