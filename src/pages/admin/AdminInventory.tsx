import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, XCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminInventory() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [outOfStock, setOutOfStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [low, out] = await Promise.all([
      supabase.from("products").select("id, name, sku, stock_quantity, low_stock_threshold").gt("stock_quantity", 0).lte("stock_quantity", 5).eq("is_active", true).order("stock_quantity"),
      supabase.from("products").select("id, name, sku, stock_quantity").eq("stock_quantity", 0).eq("is_active", true).order("name"),
    ]);
    setLowStock(low.data || []);
    setOutOfStock(out.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStock = async (id: string) => {
    const qty = Number(editingStock[id]);
    if (isNaN(qty) || qty < 0) return;
    const { error } = await supabase.from("products").update({ stock_quantity: qty }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Stock quantity updated" });
      setEditingStock(prev => { const n = { ...prev }; delete n[id]; return n; });
      load();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">Inventory Alerts</h2>
        <div className="flex items-center gap-3">
          <div className="glass-card px-3 py-1.5 flex items-center gap-2 border border-destructive/20">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs font-medium text-destructive">{outOfStock.length} out of stock</span>
          </div>
          <div className="glass-card px-3 py-1.5 flex items-center gap-2 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium text-warning">{lowStock.length} low stock</span>
          </div>
        </div>
      </div>

      {outOfStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-destructive/20">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-heading font-bold text-destructive">Out of Stock ({outOfStock.length})</h3>
          </div>
          <div className="space-y-2">
            {outOfStock.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <span className="text-foreground text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{p.sku}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingStock[p.id] !== undefined ? (
                    <>
                      <Input type="number" value={editingStock[p.id]} onChange={e => setEditingStock(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-20 h-7 text-xs" />
                      <Button size="sm" className="h-7 text-xs" onClick={() => updateStock(p.id)}>Save</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingStock(prev => ({ ...prev, [p.id]: "0" }))}>
                      Restock
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 border border-warning/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-heading font-bold text-warning">Low Stock ({lowStock.length})</h3>
          </div>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <span className="text-foreground text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{p.sku}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingStock[p.id] !== undefined ? (
                    <>
                      <Input type="number" value={editingStock[p.id]} onChange={e => setEditingStock(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-20 h-7 text-xs" />
                      <Button size="sm" className="h-7 text-xs" onClick={() => updateStock(p.id)}>Save</Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-warning font-bold font-mono">{p.stock_quantity} units</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingStock(prev => ({ ...prev, [p.id]: String(p.stock_quantity) }))}>
                        Update
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {outOfStock.length === 0 && lowStock.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center border border-green-500/20">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-green-400 font-heading font-bold text-lg">All products are well stocked!</p>
          <p className="text-muted-foreground text-sm mt-1">No inventory alerts at this time</p>
        </motion.div>
      )}
    </div>
  );
}
