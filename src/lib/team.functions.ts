import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().max(120).optional().default(""),
  permissions: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  permissions: z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
});

const idSchema = z.object({ id: z.string().uuid() });
const pwSchema = z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) });

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { members: data ?? [] };
  });

export const createTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("team_members")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) >= 10) throw new Error("Team member limit of 10 reached");

    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (authErr || !created.user) throw new Error(authErr?.message ?? "Could not create user");

    const { error: insErr } = await supabaseAdmin.from("team_members").insert({
      user_id: created.user.id,
      email: data.email,
      full_name: data.full_name || null,
      permissions: data.permissions,
      active: true,
      created_by: context.userId,
    });
    if (insErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(insErr.message);
    }

    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "editor" });
    return { ok: true, id: created.user.id };
  });

export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.full_name !== undefined) patch["full_name"] = data.full_name;
    if (data.active !== undefined) patch["active"] = data.active;
    if (data.permissions !== undefined) patch["permissions"] = data.permissions;
    const { error } = await supabaseAdmin.from("team_members").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetTeamPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => pwSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Team member not found");
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
      password: data.password,
    });
    if (authErr) throw new Error(authErr.message);
    return { ok: true };
  });

export const deleteTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    await supabaseAdmin.from("team_members").delete().eq("id", data.id);
    if (row?.user_id) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", row.user_id);
      await supabaseAdmin.auth.admin.deleteUser(row.user_id);
    }
    return { ok: true };
  });
