import { useParams, Link } from "react-router-dom";
import { useCategoryBySlug, useProductsByCategory } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: category } = useCategoryBySlug(slug || "");
  const { data: products = [], isLoading } = useProductsByCategory(category?.id);

  if (!category && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Category not found</h1>
          <Link to="/products" className="text-primary hover:underline">← Browse all products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="bg-surface/50 border-b border-border">
        <div className="container py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-caps text-primary mb-2">{category?.tagline}</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold">{category?.name}</h1>
            <p className="text-muted-foreground mt-2">{products.length} products</p>
          </motion.div>
        </div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {!isLoading && products.length === 0 && (
          <p className="text-center text-muted-foreground py-20">No products in this category yet.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
