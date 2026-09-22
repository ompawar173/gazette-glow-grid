import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  MAX_ADMIN_CREATED_USERS,
  PREDEFINED_COMPANIES,
  PREDEFINED_DESIGNATIONS,
  PREDEFINED_ROLES,
} from "./team.constants";

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().max(120).optional().default(""),
  company_name: z.enum(PREDEFINED_COMPANIES).default("CIO Media World"),
  designation: z.enum(PREDEFINED_DESIGNATIONS),
  role: z.enum(PREDEFINED_ROLES),
  permissions: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().max(120).optional(),
  company_name: z.enum(PREDEFINED_COMPANIES).optional(),
  designation: z.enum(PREDEFINED_DESIGNATIONS).optional(),
  role: z.enum(PREDEFINED_ROLES).optional(),
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

    const members = (data ?? []).map((m: any) => {
      const profile = m.permissions?._profile || {};
      return {
        ...m,
        company_name: m.company_name ?? profile.company_name ?? "CIO Media World",
        designation: m.designation ?? profile.designation ?? "Content Writer",
        role: m.role ?? profile.role ?? "Writer",
      };
    });

    return { members };
  });

export const createTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Enforce MAX_ADMIN_CREATED_USERS limit server-side BEFORE creating auth user
    const { count, error: countErr } = await supabaseAdmin
      .from("team_members")
      .select("id", { count: "exact", head: true });
    if (countErr) throw new Error("Could not verify team user count");
    if ((count ?? 0) >= MAX_ADMIN_CREATED_USERS) {
      throw new Error(`You have reached the maximum limit of ${MAX_ADMIN_CREATED_USERS} users.`);
    }

    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        company_name: data.company_name,
        designation: data.designation,
        role: data.role,
      },
    });
    if (authErr || !created.user) throw new Error(authErr?.message ?? "Could not create user");

    const mergedPermissions = {
      ...data.permissions,
      _profile: {
        company_name: data.company_name,
        designation: data.designation,
        role: data.role,
      },
    };

    let insErr: any = null;
    try {
      const res = await supabaseAdmin.from("team_members").insert({
        user_id: created.user.id,
        email: data.email,
        full_name: data.full_name || null,
        company_name: data.company_name,
        designation: data.designation,
        role: data.role,
        permissions: mergedPermissions,
        active: true,
        created_by: context.userId,
      });
      insErr = res.error;
    } catch (e) {
      insErr = e;
    }

    // Fallback if PostgREST schema cache doesn't have company_name/designation/role columns yet
    if (insErr && (insErr.message?.includes("schema cache") || insErr.message?.includes("column"))) {
      const resFallback = await supabaseAdmin.from("team_members").insert({
        user_id: created.user.id,
        email: data.email,
        full_name: data.full_name || null,
        permissions: mergedPermissions,
        active: true,
        created_by: context.userId,
      });
      insErr = resFallback.error;
    }

    if (insErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(insErr.message);
    }

    const appRole = data.role === "Admin" ? "admin" : "editor";
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: appRole });
    return { ok: true, id: created.user.id };
  });

export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existingTm } = await supabaseAdmin.from("team_members").select("permissions").eq("id", data.id).maybeSingle();
    const currentPerms = (existingTm?.permissions as any) || {};

    const updatedProfile = {
      ...(currentPerms._profile || {}),
      ...(data.company_name ? { company_name: data.company_name } : {}),
      ...(data.designation ? { designation: data.designation } : {}),
      ...(data.role ? { role: data.role } : {}),
    };

    const patch: any = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.company_name !== undefined) patch.company_name = data.company_name;
    if (data.designation !== undefined) patch.designation = data.designation;
    if (data.role !== undefined) patch.role = data.role;
    if (data.active !== undefined) patch.active = data.active;

    patch.permissions = {
      ...(data.permissions || currentPerms),
      _profile: updatedProfile,
    };

    let { error } = await supabaseAdmin.from("team_members").update(patch).eq("id", data.id);
    if (error && (error.message?.includes("schema cache") || error.message?.includes("column"))) {
      delete patch.company_name;
      delete patch.designation;
      delete patch.role;
      const fallbackRes = await supabaseAdmin.from("team_members").update(patch).eq("id", data.id);
      error = fallbackRes.error;
    }
    if (error) throw new Error(error.message);

    if (data.role !== undefined) {
      const { data: tm } = await supabaseAdmin
        .from("team_members")
        .select("user_id")
        .eq("id", data.id)
        .single();
      if (tm?.user_id) {
        const appRole = data.role === "Admin" ? "admin" : "editor";
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: tm.user_id, role: appRole }, { onConflict: "user_id,role" });
      }
    }

    return { ok: true };
  });

export const resetTeamPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => pwSchema.parse(d))
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
  .validator((d: unknown) => idSchema.parse(d))
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
