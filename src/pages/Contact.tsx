import { motion } from "framer-motion";
import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";

export default function Contact() {
  return (
    <div className="pb-16 lg:pb-0">
      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-caps text-primary mb-4">GET IN TOUCH</p>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-6">CONTACT US</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Visit our shop in Nyeri Town or reach out via WhatsApp for quotes, advice, or orders.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 mt-16">
            {[
              { icon: MapPin, title: "Visit Our Shop", desc: "Nyeri Town, Kirinyaga Road\nOpposite the main market", link: null },
              { icon: Phone, title: "Call Us", desc: "0707 209 775", link: "tel:+254707209775" },
              { icon: MessageCircle, title: "WhatsApp Steve", desc: "Chat with Steve directly for quotes and advice", link: "https://wa.me/254707209775?text=Hi Steve, I need help with..." },
              { icon: Clock, title: "Opening Hours", desc: "Mon–Sat: 7:30 AM – 6:00 PM\nSun: 9:00 AM – 1:00 PM", link: null },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener" className="glass-card glass-card-hover p-6 block">
                    <item.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-heading font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{item.desc}</p>
                  </a>
                ) : (
                  <div className="glass-card p-6">
                    <item.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-heading font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{item.desc}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
