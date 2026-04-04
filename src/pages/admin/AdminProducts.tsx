import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, Upload, Image, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  price: string;
  original_price: string;
  stock_quantity: string;
  category_id: string;
  description: string;
  unit: string;
  brand: string;
  is_active: boolean;
  is_featured: boolean;
  is_on_offer: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  offer_label: string;
  low_stock_threshold: string;
}

const emptyForm: ProductForm = {
  name: "", slug: "", sku: "", price: "", original_price: "", stock_quantity: "0",
  category_id: "", description: "", unit: "piece", brand: "",
  is_active: true, is_featured: false, is_on_offer: false, is_new_arrival: false,
  is_best_seller: false, offer_label: "", low_stock_threshold: "5",
};

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [excelProcessing, setExcelProcessing] = useState(false);
  const [excelResults, setExcelResults] = useState<{ updated: number; errors: string[] } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("products").select("*, categories(name)").order("name");
    if (search) q = q.ilike("name", `%${search}%`);
    const [{ data }, { data: cats }] = await Promise.all([
      q,
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setProducts(data || []);
    setCategories(cats || []);
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setProductImages([]);
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "", slug: p.slug || "", sku: p.sku || "",
      price: String(p.price || ""), original_price: String(p.original_price || ""),
      stock_quantity: String(p.stock_quantity ?? 0), category_id: p.category_id || "",
      description: p.description || "", unit: p.unit || "piece", brand: p.brand || "",
      is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
      is_on_offer: p.is_on_offer ?? false, is_new_arrival: p.is_new_arrival ?? false,
      is_best_seller: p.is_best_seller ?? false, offer_label: p.offer_label || "",
      low_stock_threshold: String(p.low_stock_threshold ?? 5),
    });
    setProductImages(p.images || []);
    setDialogOpen(true);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setProductImages(prev => [...prev, ...newUrls]);
    setUploadingImages(false);
    toast({ title: "Uploaded", description: `${newUrls.length} image(s) uploaded` });
  };

  const removeImage = (idx: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Error", description: "Name and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      sku: form.sku || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: Number(form.stock_quantity) || 0,
      category_id: form.category_id || null,
      description: form.description || null,
      unit: form.unit || "piece",
      brand: form.brand || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_on_offer: form.is_on_offer,
      is_new_arrival: form.is_new_arrival,
      is_best_seller: form.is_best_seller,
      offer_label: form.offer_label || null,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      images: productImages.length > 0 ? productImages : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Updated" : "Created", description: `Product "${form.name}" saved` });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Product removed" });
      load();
    }
    setDeleteId(null);
  };

  const handleExcelUpload = async (file: File) => {
    setExcelProcessing(true);
    setExcelResults(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      let updated = 0;
      const errors: string[] = [];

      for (const row of rows) {
        const sku = row.sku || row.SKU;
        const name = row.name || row.Name || row.PRODUCT || row.product;
        if (!sku && !name) { errors.push(`Row missing SKU/name`); continue; }

        const updatePayload: any = {};
        if (row.price !== undefined || row.Price !== undefined) updatePayload.price = Number(row.price ?? row.Price);
        if (row.original_price !== undefined) updatePayload.original_price = Number(row.original_price);
        if (row.stock_quantity !== undefined || row.stock !== undefined) updatePayload.stock_quantity = Number(row.stock_quantity ?? row.stock);
        if (row.unit !== undefined) updatePayload.unit = row.unit;
        if (row.brand !== undefined) updatePayload.brand = row.brand;
        if (row.description !== undefined) updatePayload.description = row.description;
        if (row.offer_label !== undefined) updatePayload.offer_label = row.offer_label;

        if (Object.keys(updatePayload).length === 0) { errors.push(`Row ${sku || name}: no fields to update`); continue; }

        let query = supabase.from("products").update(updatePayload);
        if (sku) query = query.eq("sku", sku);
        else query = query.eq("name", name);

        const { error, count } = await query;
        if (error) errors.push(`${sku || name}: ${error.message}`);
        else updated++;
      }

      setExcelResults({ updated, errors });
      if (updated > 0) {
        toast({ title: "Bulk Update Complete", description: `${updated} products updated` });
        load();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setExcelProcessing(false);
  };

  const f = (key: keyof ProductForm, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-heading text-xl font-bold">Products ({products.length})</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setExcelDialogOpen(true)} size="sm" variant="outline" className="gap-1">
            <FileSpreadsheet className="w-4 h-4" /> Bulk Update
          </Button>
          <Button onClick={openCreate} size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Product</Button>
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Image</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Product</th>
                <th className="text-left p-3 text-muted-foreground font-medium">SKU</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Category</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Price</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Stock</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No products found</td></tr>
              ) : products.map((p: any, i: number) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-surface-2/30 transition-colors"
                >
                  <td className="p-3">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-foreground font-medium">{p.name}</div>
                    {!p.is_active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.sku || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{p.categories?.name || "—"}</td>
                  <td className="p-3 font-mono text-primary font-semibold">{formatPrice(Number(p.price))}</td>
                  <td className="p-3">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${p.stock_quantity === 0 ? "bg-destructive/10 text-destructive" : p.stock_quantity <= 5 ? "bg-warning/10 text-warning" : "bg-green-500/10 text-green-400"}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.stock_quantity === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive font-medium">Out</span>
                    ) : p.stock_quantity <= 5 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning font-medium">Low</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 font-medium">In Stock</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <Input value={form.name} onChange={e => { f("name", e.target.value); if (!editingId) f("slug", autoSlug(e.target.value)); }} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
                <Input value={form.slug} onChange={e => f("slug", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">SKU</label>
                <Input value={form.sku} onChange={e => f("sku", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Price *</label>
                <Input type="number" value={form.price} onChange={e => f("price", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Original Price</label>
                <Input type="number" value={form.original_price} onChange={e => f("original_price", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Stock</label>
                <Input type="number" value={form.stock_quantity} onChange={e => f("stock_quantity", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <Input value={form.unit} onChange={e => f("unit", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Low Stock Threshold</label>
                <Input type="number" value={form.low_stock_threshold} onChange={e => f("low_stock_threshold", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category_id} onValueChange={v => f("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Brand</label>
                <Input value={form.brand} onChange={e => f("brand", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3} />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Product Images</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <AnimatePresence>
                  {productImages.map((url, idx) => (
                    <motion.div key={url} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      <button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
              <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={uploadingImages} className="gap-1">
                {uploadingImages ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploadingImages ? "Uploading..." : "Upload Images"}
              </Button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Offer Label</label>
              <Input value={form.offer_label} onChange={e => f("offer_label", e.target.value)} placeholder="e.g. 20% OFF" />
            </div>
            <div className="flex flex-wrap gap-4">
              {(["is_active", "is_featured", "is_on_offer", "is_new_arrival", "is_best_seller"] as const).map(key => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form[key] as boolean} onChange={e => f(key, e.target.checked)} className="rounded border-border" />
                  {key.replace("is_", "").replace(/_/g, " ")}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Bulk Update Dialog */}
      <Dialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Bulk Update from Excel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass-card p-4 text-sm space-y-2 border border-border/50">
              <p className="font-heading font-semibold text-foreground">Excel file format:</p>
              <p className="text-muted-foreground">Include a column named <code className="text-primary">sku</code> or <code className="text-primary">name</code> to match products, plus any fields to update:</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {["price", "original_price", "stock_quantity", "unit", "brand", "description", "offer_label"].map(f => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{f}</span>
                ))}
              </div>
            </div>
            <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleExcelUpload(e.target.files[0]); }} />
            <Button onClick={() => excelInputRef.current?.click()} disabled={excelProcessing} className="w-full gap-2">
              {excelProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4" /> Select Excel File</>}
            </Button>
            {excelResults && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-2 border border-border/50">
                <p className="text-sm text-green-400 font-medium">✅ {excelResults.updated} products updated</p>
                {excelResults.errors.length > 0 && (
                  <div>
                    <p className="text-sm text-destructive font-medium">Errors ({excelResults.errors.length}):</p>
                    <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground mt-1 space-y-1">
                      {excelResults.errors.map((e, i) => <p key={i}>• {e}</p>)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Product?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
