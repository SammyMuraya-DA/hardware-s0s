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

    const {
      phone, amount, customerName, customerEmail, deliveryType,
      deliveryAddress, deliveryFee, subtotal, items, orderNumber, customerId,
    } = await req.json();

    // Validate
    if (!phone || !amount || !customerName || !orderNumber || !items?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone: 07XX -> 2547XX
    let phone254 = phone.replace(/^0/, "254").replace(/^\+/, "");

    // Get M-Pesa credentials
    const consumerKey = Deno.env.get("DARAJA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("DARAJA_CONSUMER_SECRET");
    const passkey = Deno.env.get("DARAJA_PASSKEY");
    const tillNumber = Deno.env.get("DARAJA_TILL_NUMBER");
    const callbackUrl = Deno.env.get("DARAJA_CALLBACK_URL");
    const darajaEnv = Deno.env.get("DARAJA_ENV") || "sandbox";

    const baseUrl = darajaEnv === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    // Create order first
    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: phone,
      customer_email: customerEmail,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      delivery_fee: deliveryFee || 0,
      subtotal,
      total_amount: amount,
      status: "pending",
    }).select().single();

    if (orderErr) throw new Error(`Order creation failed: ${orderErr.message}`);

    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku,
      product_image: item.productImage,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) throw new Error(`Order items failed: ${itemsErr.message}`);

    // If M-Pesa credentials are not configured, create payment record as pending
    if (!consumerKey || !consumerSecret || !passkey || !tillNumber) {
      const { error: payErr } = await supabase.from("payments").insert({
        order_id: order.id,
        customer_phone: phone,
        amount,
        till_number: tillNumber || "PENDING",
        status: "pending",
      });

      return new Response(JSON.stringify({
        orderId: order.id,
        orderNumber,
        message: "Order created. M-Pesa not configured yet — payment pending.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get OAuth token
    const authStr = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authStr}` },
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) throw new Error("Failed to get M-Pesa OAuth token");

    // Generate timestamp (EAT = UTC+3)
    const now = new Date();
    const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const timestamp = eat.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = btoa(`${tillNumber}${passkey}${timestamp}`);

    // STK Push
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: tillNumber,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: Math.ceil(amount),
        PartyA: phone254,
        PartyB: tillNumber,
        PhoneNumber: phone254,
        CallBackURL: callbackUrl,
        AccountReference: orderNumber,
        TransactionDesc: `SOS Hardware ${orderNumber}`,
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== "0") {
      throw new Error(stkData.errorMessage || stkData.ResponseDescription || "STK Push failed");
    }

    // Create payment record
    const { error: payErr } = await supabase.from("payments").insert({
      order_id: order.id,
      customer_phone: phone,
      amount,
      till_number: tillNumber,
      mpesa_checkout_request_id: stkData.CheckoutRequestID,
      mpesa_merchant_request_id: stkData.MerchantRequestID,
      status: "pending",
    });

    if (payErr) console.error("Payment record error:", payErr);

    return new Response(JSON.stringify({
      orderId: order.id,
      orderNumber,
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});