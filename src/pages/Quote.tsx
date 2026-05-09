import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const serviceTypes = [
  'Window Installation', 'Glass Cutting & Supply', 'Mirror Installation',
  'Shower Enclosures', 'Plumbing Services', 'General Hardware Supply', 'Site Assessment', 'Other',
];

const Quote = () => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', type: '', location: '', description: '', branch: "Ruring'u Branch",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('quote_requests').insert({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      type: form.type,
      location: form.location || null,
      description: form.description || null,
      branch: form.branch || null,
    });
    setLoading(false);
    if (error) {
      toast.error('Failed to submit quote request. Please try again.');
      return;
    }
    setSubmitted(true);
    toast.success('Quote request submitted successfully!');
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <span className="text-5xl mb-4 block">✅</span>
          <h2 className="text-2xl font-bold mb-2">Quote Request Received!</h2>
          <p className="text-muted-foreground mb-6">We'll review your request and get back to you within 24 hours via phone or WhatsApp.</p>
          <Button onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', email: '', type: '', location: '', description: '', branch: "Ruring'u Branch" }); }} variant="outline">Submit Another Quote</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Request a Quote</h1>
      <p className="text-muted-foreground mb-8">Fill in the details below and we'll get back to you with a competitive quote.</p>
      <div className="max-w-2xl mx-auto bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <Input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required className="w-full px-3 py-2 rounded-lg border bg-card text-sm">
            <option value="">Select Service/Product Type *</option>
            {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Input placeholder="Your Location / Delivery Area" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <Textarea placeholder="Describe your project or requirements *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={5} />
          <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-card text-sm">
            <option value="Ruring'u Branch">Ruring'u Branch (Nyeri)</option>
          </select>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? 'Submitting...' : 'Submit Quote Request'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Quote;
