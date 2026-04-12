import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Shield, Users, Wrench } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Trusted quality",
    desc: "We source from reliable manufacturers and keep our shelves stocked with genuine, durable products for everyday builds and long-term projects.",
  },
  {
    icon: Wrench,
    title: "Practical expertise",
    desc: "Our team brings hands-on building knowledge, helping you choose the right hardware, fittings, glass, and tools with confidence.",
  },
  {
    icon: Users,
    title: "Community first",
    desc: "We proudly serve Nyeri homeowners, contractors, artisans, and businesses with responsive service and straightforward advice.",
  },
  {
    icon: Award,
    title: "Fair, honest pricing",
    desc: "We focus on value you can trust — dependable products, transparent pricing, and no shortcuts on quality.",
  },
];

const highlights = [
  "Over 20 years serving Nyeri and surrounding areas",
  "Wide selection across hardware, glass, plumbing, roofing, and fittings",
  "Guidance for both walk-in buyers and project-based orders",
  "Convenient support through phone, WhatsApp, pickup, and delivery coordination",
];

export default function About() {
  return (
    <div className="pb-16 lg:pb-0">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container py-20 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-4xl"
          >
            <p className="label-caps mb-4 text-primary">About us</p>
            <h1 className="font-display text-5xl text-foreground md:text-6xl">
              Built on trust, stocked for serious work.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              SOS Hardware & Glassmart, founded by Steve Wanga, has grown into a trusted source
              for quality building materials in Nyeri. From locks, roofing sheets, and plumbing
              supplies to glass, tools, and finishing essentials, we help customers buy with
              clarity and build with confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-heading font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Browse products
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center rounded-lg border border-border px-6 py-3 font-heading font-bold text-foreground transition hover:bg-surface/60"
              >
                Visit or contact us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {values.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
                className="glass-card p-6"
              >
                <item.icon className="mb-4 h-9 w-9 text-primary" />
                <h2 className="font-heading text-lg font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
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
            className="grid gap-8 rounded-3xl border border-border bg-surface/40 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10"
          >
            <div>
              <p className="label-caps mb-3 text-primary">Why customers choose us</p>
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                A reliable partner from first quote to final fitting.
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Whether you are buying a single replacement item or sourcing materials for a larger
                project, we focus on helping you make the right choice quickly, practically, and at
                a fair price.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "20+", label: "Years of experience" },
                  { value: "500+", label: "Products available" },
                  { value: "Nyeri", label: "Local pickup point" },
                  { value: "KE", label: "Delivery support" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-3xl text-primary">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <p className="label-caps mb-3 text-primary">What we stand for</p>
              <h2 className="font-heading text-3xl font-bold text-foreground">
                Straightforward service for builders, homeowners, and tradespeople.
              </h2>
              <p className="mt-4 text-muted-foreground">
                We believe hardware retail should be dependable: easy to navigate, professionally
                stocked, and backed by real product knowledge. That is why customers return to us
                for everyday needs, urgent replacements, and ongoing project supply.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {highlights.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-background p-5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                </div>
              ))}
            </motion.div>
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
                <p className="label-caps mb-3 text-primary-foreground/80">Need guidance?</p>
                <h2 className="font-heading text-3xl font-bold md:text-4xl">
                  Let us help you source the right materials for the job.
                </h2>
                <p className="mt-3 text-sm text-primary-foreground/80 md:text-base">
                  Talk to our team for product recommendations, quantities, pricing, and delivery or
                  pickup options.
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