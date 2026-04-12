import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, email, target_user_id, promoter_id, request_id } = await req.json();

    if (!promoter_id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify promoter is admin
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: promoter_id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only admins can manage other admins" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "promote") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;

      const targetUser = users.find(u => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "No user found with that email" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingRole } = await supabase
        .from("user_roles").select("*")
        .eq("user_id", targetUser.id).eq("role", "admin").single();

      if (existingRole) {
        return new Response(JSON.stringify({ error: "User is already an admin" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("user_roles").delete().eq("user_id", targetUser.id).eq("role", "customer");
      const { error: insertErr } = await supabase.from("user_roles").insert({ user_id: targetUser.id, role: "admin" });
      if (insertErr) throw insertErr;

      // Auto-confirm email
      if (!targetUser.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
      }

      // Log action
      await supabase.rpc("log_admin_action", {
        p_action: "promote_to_admin", p_admin_id: promoter_id,
        p_target_user_id: targetUser.id, p_target_email: email,
      });

      return new Response(JSON.stringify({ success: true, message: `${email} promoted to admin` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "demote") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "Target user ID required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (target_user_id === promoter_id) {
        return new Response(JSON.stringify({ error: "Cannot demote yourself" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "admin");
      await supabase.from("user_roles").insert({ user_id: target_user_id, role: "customer" });

      await supabase.rpc("log_admin_action", {
        p_action: "demote_admin", p_admin_id: promoter_id,
        p_target_user_id: target_user_id,
      });

      return new Response(JSON.stringify({ success: true, message: "Admin demoted to customer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve_request") {
      if (!request_id || !target_user_id) {
        return new Response(JSON.stringify({ error: "Request ID and target user ID required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove customer role, add admin
      await supabase.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "customer");
      const { error: insertErr } = await supabase.from("user_roles").insert({ user_id: target_user_id, role: "admin" });
      if (insertErr) throw insertErr;

      // Auto-confirm email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const targetUser = users?.find(u => u.id === target_user_id);
      if (targetUser && !targetUser.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(target_user_id, { email_confirm: true });
      }

      // Update request status
      await supabase.from("admin_requests").update({ status: "approved", approved_by: promoter_id }).eq("id", request_id);

      await supabase.rpc("log_admin_action", {
        p_action: "approve_admin_request", p_admin_id: promoter_id,
        p_target_user_id: target_user_id,
      });

      return new Response(JSON.stringify({ success: true, message: "Admin request approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
