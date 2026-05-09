ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand text DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS discount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.2,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_express boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_genuine boolean DEFAULT true;

-- Backfill slugs from name + short id suffix to guarantee uniqueness
UPDATE public.products
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
           || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL OR slug = '';

-- Backfill rating/reviews/express with light pseudo-random spread for demo realism
UPDATE public.products
SET
  rating = ROUND((3.8 + (random() * 1.2))::numeric, 1),
  review_count = floor(random() * 180)::int + 5,
  is_express = (random() < 0.45),
  original_price = CASE WHEN random() < 0.35 THEN ROUND(price * (1 + (0.1 + random()*0.3))) ELSE NULL END
WHERE rating IS NULL OR review_count IS NULL OR review_count = 0;

UPDATE public.products
SET discount = CASE
    WHEN original_price IS NOT NULL AND original_price > price
      THEN ROUND(((original_price - price) / original_price) * 100)::int
    ELSE 0
  END;

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);