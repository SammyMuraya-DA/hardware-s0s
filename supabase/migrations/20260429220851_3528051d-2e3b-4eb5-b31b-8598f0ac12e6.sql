-- 1) Add user_id to orders (nullable: guest checkout still allowed)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);

-- 2) Allow customers to read their own orders
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3) Atomic place_order RPC: validates stock, decrements, attaches user_id
CREATE OR REPLACE FUNCTION public.place_order(
  _order_id text,
  _customer_name text,
  _phone text,
  _delivery_address text,
  _payment_method text,
  _items jsonb,
  _total numeric
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty int;
  available int;
  pname text;
  new_order public.orders;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Lock product rows and validate stock
  FOR item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    pid := (item->>'product_id')::uuid;
    qty := (item->>'quantity')::int;

    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for item %', pid;
    END IF;

    SELECT stock, name INTO available, pname
    FROM public.products WHERE id = pid FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % no longer exists', pid;
    END IF;

    IF available < qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%": only % left', pname, available;
    END IF;
  END LOOP;

  -- Decrement stock
  FOR item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    pid := (item->>'product_id')::uuid;
    qty := (item->>'quantity')::int;
    UPDATE public.products
       SET stock = stock - qty, updated_at = now()
     WHERE id = pid;
  END LOOP;

  INSERT INTO public.orders(
    order_id, customer_name, phone, delivery_address,
    payment_method, items, total, user_id
  ) VALUES (
    _order_id, _customer_name, _phone, _delivery_address,
    _payment_method, _items, _total, auth.uid()
  )
  RETURNING * INTO new_order;

  RETURN new_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, text, jsonb, numeric) TO anon, authenticated;