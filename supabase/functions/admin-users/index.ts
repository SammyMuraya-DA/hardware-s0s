import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Missing auth token" }, 401);

  // Verify caller and admin role using their JWT
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  const callerId = userData.user.id;
  const { data: roleRow } = await userClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "Admin only" }, 403);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: { action: string; payload?: Record<string, unknown> } = { action: "" };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    switch (body.action) {
      case "list_users": {
        const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
        if (error) throw error;
        const ids = data.users.map((u) => u.id);
        const { data: roles } = await admin
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
        const roleMap = new Map<string, string[]>();
        (roles ?? []).forEach((r: { user_id: string; role: string }) => {
          const arr = roleMap.get(r.user_id) ?? [];
          arr.push(r.role);
          roleMap.set(r.user_id, arr);
        });
        return json({
          users: data.users.map((u) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            roles: roleMap.get(u.id) ?? [],
          })),
        });
      }

      case "create_user": {
        const { email, password, display_name } = (body.payload ?? {}) as {
          email: string; password: string; display_name?: string;
        };
        if (!email || !password) return json({ error: "Email and password required" }, 400);
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: display_name ?? email },
        });
        if (error) throw error;
        return json({ user: data.user });
      }

      case "update_self_email": {
        const { email } = (body.payload ?? {}) as { email: string };
        if (!email) return json({ error: "Email required" }, 400);
        const { data, error } = await admin.auth.admin.updateUserById(callerId, {
          email,
          email_confirm: true,
        });
        if (error) throw error;
        return json({ user: data.user });
      }

      case "update_self_password": {
        const { password } = (body.payload ?? {}) as { password: string };
        if (!password || password.length < 8) return json({ error: "Password must be at least 8 chars" }, 400);
        const { error } = await admin.auth.admin.updateUserById(callerId, { password });
        if (error) throw error;
        return json({ ok: true });
      }

      case "set_admin": {
        const { user_id, make_admin } = (body.payload ?? {}) as { user_id: string; make_admin: boolean };
        if (!user_id) return json({ error: "user_id required" }, 400);
        if (make_admin) {
          const { error } = await admin.from("user_roles").insert({ user_id, role: "admin" });
          if (error && !error.message.includes("duplicate")) throw error;
        } else {
          if (user_id === callerId) return json({ error: "Cannot remove your own admin role" }, 400);
          const { error } = await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin");
          if (error) throw error;
        }
        return json({ ok: true });
      }

      case "delete_user": {
        const { user_id } = (body.payload ?? {}) as { user_id: string };
        if (!user_id) return json({ error: "user_id required" }, 400);
        if (user_id === callerId) return json({ error: "Cannot delete your own account" }, 400);
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, 500);
  }
});