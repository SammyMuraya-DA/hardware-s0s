import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Upload, Image, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface CatForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  tagline: string;
  image_url: string;
  display_order: string;
  is_active: boolean;
}

const emptyForm: CatForm = {
  name: "", slug: "", description: "", icon: "", tagline: "", image_url: "", display_order: "0", is_active: true,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("products").select("category_id").eq("is_active", true),
    ]);
    setCategories(cats || []);
    const counts: Record<string, number> = {};
    (prods || []).forEach((p: any) => { if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1; });
    setProductCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setCategoryImages([]); setDialogOpen(true); };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "", slug: c.slug || "", description: c.description || "",
      icon: c.icon || "", tagline: c.tagline || "", image_url: c.image_url || "",
      display_order: String(c.display_order ?? 0), is_active: c.is_active ?? true,
    });
    setCategoryImages(c.image_url ? [c.image_url] : []);
    setDialogOpen(true);
  };

  const [categoryImages, setCategoryImages] = useState<string[]>([]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
    if (newUrls.length > 0) {
      // Use first uploaded as main category image
      if (!form.image_url) {
        setForm(prev => ({ ...prev, image_url: newUrls[0] }));
      }
      setCategoryImages(prev => [...prev, ...newUrls]);
      toast({ title: "Uploaded", description: `${newUrls.length} image(s) uploaded` });
    }
    setUploadingImage(false);
  };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug || autoSlug(form.name),
      description: form.description || null, icon: form.icon || null,
      tagline: form.tagline || null, image_url: form.image_url || null,
      display_order: Number(form.display_order) || 0, is_active: form.is_active,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("categories").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("categories").insert(payload));
    }
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Updated" : "Created", description: `Category "${form.name}" saved` });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("categories").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: "Category removed" });
    setDeleteId(null);
    load();
  };

  const f = (key: keyof CatForm, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">Categories ({categories.length})</h2>
        <Button onClick={openCreate} size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Category</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 border border-border/50 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center text-2xl">
                    {c.icon || "📦"}
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            {c.tagline && <p className="text-xs text-muted-foreground mb-2">{c.tagline}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{productCounts[c.id] || 0} products</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${c.is_active ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                {c.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Category Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{editingId ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <Input value={form.name} onChange={e => { f("name", e.target.value); if (!editingId) f("slug", autoSlug(e.target.value)); }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
                <Input value={form.slug} onChange={e => f("slug", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Icon (emoji)</label>
                <Input value={form.icon} onChange={e => f("icon", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tagline</label>
              <Input value={form.tagline} onChange={e => f("tagline", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => f("description", e.target.value)} rows={2} />
            </div>

            {/* Category Bulk Image Upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Category Images (bulk upload)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {categoryImages.map((url, idx) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                    <button onClick={() => {
                      const updated = categoryImages.filter((_, i) => i !== idx);
                      setCategoryImages(updated);
                      if (form.image_url === url) f("image_url", updated[0] || "");
                    }} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                    {form.image_url === url && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-primary text-primary-foreground px-1 rounded">Main</span>
                    )}
                  </div>
                ))}
              </div>
              {categoryImages.length > 1 && (
                <p className="text-[10px] text-muted-foreground mb-2">Click an image to set as main category image:</p>
              )}
              {categoryImages.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {categoryImages.map((url, idx) => (
                    <button key={idx} onClick={() => f("image_url", url)} className={`text-[10px] px-2 py-0.5 rounded-full border ${form.image_url === url ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                      Image {idx + 1}
                    </button>
                  ))}
                </div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
              <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="gap-1">
                {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploadingImage ? "Uploading..." : "Upload Images"}
              </Button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Order</label>
              <Input type="number" value={form.display_order} onChange={e => f("display_order", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => f("is_active", e.target.checked)} className="rounded border-border" />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Category?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Products in this category will become uncategorized.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
