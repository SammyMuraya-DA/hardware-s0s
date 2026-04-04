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

    const { action, email, target_user_id, promoter_id } = await req.json();

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

      // Find user by email using admin API
      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;

      const targetUser = users.find(u => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "No user found with that email" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", targetUser.id)
        .eq("role", "admin")
        .single();

      if (existingRole) {
        return new Response(JSON.stringify({ error: "User is already an admin" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update role from customer to admin
      const { error: deleteErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUser.id)
        .eq("role", "customer");

      const { error: insertErr } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUser.id, role: "admin" });

      if (insertErr) throw insertErr;

      // Auto-confirm their email if not confirmed
      if (!targetUser.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
      }

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

      // Remove admin role, add customer
      await supabase.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "admin");
      await supabase.from("user_roles").insert({ user_id: target_user_id, role: "customer" });

      return new Response(JSON.stringify({ success: true, message: "Admin demoted to customer" }), {
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
