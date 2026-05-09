import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

const locations = [
  {
    name: 'Ruring\'u Branch',
    address: 'Nyeri, Parliament Road off Ruring\'u',
    phone: '+254 727607125',
    email: 'glassmartkenya@gmail.com',
    hours: 'Mon-Sat 8am-7pm',
  },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you shortly.');
      setForm({ name: '', phone: '', email: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-muted-foreground mb-10">We'd love to hear from you. Reach out via any channel below.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Location cards */}
        <div className="space-y-4">
          {locations.map(loc => (
            <div key={loc.name} className="bg-card rounded-lg border p-6 space-y-3">
              <h3 className="font-bold text-lg">{loc.name}</h3>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 text-primary shrink-0" /> {loc.address}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4 text-primary shrink-0" /> {loc.phone}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4 text-primary shrink-0" /> {loc.email}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4 text-primary shrink-0" /> {loc.hours}</p>
            </div>
          ))}

          <a
            href="https://wa.me/254727607125"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
          >
            <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
          </a>

          <div className="rounded-lg overflow-hidden border h-64">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7!2d36.9!3d-0.42!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMjUnMTIuMCJTIDM2wrA1NCcwMC4wIkU!5e0!3m2!1sen!2ske!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="SOS Hardware Location"
            />
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-bold text-lg mb-4">Send us a message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            <Input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Textarea placeholder="Your Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} />
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
