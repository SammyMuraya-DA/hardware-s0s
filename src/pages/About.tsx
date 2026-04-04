import { Shield, Wrench, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="pb-16 lg:pb-0">
      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-caps text-primary mb-4">ABOUT US</p>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-6">SOS HARDWARE & GLASSMART</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Founded by Steve Wanga, SOS Hardware & Glassmart has been Nyeri's trusted partner for quality building materials for over 20 years. From door locks to roofing sheets, glass to plumbing — we stock everything you need to build better.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 mt-16">
            {[
              { icon: Shield, title: "Trusted Quality", desc: "Every product sourced from verified manufacturers and tested for durability." },
              { icon: Wrench, title: "Expert Advice", desc: "Steve and the team bring 20+ years of hands-on construction knowledge." },
              { icon: Users, title: "Community First", desc: "Serving Nyeri contractors, builders, and homeowners with pride." },
              { icon: Award, title: "Fair Pricing", desc: "Competitive prices with genuine products — no shortcuts, no fakes." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-heading font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
