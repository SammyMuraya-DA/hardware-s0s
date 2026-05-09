import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Package } from 'lucide-react';
import { formatKSh } from '@/types';
import { Button } from '@/components/ui/button';

const MyOrders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-3">Sign in to view your orders</h2>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>My Orders | SOS Hardware</title></Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !orders?.length ? (
          <div className="text-center py-16 bg-card rounded-lg border">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-4">When you place an order it will appear here.</p>
            <Link to="/products"><Button>Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const items = Array.isArray(o.items) ? (o.items as Array<{ name: string; quantity: number }>) : [];
              return (
                <div key={o.id} className="bg-card border rounded-lg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono font-bold text-sm text-primary">{o.order_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('en-KE')}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary">
                      {o.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {items.slice(0, 3).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                    {items.length > 3 && ` +${items.length - 3} more`}
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-xs text-muted-foreground">{o.payment_method?.toUpperCase()}</span>
                    <span className="font-bold">{formatKSh(Number(o.total))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
