import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, targetType: string, targetId: string) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email ?? "unknown";
    await supabase.from("activity_log").insert({
      admin_email: email,
      action,
      target_type: targetType,
      target_id: targetId,
    });
  } catch (e) {
    console.error("Activity log error", e);
  }
}
