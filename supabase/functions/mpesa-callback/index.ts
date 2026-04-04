import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    // Find payment by checkout request ID
    const { data: payment, error: findErr } = await supabase
      .from("payments")
      .select("*")
      .eq("mpesa_checkout_request_id", CheckoutRequestID)
      .single();

    if (findErr || !payment) {
      console.error("Payment not found for CheckoutRequestID:", CheckoutRequestID);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ResultCode === 0) {
      // Success - extract metadata
      const metadata: Record<string, any> = {};
      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          metadata[item.Name] = item.Value;
        }
      }

      // Update payment
      await supabase.from("payments").update({
        status: "completed",
        mpesa_receipt_number: metadata.MpesaReceiptNumber || null,
        mpesa_transaction_date: metadata.TransactionDate
          ? new Date(String(metadata.TransactionDate).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6")).toISOString()
          : null,
        result_code: ResultCode,
        result_desc: ResultDesc,
        raw_callback: body,
      }).eq("id", payment.id);

      // Update order status
      await supabase.from("orders").update({ status: "confirmed" }).eq("id", payment.order_id);

      // Decrement stock for each order item
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", payment.order_id);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.product_id) {
            await supabase.rpc("decrement_stock", {
              p_product_id: item.product_id,
              p_qty: item.quantity,
            });
          }
        }
      }
    } else {
      // Failed or cancelled
      const status = ResultCode === 1032 ? "cancelled" : "failed";
      await supabase.from("payments").update({
        status,
        result_code: ResultCode,
        result_desc: ResultDesc,
        raw_callback: body,
      }).eq("id", payment.id);

      // If cancelled by user, update order
      if (ResultCode === 1032) {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", payment.order_id);
      }
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Callback error:", err);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});