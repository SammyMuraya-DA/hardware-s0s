
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_address TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'mpesa',
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_requests table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  type TEXT NOT NULL,
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Products: publicly readable, open CRUD for admin (no auth yet)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow product inserts" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow product updates" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow product deletes" ON public.products FOR DELETE USING (true);

-- Orders
CREATE POLICY "Orders are viewable" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow order inserts" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order updates" ON public.orders FOR UPDATE USING (true);

-- Quote requests
CREATE POLICY "Quote requests are viewable" ON public.quote_requests FOR SELECT USING (true);
CREATE POLICY "Allow quote request inserts" ON public.quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow quote request updates" ON public.quote_requests FOR UPDATE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
