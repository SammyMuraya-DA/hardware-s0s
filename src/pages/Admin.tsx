import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Product, formatKSh, slugify } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Package, ShoppingBag, Loader2, LayoutDashboard, Tag, Folder, BarChart3, LogOut, Upload, Search, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminOverview from '@/components/admin/AdminOverview';
import CategoriesManager from '@/components/admin/CategoriesManager';
import OffersManager from '@/components/admin/OffersManager';
import ReportsTab from '@/components/admin/ReportsTab';
import ImageUploader from '@/components/admin/ImageUploader';
import BulkImageUpload from '@/components/admin/BulkImageUpload';
import BulkProductUpload from '@/components/admin/BulkProductUpload';
import UsersManager from '@/components/admin/UsersManager';
import AccountSettings from '@/components/admin/AccountSettings';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

type TabKey = 'overview' | 'orders' | 'products' | 'categories' | 'offers' | 'users' | 'reports' | 'settings';

const Admin = () => {
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkProductsOpen, setBulkProductsOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');
  const [navOpen, setNavOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(2000);
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-for-product-form'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('name').eq('is_active', true).order('sort_order');
      return (data ?? []).map((c) => c.name);
    },
  });

  const emptyProduct = { id: '', name: '', category: 'Glass', price: 0, description: '', image_url: '', stock: 0, brand: '', slug: '' } as unknown as Product;

  const handleSave = async (product: Partial<Product> & { id: string }) => {
    const { id, created_at, updated_at, ...rest } = product as Product;
    const data = { ...rest, slug: rest.slug || slugify(rest.name) };
    if (id && products.find((p) => p.id === id)) {
      const { error } = await supabase.from('products').update(data).eq('id', id);
      if (error) { toast.error(error.message); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Product added');
    }
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setDialogOpen(false);
    setEditProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Product deleted');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleOrderStatus = async (id: string, status: string) => {
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('order_id')
      .maybeSingle();
    if (error) { toast.error(error.message); return; }
    toast.success('Order status updated');
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    if (updated?.order_id) {
      supabase.functions
        .invoke('send-order-notification', {
          body: { order_id: updated.order_id, event: 'status_changed', new_status: status },
        })
        .catch((e) => console.warn('Notification dispatch failed:', e));
    }
  };

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const navItems: { key: TabKey; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingBag, badge: String(orders.length) },
    { key: 'products', label: 'Products', icon: Package, badge: String(products.length) },
    { key: 'categories', label: 'Categories', icon: Folder },
    { key: 'offers', label: 'Offers', icon: Tag },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | SOS Hardware</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="flex min-h-[calc(100vh-4rem)] bg-background">
        {/* Vertical sidebar */}
        <aside className={cn(
          "fixed lg:sticky lg:top-16 top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border flex flex-col transition-transform",
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="p-5 border-b border-border">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              Admin
            </h1>
            <p className="text-[11px] text-muted-foreground mt-1 truncate" title={user?.email ?? ''}>{user?.email}</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { setTab(item.key); setNavOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2",
                    active
                      ? "bg-primary/10 text-primary border-primary font-medium"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary/50 border-transparent"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={signOut} className="w-full">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {navOpen && (
          <div
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 top-16 bg-black/40 z-20 lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 max-w-6xl">
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setNavOpen(true)}>
              <LayoutDashboard className="w-4 h-4 mr-1" /> Menu
            </Button>
            <h2 className="font-bold capitalize">{tab}</h2>
          </div>
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold capitalize">{navItems.find(n => n.key === tab)?.label}</h2>
          </div>

          {tab === 'overview' && <AdminOverview />}

          {tab === 'orders' && (
            <>
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No orders yet.</p>
            ) : (
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left p-3">Order ID</th>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Phone</th>
                        <th className="text-left p-3">Address</th>
                        <th className="text-left p-3">Total</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-t hover:bg-secondary/30">
                          <td className="p-3 font-mono text-xs">{o.order_id}</td>
                          <td className="p-3 font-medium">{o.customer_name}</td>
                          <td className="p-3 text-muted-foreground">{o.phone}</td>
                          <td className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={o.delivery_address ?? ''}>{o.delivery_address}</td>
                          <td className="p-3">{formatKSh(Number(o.total))}</td>
                          <td className="p-3">
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 ${
                                o.status === 'Delivered' ? 'bg-primary/10 text-primary' :
                                o.status === 'Confirmed' ? 'bg-accent/20 text-accent-foreground' :
                                'bg-secondary text-muted-foreground'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>
          )}

          {tab === 'products' && (
            <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search products…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-9" />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">{filteredProducts.length} shown</span>
              </div>
              <div className="flex gap-2">
                <Dialog open={bulkProductsOpen} onOpenChange={setBulkProductsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Bulk Products</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Bulk Product Upload</DialogTitle></DialogHeader>
                    <BulkProductUpload />
                  </DialogContent>
                </Dialog>
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Bulk Images</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Bulk Image Upload</DialogTitle></DialogHeader>
                    <BulkImageUpload />
                  </DialogContent>
                </Dialog>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditProduct(emptyProduct)}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editProduct?.id ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
                    {editProduct && <ProductForm product={editProduct} categories={categories} onSave={handleSave} />}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        <th className="text-left p-3">Image</th>
                        <th className="text-left p-3">Product</th>
                        <th className="text-left p-3">Category</th>
                        <th className="text-left p-3">Price</th>
                        <th className="text-left p-3">Stock</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.slice(0, 200).map((p) => (
                        <tr key={p.id} className="border-t hover:bg-secondary/30">
                          <td className="p-2">
                            <div className="w-12 h-12 bg-secondary rounded overflow-hidden">
                              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : null}
                            </div>
                          </td>
                          <td className="p-3 font-medium max-w-xs truncate">{p.name}</td>
                          <td className="p-3 text-muted-foreground text-xs">{p.category}</td>
                          <td className="p-3 whitespace-nowrap">{formatKSh(Number(p.price))}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${Number(p.stock) > 5 ? 'bg-primary/10 text-primary' : Number(p.stock) > 0 ? 'bg-accent/20 text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="p-3 flex gap-1 justify-end">
                            <button onClick={() => { setEditProduct(p); setDialogOpen(true); }} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length > 200 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Showing first 200 results — refine your search to see more.</p>
                  )}
                </div>
              </div>
            )}
            </>
          )}

          {tab === 'categories' && <CategoriesManager />}
          {tab === 'offers' && <OffersManager />}
          {tab === 'users' && <UsersManager />}
          {tab === 'reports' && <ReportsTab />}
          {tab === 'settings' && <AccountSettings />}
        </main>
      </div>
    </>
  );
};

const ProductForm = ({ product, categories, onSave }: { product: Product; categories: string[]; onSave: (p: Product) => void }) => {
  const [form, setForm] = useState(product);
  const cats = categories.length > 0 ? categories : ['Glass', 'Plumbing', 'Tools & Hardware', 'Electrical'];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Product Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={200} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">Category *</label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Brand</label>
          <Input value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} maxLength={80} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">Price (KSh) *</label>
          <Input type="number" min={0} value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Was (KSh)</label>
          <Input type="number" min={0} value={form.original_price ?? ''} onChange={(e) => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Stock *</label>
          <Input type="number" min={0} value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Description</label>
        <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1000} />
      </div>
      <ImageUploader value={form.image_url ?? ''} onChange={(url) => setForm({ ...form, image_url: url })} />
      <div>
        <label className="text-sm font-medium block mb-1">Slug (auto-generated if empty)</label>
        <Input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} maxLength={120} placeholder={slugify(form.name || 'product-name')} />
      </div>
      <Button type="submit" className="w-full">{product.id ? 'Update Product' : 'Add Product'}</Button>
    </form>
  );
};

export default Admin;
