import { useOfferProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

const Offers = () => {
  const { data: offers = [], isLoading } = useOfferProducts();

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="bg-gradient-to-br from-primary/20 to-background border-b border-border">
        <div className="container py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl text-primary">⚡ FLASH DEALS</h1>
            <p className="text-muted-foreground mt-2">Limited time offers — grab them before they're gone</p>
          </motion.div>
        </div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {offers.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {!isLoading && offers.length === 0 && (
          <p className="text-center text-muted-foreground py-20">No active offers right now. Check back soon!</p>
        )}
      </div>
    </div>
  );
};

export default Offers;
