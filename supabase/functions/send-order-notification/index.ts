import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Event = "created" | "status_changed";

interface Body {
  order_id: string;
  event: Event;
  new_status?: string;
}

const fmtKSh = (n: number) =>
  "KSh " + Number(n || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 });

function normalizeKePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+254")) return digits.slice(1); // 254...
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("+")) return digits.slice(1);
  return digits || null;
}

async function sendWhatsApp(
  toE164: string,
  body: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM"); // e.g. whatsapp:+14155238886
  if (!sid || !token || !from) {
    console.log("[notify] Twilio secrets not configured — skipping send to", toE164);
    return { ok: true, skipped: true };
  }
  const fromFmt = from.startsWith("whatsapp:") ? from : `whatsapp:+${from.replace(/^\+/, "")}`;
  const toFmt = `whatsapp:+${toE164}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = btoa(`${sid}:${token}`);
  const params = new URLSearchParams({ To: toFmt, From: fromFmt, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("[notify] Twilio error", res.status, txt);
    return { ok: false, error: `Twilio ${res.status}: ${txt}` };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.order_id || !body?.event) {
      return new Response(JSON.stringify({ error: "order_id and event are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["created", "status_changed"].includes(body.event)) {
      return new Response(JSON.stringify({ error: "invalid event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("order_id, customer_name, phone, total, status, items, delivery_address, payment_method")
      .eq("order_id", body.order_id)
      .maybeSingle();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerPhone = normalizeKePhone(order.phone ?? "");
    const adminPhone = normalizeKePhone(Deno.env.get("ADMIN_WHATSAPP_TO") ?? "");

    const itemsArr = Array.isArray(order.items) ? (order.items as Array<{ name: string; quantity: number }>) : [];
    const itemLines = itemsArr.map((i) => `• ${i.name} × ${i.quantity}`).join("\n");

    const status = body.event === "status_changed" ? (body.new_status ?? order.status) : order.status;

    let customerMsg = "";
    let adminMsg = "";

    if (body.event === "created") {
      customerMsg =
        `Hello ${order.customer_name},\n\n` +
        `Thank you for your order *${order.order_id}* with SOS Hardware & Glassmart.\n\n` +
        `${itemLines}\n\n` +
        `Total: *${fmtKSh(Number(order.total))}*\n` +
        `Payment: ${order.payment_method?.toUpperCase() ?? "—"}\n\n` +
        `We'll contact you shortly to confirm delivery. Need help? Reply to this message.`;
      adminMsg =
        `🛒 *New Order — ${order.order_id}*\n\n` +
        `${order.customer_name} (${order.phone})\n` +
        `${order.delivery_address ?? ""}\n\n` +
        `${itemLines}\n\n` +
        `Total: ${fmtKSh(Number(order.total))}\n` +
        `Payment: ${order.payment_method?.toUpperCase() ?? "—"}`;
    } else {
      customerMsg =
        `Hi ${order.customer_name}, your order *${order.order_id}* status is now: *${status}*.\n` +
        `Total: ${fmtKSh(Number(order.total))}.\nThank you for shopping with SOS Hardware & Glassmart.`;
      adminMsg =
        `📦 Order *${order.order_id}* — status changed to *${status}*\nCustomer: ${order.customer_name} (${order.phone})`;
    }

    const results: Record<string, unknown> = {};
    if (customerPhone) {
      results.customer = await sendWhatsApp(customerPhone, customerMsg);
    } else {
      results.customer = { ok: false, error: "Invalid customer phone" };
    }
    if (adminPhone) {
      results.admin = await sendWhatsApp(adminPhone, adminMsg);
    } else {
      results.admin = { ok: true, skipped: true, error: "ADMIN_WHATSAPP_TO not set" };
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify] error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});