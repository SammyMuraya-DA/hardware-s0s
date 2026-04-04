import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function useSiteContent() {
  return useQuery({
    queryKey: ["site_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      const map: Record<string, { value: string | null; image_url: string | null }> = {};
      (data || []).forEach((item: any) => {
        map[item.key] = { value: item.value, image_url: item.image_url };
      });
      return map;
    },
  });
}

export type DbProduct = Tables<"products">;
export type DbCategory = Tables<"categories">;

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as DbCategory[];
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true);
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useOfferProducts() {
  return useQuery({
    queryKey: ["products", "offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_on_offer", true);
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_new_arrival", true);
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useProductsByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["products", "category", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category_id", categoryId!);
      if (error) throw error;
      return data as DbProduct[];
    },
    enabled: !!categoryId,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as DbCategory;
    },
    enabled: !!slug,
  });
}

export function formatPrice(price: number) {
  return `KES ${price.toLocaleString()}`;
}

export function getStockStatus(product: DbProduct) {
  if (product.stock_quantity === 0) return "out_of_stock";
  if (product.stock_quantity <= (product.low_stock_threshold ?? 5)) return "low_stock";
  return "in_stock";
}
