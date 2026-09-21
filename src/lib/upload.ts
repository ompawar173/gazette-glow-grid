import { supabase } from "@/integrations/supabase/client";
import { makeRef } from "@/lib/storage";

export async function uploadFile(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const candidateBuckets = [bucket, "CEO MEDIA MAGZINE PUNE", "article-images", "magazine-covers"];
  let lastError: any = null;

  for (const b of candidateBuckets) {
    try {
      const { error } = await supabase.storage.from(b).upload(path, file, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from(b).getPublicUrl(path);
        return data?.publicUrl || makeRef(b, path);
      }
      lastError = error;
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("Upload failed");
}

