import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PaintBucket, Ruler, Scissors, Shield, Truck, Wrench } from "lucide-react";

const services = [
  {
    icon: Scissors,
    title: "Glass cutting",
    desc: "Custom glass cutting to your measurements for windows, shelves, tabletops, mirrors, and other finishing needs.",
  },
  {
    icon: Ruler,
    title: "Measurement support",
    desc: "We help you estimate quantities and specifications so you can buy accurately and reduce waste on site.",
  },
  {
    icon: Truck,
    title: "Delivery coordination",
    desc: "Need materials moved beyond the shop? We support local pickup and delivery arrangements for wider coverage.",
  },
  {
    icon: Wrench,
    title: "Installation guidance",
    desc: "Get practical advice on selecting and fitting locks, plumbing items, roofing accessories, and general hardware.",
  },
  {
    icon: PaintBucket,
    title: "Paint matching",
    desc: "Choose colours with confidence through paint mixing support designed to help you achieve the finish you want.",
  },
  {
    icon: Shield,
    title: "Bulk project supply",
    desc: "For contractors and larger builds, we support repeat ordering and volume supply across key product categories.",
  },
];

const process = [
  "Share your project needs or measurements",
  "Get help selecting the right items",
  "Confirm pricing, pickup, or delivery",
  "Complete your order with confidence",
];

export default function Services() {
  return (
    <div className="pb-16 lg:pb-0">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-primary/10">
        <div className="container py-20 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-4xl"
          >
            <p className="label-caps mb-4 text-primary">Our services</p>
            <h1 className="font-display text-5xl text-foreground md:text-6xl">
              More than a hardware store.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              We support projects with practical services that save time, improve buying decisions,
              and help you move from planning to completion more smoothly.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-heading font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Request assistance
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center rounded-lg border border-border px-6 py-3 font-heading font-bold text-foreground transition hover:bg-surface/60"
              >
                Explore products
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <p className="label-caps mb-3 text-primary">How we help</p>
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Reliable support for everyday buyers and large projects alike.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
                className="glass-card glass-card-hover p-6"
              >
                <service.icon className="mb-4 h-9 w-9 text-primary" />
                <h3 className="font-heading text-lg font-bold text-foreground">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 md:py-10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-8 rounded-3xl border border-border bg-surface/40 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10"
          >
            <div>
              <p className="label-caps mb-3 text-primary">Simple process</p>
              <h2 className="font-heading text-3xl font-bold text-foreground">
                Practical service without unnecessary complexity.
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Whether you need one custom glass piece or support supplying a full project, our
                approach stays simple: understand the need, recommend the right products, and help
                you complete the order quickly.
              </p>
            </div>

            <div className="space-y-3">
              {process.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-background px-5 py-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary">
                    0{index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "For homeowners",
                desc: "Get help choosing dependable products for repairs, renovations, upgrades, and finishing work.",
              },
              {
                title: "For contractors",
                desc: "Source key materials efficiently, compare options, and coordinate larger or repeat purchases.",
              },
              {
                title: "For businesses",
                desc: "Maintain consistent access to core hardware and building supplies with responsive support.",
              },
            ].map((item) => (
              <div key={item.title} className="glass-card p-6">
                <h3 className="font-heading text-xl font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 pt-4 md:pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground md:px-10"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="label-caps mb-3 text-primary-foreground/80">Talk to us</p>
                <h2 className="font-heading text-3xl font-bold md:text-4xl">
                  Need a quote, measurements, or product advice?
                </h2>
                <p className="mt-3 text-sm text-primary-foreground/80 md:text-base">
                  Reach out and we will help you plan the next step for your project.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/254707209775"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-background px-6 py-3 font-heading font-bold text-foreground transition hover:bg-background/90"
                >
                  WhatsApp us
                </a>
                <a
                  href="tel:+254707209775"
                  className="inline-flex items-center rounded-lg border border-primary-foreground/30 px-6 py-3 font-heading font-bold text-primary-foreground transition hover:bg-white/10"
                >
                  Call now
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}