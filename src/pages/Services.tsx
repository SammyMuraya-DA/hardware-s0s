import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const services = [
  { icon: '🪟', title: 'Window Installation', desc: 'Professional window fitting for residential and commercial buildings.', price: 'From KSh 5,000' },
  { icon: '✂️', title: 'Glass Cutting & Supply', desc: 'Precision glass cutting to your exact measurements, all thicknesses.', price: 'From KSh 500' },
  { icon: '🪞', title: 'Mirror Installation', desc: 'Custom mirror fitting for bathrooms, wardrobes, and decorative use.', price: 'From KSh 3,000' },
  { icon: '🚿', title: 'Shower Enclosures', desc: 'Frameless and framed glass shower enclosures, custom made.', price: 'From KSh 15,000' },
  { icon: '🔧', title: 'Plumbing Services', desc: 'Full plumbing installation, repairs, and maintenance.', price: 'From KSh 2,000' },
  { icon: '📋', title: 'Free Site Assessment', desc: 'We visit your site to assess needs and provide accurate quotations.', price: 'Free' },
];

const Services = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-2">Our Services</h1>
    <p className="text-muted-foreground mb-10">Professional installation and consultation services across Kenya</p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {services.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow"
        >
          <span className="text-4xl block mb-4">{s.icon}</span>
          <h3 className="font-bold text-lg mb-2">{s.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-sm font-semibold">{s.price}</span>
        </motion.div>
      ))}
    </div>

    <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
      <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
      <p className="opacity-90 mb-6">Request a free quote and we'll get back to you within 24 hours</p>
      <Link to="/quote" className="inline-flex px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:brightness-110 transition">
        Request a Quote
      </Link>
    </div>
  </div>
);

export default Services;
