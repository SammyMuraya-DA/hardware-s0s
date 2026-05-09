import { useState } from 'react';
import { z } from 'zod';
import { Check, ChevronLeft, ChevronRight, Truck, CreditCard, ClipboardCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatKSh } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { REGIONS, getRegion, formatDeliveryAddress, RegionKey } from '@/lib/locations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import mpesaPaybill from '@/assets/mpesa-paybill.jpg';

const WHATSAPP_NUMBER = '254727607125'; // SOS Hardware WhatsApp

const deliverySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?254|0)?[17]\d{8}$/, 'Enter a valid Kenyan phone number'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(300),
  city: z.string().trim().min(2, 'City is required').max(80),
  region: z.enum(['Nyeri', 'Nairobi', 'Other']),
  subArea: z.string().trim().max(80).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
}).superRefine((val, ctx) => {
  // For Nyeri/Nairobi, sub-area is required
  if ((val.region === 'Nyeri' || val.region === 'Nairobi') && !val.subArea) {
    ctx.addIssue({ code: 'custom', path: ['subArea'], message: 'Please select your area' });
  }
});

type DeliveryForm = z.infer<typeof deliverySchema>;
type Errors = Partial<Record<keyof DeliveryForm, string>>;

const STEPS = [
  { id: 1, label: 'Delivery', icon: Truck },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: ClipboardCheck },
] as const;

const Checkout = () => {
  const { items, subtotal, vat, total, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryForm>({
    name: '', phone: '', address: '', city: 'Nyeri', region: 'Nyeri', subArea: '', notes: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [payment, setPayment] = useState<'mpesa' | 'cod'>('mpesa');
  const [mpesaRef, setMpesaRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  if (items.length === 0 && !orderId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">No items in cart</h2>
        <Link to="/products"><Button>Shop Now</Button></Link>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <span className="text-5xl mb-4 block">🎉</span>
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p className="text-muted-foreground mb-1">Your order ID is:</p>
        <p className="font-mono text-lg font-bold text-primary mb-6">{orderId}</p>
        <p className="text-sm text-muted-foreground mb-6">We'll contact you on {delivery.phone} to confirm delivery details.</p>
        <Link to="/products"><Button>Continue Shopping</Button></Link>
      </div>
    );
  }

  const validateDelivery = (): boolean => {
    const result = deliverySchema.safeParse(delivery);
    if (!result.success) {
      const fieldErrors: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof DeliveryForm;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validatePayment = (): boolean => {
    if (payment === 'mpesa' && mpesaRef.trim().length > 0 && mpesaRef.trim().length < 6) {
      toast.error('M-Pesa reference looks too short');
      return false;
    }
    return true;
  };

  const next = () => {
    if (step === 1 && !validateDelivery()) return;
    if (step === 2 && !validatePayment()) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const buildWhatsAppMessage = (id: string) => {
    const region = getRegion(delivery.region);
    const lines = [
      `*New Order — ${id}*`,
      ``,
      `*Customer:* ${delivery.name}`,
      `*Phone:* ${delivery.phone}`,
      `*Region:* ${delivery.region}${delivery.subArea ? ` — ${delivery.subArea}` : ''}`,
      `*Address:* ${delivery.address}, ${delivery.city}`,
      `*Dispatch:* ${region.noteHint}`,
      delivery.notes ? `*Customer notes:* ${delivery.notes}` : '',
      ``,
      `*Items:*`,
      ...items.map((i) => `• ${i.product.name} × ${i.quantity} — ${formatKSh(i.product.price * i.quantity)}`),
      ``,
      `Subtotal: ${formatKSh(subtotal)}`,
      `VAT (16%): ${formatKSh(vat)}`,
      `*Total: ${formatKSh(total)}*`,
      ``,
      `*Payment:* ${payment === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}`,
      payment === 'mpesa' && mpesaRef ? `*M-Pesa Ref:* ${mpesaRef}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  };

  const placeOrder = async () => {
    if (!validateDelivery() || !validatePayment()) {
      setStep(1);
      return;
    }
    setLoading(true);
    const id = 'SOS-' + Date.now().toString(36).toUpperCase();
    const itemsJson = items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
    }));

    const { error } = await supabase.rpc('place_order', {
      _order_id: id,
      _customer_name: delivery.name,
      _phone: delivery.phone,
      _delivery_address: formatDeliveryAddress({
        region: delivery.region,
        subArea: delivery.subArea ?? '',
        city: delivery.city,
        street: delivery.address,
        notes: delivery.notes,
      }),
      _payment_method: payment,
      _items: itemsJson,
      _total: total,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to place order. Please try again.');
      return;
    }

    // Open WhatsApp with order summary
    const msg = encodeURIComponent(buildWhatsAppMessage(id));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');

    // Fire-and-forget: notify customer + admin via Twilio WhatsApp
    supabase.functions
      .invoke('send-order-notification', { body: { order_id: id, event: 'created' } })
      .catch((e) => console.warn('Notification dispatch failed:', e));

    setOrderId(id);
    clearCart();
    toast.success('Order placed successfully!');
  };

  const update = <K extends keyof DeliveryForm>(key: K, value: DeliveryForm[K]) => {
    setDelivery((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleRegionChange = (regionKey: RegionKey) => {
    const r = getRegion(regionKey);
    setDelivery((d) => ({
      ...d,
      region: regionKey,
      subArea: '',
      // Auto-fill city from region (preserve existing if Other)
      city: regionKey === 'Other' ? (d.region === 'Other' ? d.city : '') : r.city,
    }));
    setErrors((e) => ({ ...e, region: undefined, subArea: undefined, city: undefined }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 max-w-2xl mx-auto">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-primary border-primary text-primary-foreground'
                      : active
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border rounded-lg p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Delivery Details</h3>
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={delivery.name} onChange={(e) => update('name', e.target.value)} maxLength={100} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="07XX XXX XXX" value={delivery.phone} onChange={(e) => update('phone', e.target.value)} maxLength={15} />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Delivery Region *</Label>
                  <Select value={delivery.region} onValueChange={(v) => handleRegionChange(v as RegionKey)}>
                    <SelectTrigger id="region"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {delivery.region !== 'Other' ? (
                  <div>
                    <Label htmlFor="subArea">Area / Estate *</Label>
                    <Select value={delivery.subArea ?? ''} onValueChange={(v) => update('subArea', v)}>
                      <SelectTrigger id="subArea"><SelectValue placeholder="Choose your area" /></SelectTrigger>
                      <SelectContent>
                        {getRegion(delivery.region).subAreas.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subArea && <p className="text-xs text-destructive mt-1">{errors.subArea}</p>}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="city">Town / City *</Label>
                    <Input id="city" placeholder="e.g. Nakuru" value={delivery.city} onChange={(e) => update('city', e.target.value)} maxLength={80} />
                    {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                  </div>
                )}
              </div>

              <div className="bg-secondary/50 border border-border/50 rounded-md p-3 text-xs text-muted-foreground">
                ℹ️ {getRegion(delivery.region).noteHint}
              </div>

              <div>
                <Label htmlFor="address">Street Address / Building / Landmark *</Label>
                <Input id="address" placeholder="Street, building, landmark" value={delivery.address} onChange={(e) => update('address', e.target.value)} maxLength={300} />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label htmlFor="notes">Order Notes (optional)</Label>
                <Input id="notes" placeholder="Delivery instructions" value={delivery.notes ?? ''} onChange={(e) => update('notes', e.target.value)} maxLength={500} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Payment Method</h3>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as 'mpesa' | 'cod')} className="space-y-2">
                {[
                  { value: 'mpesa', label: 'M-Pesa', desc: 'Pay via Safaricom M-Pesa' },
                  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                ].map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                      payment === pm.value ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <RadioGroupItem value={pm.value} id={pm.value} />
                    <div>
                      <p className="font-medium text-sm">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {payment === 'mpesa' && (
                <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium">M-Pesa Payment Instructions:</p>
                  <div className="rounded-md overflow-hidden border bg-card">
                    <img
                      src={mpesaPaybill}
                      alt="SOS Hardware M-Pesa Paybill details"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <a
                    href="/SOS_PAYBILL.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-primary underline"
                  >
                    Download Paybill PDF
                  </a>
                  <p className="text-muted-foreground">Amount to pay: <strong>{formatKSh(total)}</strong></p>
                  <div>
                    <Label htmlFor="mref">M-Pesa Reference (optional)</Label>
                    <Input id="mref" value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} maxLength={20} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-bold text-lg">Review Your Order</h3>
              <div className="rounded-lg border p-4 space-y-1 text-sm">
                <p className="font-semibold">Deliver to</p>
                <p>{delivery.name} — {delivery.phone}</p>
                <p className="text-muted-foreground">
                  [{delivery.region}]{delivery.subArea ? ` ${delivery.subArea} • ` : ' '}{delivery.address}, {delivery.city}
                </p>
                <p className="text-xs text-muted-foreground">{getRegion(delivery.region).noteHint}</p>
                {delivery.notes && <p className="text-muted-foreground italic">Notes: {delivery.notes}</p>}
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-semibold mb-1">Payment</p>
                <p>{payment === 'mpesa' ? `M-Pesa${mpesaRef ? ` — Ref: ${mpesaRef}` : ''}` : 'Cash on Delivery'}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-semibold text-sm mb-2">Items</p>
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">{formatKSh(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Placing the order will save it to our system and open WhatsApp so we can confirm delivery with you.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button variant="outline" onClick={back} disabled={step === 1 || loading}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={next}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={placeOrder} disabled={loading}>
                {loading ? 'Placing Order...' : `Place Order — ${formatKSh(total)}`}
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 h-fit">
          <h3 className="font-bold text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="truncate pr-2">{item.product.name} × {item.quantity}</span>
                <span className="font-medium whitespace-nowrap">{formatKSh(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKSh(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT (16%)</span><span>{formatKSh(vat)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{formatKSh(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
