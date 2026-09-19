import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const DEFAULT_SUPABASE_URL = "https://zffpikiuavrwaszpxufl.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_nMsv4aiv3mEUBQeQXqZxZQ_iUXO_ePQ";

/** Read-only Supabase client for public (anon) data used during SSR. */
export function publicDb() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || DEFAULT_SUPABASE_URL;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || DEFAULT_PUBLISHABLE_KEY;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

