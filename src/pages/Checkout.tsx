import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, MapPin, Truck, Phone, Loader2, CheckCircle2, CreditCard, Clock, MessageCircle, QrCode } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(100),
  phone: z.string().regex(/^0[17]\d{8}$/, "Enter a valid Safaricom number (07XX or 01XX)"),
  
});

const addressSchema = z.object({
  street: z.string().min(2, "Area is required").max(200),
  town: z.string().min(2, "Town is required").max(100),
  county: z.string().min(2, "County is required").max(100),
  landmark: z.string().max(200).optional().or(z.literal("")),
});

type ContactData = z.infer<typeof contactSchema>;
type AddressData = z.infer<typeof addressSchema>;

const DELIVERY_FEE_NYERI = 200;
const DELIVERY_FEE_UPCOUNTRY = 500;
const STEVE_WHATSAPP = "254707209775";

const steps = [
  { num: 1, label: "Details" },
  { num: 2, label: "Delivery" },
  { num: 3, label: "Pay" },
];

function buildWhatsAppMessage(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number; unit?: string }[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryType: string;
  addressData: AddressData | null;
  isPaid: boolean;
  mpesaReceipt?: string | null;
}) {
  const { orderNumber, customerName, customerPhone, items, subtotal, deliveryFee, totalAmount, deliveryType, addressData, isPaid, mpesaReceipt } = params;
  
  let msg = `🛒 *NEW ORDER — ${orderNumber}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += isPaid ? `✅ *PAID VIA M-PESA*\n` : `⏳ *PAY LATER — NOT PAID*\n`;
  if (mpesaReceipt) msg += `📝 Receipt: ${mpesaReceipt}\n`;
  msg += `\n👤 *Customer:* ${customerName}\n`;
  msg += `📞 *Phone:* ${customerPhone}\n`;
  msg += `🚚 *Delivery:* ${deliveryType === "pickup" ? "Pickup in Nyeri" : "Delivery"}\n`;
  if (addressData && deliveryType === "delivery") {
    msg += `📍 *Address:* ${addressData.street}, ${addressData.town}, ${addressData.county}`;
    if (addressData.landmark) msg += ` (${addressData.landmark})`;
    msg += `\n`;
  }
  msg += `\n📦 *Items:*\n`;
  items.forEach(item => {
    msg += `  • ${item.name} x${item.quantity}${item.unit ? ` (${item.unit})` : ""} — ${formatPrice(item.price * item.quantity)}\n`;
  });
  msg += `\n💰 Subtotal: ${formatPrice(subtotal)}\n`;
  if (deliveryFee > 0) msg += `🚛 Delivery: ${formatPrice(deliveryFee)}\n`;
  msg += `*💵 TOTAL: ${formatPrice(totalAmount)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━`;
  return msg;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, total, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "pay_later" | null>(null);
  const [paymentState, setPaymentState] = useState<"idle" | "pushing" | "waiting" | "success" | "failed">("idle");
  const [countdown, setCountdown] = useState(120);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);

  const subtotal = total();
  const deliveryFee = deliveryType === "pickup" ? 0 : (addressData?.county?.toLowerCase() === "nyeri" ? DELIVERY_FEE_NYERI : DELIVERY_FEE_UPCOUNTRY);
  const totalAmount = subtotal + deliveryFee;

  const contactForm = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  const addressForm = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { street: "", town: "", county: "", landmark: "" },
  });

  if (items.length === 0 && paymentState !== "success") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-2 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">Your cart is empty</p>
          <Button onClick={() => navigate("/products")} variant="default" size="lg">Browse Products</Button>
        </motion.div>
      </div>
    );
  }

  const handleContactSubmit = (data: ContactData) => {
    setContactData(data);
    setStep(2);
  };

  const handleDeliveryNext = () => {
    if (deliveryType === "delivery") {
      addressForm.handleSubmit((data) => {
        setAddressData(data);
        setStep(3);
      })();
    } else {
      setAddressData(null);
      setStep(3);
    }
  };

  const sendToWhatsApp = (orderNum: string, isPaid: boolean, receipt?: string | null) => {
    if (!contactData) return;
    const msg = buildWhatsAppMessage({
      orderNumber: orderNum,
      customerName: contactData.fullName,
      customerPhone: contactData.phone,
      items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: Number(i.product.price), unit: i.product.unit || undefined })),
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryType,
      addressData,
      isPaid,
      mpesaReceipt: receipt,
    });
    const url = `https://wa.me/${STEVE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handlePayLater = async () => {
    if (!contactData) return;
    setPaymentState("pushing");
    try {
      const orderNum = `SOS-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        order_number: orderNum,
        customer_id: user?.id || null,
        customer_name: contactData.fullName,
        customer_phone: contactData.phone,
        delivery_type: deliveryType,
        delivery_address: addressData ? { street: addressData.street, town: addressData.town, county: addressData.county, landmark: addressData.landmark || "" } : null,
        delivery_fee: deliveryFee,
        subtotal,
        total_amount: totalAmount,
        status: "pending",
        is_pay_later: true,
      }).select().single();

      if (orderErr) throw new Error(orderErr.message);

      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        product_sku: i.product.sku,
        product_image: i.product.images?.[0] || null,
        unit: i.product.unit,
        quantity: i.quantity,
        unit_price: Number(i.product.price),
        total_price: Number(i.product.price) * i.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw new Error(itemsErr.message);

      setOrderId(order.id);
      setOrderNumber(orderNum);
      setPaymentMethod("pay_later");
      setPaymentState("success");

      // Send WhatsApp
      sendToWhatsApp(orderNum, false);
      clearCart();
      toast({ title: "Order placed!", description: "Your order has been recorded. Pay when you pick up or on delivery." });
    } catch (err: any) {
      console.error("Order error:", err);
      setPaymentState("failed");
      toast({ title: "Order Error", description: err.message || "Could not place order", variant: "destructive" });
    }
  };

  const handleMpesaPayment = async () => {
    if (!contactData) return;
    setPaymentState("pushing");
    setPaymentMethod("mpesa");

    try {
      const orderNum = `SOS-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase.functions.invoke("initiate-mpesa-payment", {
        body: {
          phone: contactData.phone,
          amount: Math.ceil(totalAmount),
          customerName: contactData.fullName,
          deliveryType,
          deliveryAddress: addressData ? { street: addressData.street, town: addressData.town, county: addressData.county, landmark: addressData.landmark || "" } : null,
          deliveryFee,
          subtotal,
          items: items.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            productSku: i.product.sku,
            productImage: i.product.images?.[0] || null,
            unit: i.product.unit,
            quantity: i.quantity,
            unitPrice: i.product.price,
            totalPrice: i.product.price * i.quantity,
          })),
          orderNumber: orderNum,
          customerId: user?.id || null,
        },
      });

      if (error) throw error;

      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
      setPaymentState("waiting");

      let timeLeft = 120;
      const timer = setInterval(() => {
        timeLeft--;
        setCountdown(timeLeft);
        if (timeLeft <= 0) { clearInterval(timer); setPaymentState("failed"); }
      }, 1000);

      const pollInterval = setInterval(async () => {
        const { data: payment } = await supabase
          .from("payments")
          .select("status, mpesa_receipt_number")
          .eq("order_id", data.orderId)
          .single();

        if (payment?.status === "completed") {
          clearInterval(timer);
          clearInterval(pollInterval);
          setMpesaReceipt(payment.mpesa_receipt_number);
          setPaymentState("success");
          // Send WhatsApp with paid status
          sendToWhatsApp(data.orderNumber, true, payment.mpesa_receipt_number);
          clearCart();
        } else if (payment?.status === "failed" || payment?.status === "cancelled") {
          clearInterval(timer);
          clearInterval(pollInterval);
          setPaymentState("failed");
        }
      }, 5000);

      setTimeout(() => clearInterval(pollInterval), 150000);
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentState("failed");
      toast({ title: "Payment Error", description: err.message || "Could not initiate payment", variant: "destructive" });
    }
  };

  const maskedPhone = contactData ? contactData.phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 *** ***") : "";

  // SUCCESS STATE
  if (paymentState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md mx-auto px-4 space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
          </motion.div>
          <h1 className="font-display text-4xl md:text-5xl text-primary">ORDER CONFIRMED!</h1>
          <div className="glass-card p-6 text-left space-y-3 font-mono text-sm border border-border/50">
            <div className="flex justify-between"><span className="text-muted-foreground">Order:</span><span className="text-foreground font-bold">#{orderNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total:</span><span className="text-primary font-bold">{formatPrice(totalAmount)}</span></div>
            {mpesaReceipt && <div className="flex justify-between"><span className="text-muted-foreground">Receipt:</span><span className="text-foreground">{mpesaReceipt}</span></div>}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className={paymentMethod === "pay_later" ? "text-warning font-bold" : "text-green-400 font-bold"}>
                {paymentMethod === "pay_later" ? "⏳ Pay Later" : "✅ Paid via M-Pesa"}
              </span>
            </div>
            {deliveryType === "delivery" && addressData && (
              <div className="mt-4 p-4 rounded-2xl bg-surface-2 border border-border/60 text-sm space-y-1">
                <p className="text-muted-foreground font-medium">Delivery Address</p>
                <p>{addressData.street}</p>
                <p>{addressData.town}, {addressData.county}</p>
                {addressData.landmark && <p className="text-xs text-muted-foreground">Landmark: {addressData.landmark}</p>}
              </div>
            )}
          </div>
          {/* QR Code for Pay Later */}
          {paymentMethod === "pay_later" && (
            <div className="bg-surface-2 rounded-xl p-5 space-y-3 border border-primary/20">
              <div className="flex items-center justify-center gap-2 text-primary font-heading font-bold text-sm">
                <QrCode className="w-4 h-4" /> Scan to Pay via M-Pesa
              </div>
              <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                <QRCodeSVG value={`PAY TO TILL: 123456\nOrder: ${orderNumber}\nAmount: KES ${totalAmount}\nPhone: 0707209775`} size={150} level="H" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Till Number</p>
                <p className="font-mono text-xl font-bold text-primary">TILL: 123456</p>
              </div>
              <p className="text-xs text-muted-foreground">Scan this QR code or use the Till Number to pay via M-Pesa</p>
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            {paymentMethod === "pay_later"
              ? "💰 Pay using the QR code above or Till Number"
              : deliveryType === "pickup"
                ? "🏪 Ready for pickup at our Nyeri shop within 2 hours"
                : "🚚 We'll dispatch within 1-2 business days"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => sendToWhatsApp(orderNumber!, paymentMethod === "mpesa", mpesaReceipt)}
              variant="outline"
              className="gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <MessageCircle className="w-4 h-4" /> Send to WhatsApp
            </Button>
            <Button onClick={() => navigate("/products")} variant="default">Continue Shopping</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // WAITING STATE
  if (paymentState === "waiting") {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto px-4 space-y-6">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Phone className="w-20 h-20 text-primary mx-auto" />
          </motion.div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">📱 CHECK YOUR PHONE</h2>
          <p className="text-muted-foreground">A payment prompt has been sent to <span className="text-foreground font-mono">{maskedPhone}</span></p>
          <div className="glass-card p-5 text-left space-y-3 text-sm border border-border/50">
            <p className="font-heading font-semibold text-foreground">On your phone:</p>
            <p className="text-muted-foreground">1️⃣ Open the M-Pesa prompt</p>
            <p className="text-muted-foreground">2️⃣ Enter your M-Pesa PIN</p>
            <p className="text-muted-foreground">3️⃣ Confirm {formatPrice(totalAmount)} to SOS Hardware</p>
          </div>
          <div className="flex justify-center gap-2">
            {[0, 0.3, 0.6].map((d, i) => (
              <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: d }} className="w-3 h-3 rounded-full bg-primary" />
            ))}
          </div>
          <p className={`font-mono text-sm ${countdown < 60 ? "text-destructive" : "text-muted-foreground"}`}>
            ⏱ Prompt expires in: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <button onClick={() => { setPaymentState("idle"); setStep(3); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel & Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 lg:pb-8">
      <div className="container max-w-3xl">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Back to cart"}
        </button>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <motion.div
                initial={false}
                animate={{ scale: step === s.num ? 1.05 : 1 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-heading font-medium transition-all ${step >= s.num ? "bg-gradient-to-r from-primary to-amber-light text-primary-foreground shadow-md shadow-primary/20" : "bg-surface-2 text-muted-foreground"}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step > s.num ? "bg-primary-foreground/20" : step === s.num ? "bg-primary-foreground/20" : ""}`}>
                  {step > s.num ? "✓" : s.num}
                </span>
                <span className="hidden sm:block">{s.label}</span>
              </motion.div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 transition-colors ${step > s.num ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* STEP 1 */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="w-4 h-4 text-primary" /></div>
                    Contact Details
                  </h2>
                  <form onSubmit={contactForm.handleSubmit(handleContactSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" placeholder="John Kamau" {...contactForm.register("fullName")} className="mt-1" />
                      {contactForm.formState.errors.fullName && <p className="text-xs text-destructive mt-1">{contactForm.formState.errors.fullName.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number * (M-Pesa)</Label>
                      <Input id="phone" placeholder="0712345678" {...contactForm.register("phone")} className="mt-1" />
                      {contactForm.formState.errors.phone && <p className="text-xs text-destructive mt-1">{contactForm.formState.errors.phone.message}</p>}
                    </div>
                    <Button type="submit" className="w-full mt-4 py-6 text-base">
                      Continue to Delivery <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Truck className="w-4 h-4 text-primary" /></div>
                    Delivery Method
                  </h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDeliveryType("pickup")} className={`glass-card p-5 text-left transition-all ${deliveryType === "pickup" ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "hover:border-primary/30"}`}>
                      <MapPin className={`w-6 h-6 mb-2 ${deliveryType === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="font-heading font-bold text-sm">PICK UP IN NYERI</h3>
                      <p className="text-xs text-primary font-bold mt-1">FREE</p>
                      <p className="text-xs text-muted-foreground mt-1">Ready in 1–2 hrs</p>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDeliveryType("delivery")} className={`glass-card p-5 text-left transition-all ${deliveryType === "delivery" ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "hover:border-primary/30"}`}>
                      <Truck className={`w-6 h-6 mb-2 ${deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="font-heading font-bold text-sm">DELIVER TO ME</h3>
                      <p className="text-xs text-primary font-bold mt-1">from KES 200</p>
                      <p className="text-xs text-muted-foreground mt-1">1–3 business days</p>
                    </motion.button>
                  </div>

                  {deliveryType === "delivery" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="street">Area *</Label>
                        <Input id="street" placeholder="Kirinyaga Road" {...addressForm.register("street")} className="mt-1" />
                        {addressForm.formState.errors.street && <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.street.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="town">Town *</Label>
                          <Input id="town" placeholder="Nyeri" {...addressForm.register("town")} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="county">County *</Label>
                          <Input id="county" placeholder="Nyeri" {...addressForm.register("county")} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="landmark">Landmark (optional)</Label>
                        <Input id="landmark" placeholder="Near the post office" {...addressForm.register("landmark")} className="mt-1" />
                      </div>
                    </motion.div>
                  )}

                  <Button onClick={handleDeliveryNext} className="w-full py-6 text-base">
                    Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-primary" /></div>
                    Choose Payment Method
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`glass-card p-5 text-left transition-all ${paymentMethod === "mpesa" ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "hover:border-primary/30"}`}
                    >
                      <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === "mpesa" ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="font-heading font-bold text-sm">PAY VIA M-PESA</h3>
                      <p className="text-xs text-primary font-bold mt-1">Instant</p>
                      <p className="text-xs text-muted-foreground mt-1">STK Push to your phone</p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod("pay_later")}
                      className={`glass-card p-5 text-left transition-all ${paymentMethod === "pay_later" ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "hover:border-primary/30"}`}
                    >
                      <Clock className={`w-6 h-6 mb-2 ${paymentMethod === "pay_later" ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="font-heading font-bold text-sm">PAY LATER</h3>
                      <p className="text-xs text-primary font-bold mt-1">On pickup/delivery</p>
                      <p className="text-xs text-muted-foreground mt-1">Pay when you receive</p>
                    </motion.button>
                  </div>

                  {paymentMethod === "mpesa" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5 border border-green-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">M</div>
                        <span className="font-heading font-bold text-foreground">Lipa Na M-Pesa</span>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Amount to Pay</label>
                        <div className="mt-1 glass-card p-3 border-primary/30">
                          <span className="font-mono-price text-primary text-xl">{formatPrice(totalAmount)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">M-Pesa Phone Number</label>
                        <div className="mt-1 glass-card p-3 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-foreground">{contactData?.phone}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Prompt will be sent to this number</p>
                      </div>
                      <Button
                        onClick={handleMpesaPayment}
                        disabled={paymentState === "pushing"}
                        className="w-full py-6 text-base font-heading font-bold bg-green-600 hover:bg-green-700"
                      >
                        {paymentState === "pushing" ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending prompt...</>
                        ) : (
                          <>🔒 PAY {formatPrice(totalAmount)} WITH M-PESA →</>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">🔐 Your payment is secured by Safaricom M-Pesa</p>
                    </motion.div>
                  )}

                  {paymentMethod === "pay_later" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5 border border-warning/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-8 h-8 text-warning" />
                        <span className="font-heading font-bold text-foreground">Pay Later</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your order will be placed and you can pay when you pick up from our Nyeri shop or upon delivery. The order total is:
                      </p>
                      <div className="glass-card p-3 border-primary/30">
                        <span className="font-mono-price text-primary text-xl">{formatPrice(totalAmount)}</span>
                      </div>
                      <Button
                        onClick={handlePayLater}
                        disabled={paymentState === "pushing"}
                        className="w-full py-6 text-base font-heading font-bold"
                      >
                        {paymentState === "pushing" ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Placing order...</>
                        ) : (
                          <>📋 PLACE ORDER — PAY LATER →</>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">💬 Steve will confirm your order via WhatsApp</p>
                    </motion.div>
                  )}

                  {paymentState === "failed" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 glass-card p-4 border-destructive/30">
                      <p className="text-sm text-destructive font-medium">Payment failed or was cancelled.</p>
                      <button onClick={() => setPaymentState("idle")} className="text-xs text-primary hover:underline mt-2">Try Again</button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary sidebar */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 sticky top-24 border border-border/50">
              <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Order Summary
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate pr-2">{item.quantity}× {item.product.name}</span>
                    <span className="font-mono text-foreground flex-shrink-0">{formatPrice(Number(item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {deliveryType === "delivery" && addressData && (
                <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
                  <p className="text-muted-foreground font-medium">Delivery Address</p>
                  <p className="font-medium">{addressData.street}</p>
                  <p>{addressData.town}, {addressData.county}</p>
                  {addressData.landmark && <p className="text-xs text-muted-foreground">Landmark: {addressData.landmark}</p>}
                </div>
              )}
              <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-mono">{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span></div>
                <div className="flex justify-between font-heading font-bold text-base pt-2 border-t border-border">
                  <span>Total</span><span className="font-mono-price text-primary">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
