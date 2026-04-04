import { motion } from "framer-motion";
import { Scissors, Ruler, Truck, Wrench, PaintBucket, Shield } from "lucide-react";

const services = [
  { icon: Scissors, title: "Glass Cutting", desc: "Custom glass cutting to your exact measurements — clear, frosted, tinted, and mirrors." },
  { icon: Ruler, title: "Free Measurements", desc: "We'll help you measure and calculate the right quantities for your project." },
  { icon: Truck, title: "Countrywide Delivery", desc: "We deliver hardware and building materials across Kenya via trusted couriers." },
  { icon: Wrench, title: "Installation Advice", desc: "Get expert guidance on how to install locks, roofing, plumbing and more." },
  { icon: PaintBucket, title: "Paint Mixing", desc: "Custom paint colour matching and mixing to get the perfect shade." },
  { icon: Shield, title: "Bulk & Project Supply", desc: "Contractor pricing and bulk supply for construction projects of any size." },
];

export default function Services() {
  return (
    <div className="pb-16 lg:pb-0">
      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-caps text-primary mb-4">OUR SERVICES</p>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-6">HOW WE HELP YOU BUILD</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Beyond selling hardware, we offer a range of services to make your building project easier and more efficient.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {services.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card p-6 glass-card-hover">
                <s.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-heading font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
