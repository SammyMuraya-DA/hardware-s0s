import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, Upload, Image, FileSpreadsheet, X, Loader2, Save, ChevronDown, ChevronRight, Check } from "lucide-react";
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
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ created: number; errors: string[] } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "category">("table");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [inlineEdits, setInlineEdits] = useState<Record<string, Record<string, any>>>({});
  const [savingInline, setSavingInline] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState("all");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const bulkExcelRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("products").select("*, categories(name)").order("name");
    if (search) q = q.ilike("name", `%${search}%`);
    if (filterCategory !== "all") q = q.eq("category_id", filterCategory);
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
  }, [search, filterCategory]);

  const openCreate = () => {
    setEditingId(null); setForm(emptyForm); setProductImages([]); setDialogOpen(true);
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

  const normalizeExcelKey = (key: string) => key.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const normalizeCategoryName = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  const normalizeProductMatchName = (value: string) =>
    value
      .toLowerCase()
      .replace(/['"`]/g, "")
      .replace(/\b(inch|inches|inchs)\b/g, "in")
      .replace(/\b(feet|foots|foot)\b/g, "ft")
      .replace(/\bmeters?\b/g, "m")
      .replace(/\btonnes?\b/g, "tonne")
      .replace(/\bpcs?\b/g, "pc")
      .replace(/\bpieces?\b/g, "pc")
      .replace(/\bkilograms?\b/g, "kg")
      .replace(/\bliters?\b/g, "ltr")
      .replace(/\blitres?\b/g, "ltr")
      .replace(/\bhalf\b/g, "1/2")
      .replace(/\bquarter\b/g, "1/4")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9/*]/g, "");

  const normalizeExcelRow = (row: Record<string, any>) =>
    Object.entries(row).reduce<Record<string, any>>((acc, [key, value]) => {
      acc[normalizeExcelKey(key)] = value;
      return acc;
    }, {});

  const escapeCsvValue = (value: any) => {
    if (value === undefined || value === null) return "";
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const downloadBulkImportTemplate = () => {
    const headers = [
      "NAME",
      "SELLING PRICE",
      "CATEGORY",
      "BRAND",
      "UNIT",
      "OPENING STOCK",
      "PRODUCT DESCRIPTION",
      "SKU (Leave blank to auto generate sku)",
      "IMAGE",
      "PURCHASE PRICE (Including tax)",
    ];

    const sampleRows = [
      [
        "Cement 50kg",
        "780",
        "Building Materials",
        "Bamburi",
        "bag",
        "120",
        "Ordinary Portland cement 50kg bag",
        "",
        "",
        "700",
      ],
      [
        "Roofing Sheet 3m",
        "1450",
        "Roofing",
        "Mabati",
        "piece",
        "40",
        "Pre-painted roofing sheet 3 meters",
        "RS-3M-001",
        "",
        "1200",
      ],
    ];

    const csvContent = [headers, ...sampleRows].map(row => row.map(escapeCsvValue).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk-product-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded", description: "Use the file to bulk upload missing products" });
  };

  const getExcelValue = (row: Record<string, any>, ...keys: string[]) => {
    for (const key of keys) {
      const value = row[normalizeExcelKey(key)];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return undefined;
  };

  const toOptionalNumber = (value: any) => {
    if (value === undefined || value === null || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

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

  const removeImage = (idx: number) => setProductImages(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Error", description: "Name and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug || autoSlug(form.name),
      sku: form.sku || null, price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: Number(form.stock_quantity) || 0, category_id: form.category_id || null,
      description: form.description || null, unit: form.unit || "piece",
      brand: form.brand || null, is_active: form.is_active, is_featured: form.is_featured,
      is_on_offer: form.is_on_offer, is_new_arrival: form.is_new_arrival,
      is_best_seller: form.is_best_seller, offer_label: form.offer_label || null,
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
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Updated" : "Created", description: `Product "${form.name}" saved` });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); } else { toast({ title: "Deleted" }); load(); }
    setDeleteId(null);
  };

  // Inline edit helpers
  const setInlineField = (productId: string, field: string, value: any) => {
    setInlineEdits(prev => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [field]: value },
    }));
  };

  const saveInlineEdit = async (productId: string) => {
    const edits = inlineEdits[productId];
    if (!edits || Object.keys(edits).length === 0) return;
    setSavingInline(prev => new Set(prev).add(productId));
    const payload: any = {};
    if (edits.price !== undefined) payload.price = Number(edits.price);
    if (edits.stock_quantity !== undefined) payload.stock_quantity = Number(edits.stock_quantity);
    if (edits.name !== undefined) payload.name = edits.name;
    if (edits.is_active !== undefined) payload.is_active = edits.is_active;
    if (edits.is_featured !== undefined) payload.is_featured = edits.is_featured;
    if (edits.is_on_offer !== undefined) payload.is_on_offer = edits.is_on_offer;
    
    const { error } = await supabase.from("products").update(payload).eq("id", productId);
    setSavingInline(prev => { const n = new Set(prev); n.delete(productId); return n; });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setInlineEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
    toast({ title: "Saved" });
    load();
  };

  const handleExcelUpload = async (file: File) => {
    setExcelProcessing(true); setExcelResults(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rawRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const rows = rawRows.map(normalizeExcelRow);
      let updated = 0;
      const errors: string[] = [];

      const catMap: Record<string, string> = {};
      categories.forEach(c => {
        catMap[normalizeCategoryName(c.name)] = c.id;
      });

      for (const [index, row] of rows.entries()) {
        const rowLabel = `Row ${index + 2}`;
        const skuValue = getExcelValue(row, "sku", "sku_leave_blank_to_auto_generate_sku");
        const nameValue = getExcelValue(row, "name", "product");
        const sku = skuValue ? String(skuValue).trim() : "";
        const name = nameValue ? String(nameValue).trim() : "";
        const normalizedName = name.toLowerCase().replace(/\s+/g, " ").trim();
        const normalizedLooseName = normalizeProductMatchName(name);

        if (!sku && !name) {
          errors.push(`${rowLabel}: missing SKU/name`);
          continue;
        }

        const matchValue = sku || name;
        const updatePayload: any = {};

        const sellingPriceValue = getExcelValue(row, "price", "selling_price");
        if (sellingPriceValue !== undefined) {
          const parsed = Number(sellingPriceValue);
          if (Number.isNaN(parsed)) {
            errors.push(`${rowLabel} (${matchValue}): invalid selling price`);
            continue;
          }
          updatePayload.price = parsed;
        }

        const originalPriceValue = getExcelValue(
          row,
          "original_price",
          "purchase_price_including_tax",
          "purchase_price_excluding_tax",
        );
        if (originalPriceValue !== undefined) {
          const parsed = Number(originalPriceValue);
          if (Number.isNaN(parsed)) {
            errors.push(`${rowLabel} (${matchValue}): invalid purchase/original price`);
            continue;
          }
          updatePayload.original_price = parsed;
        }

        const stockQuantityValue = getExcelValue(row, "stock_quantity", "stock", "opening_stock");
        if (stockQuantityValue !== undefined) {
          const parsed = Number(stockQuantityValue);
          if (Number.isNaN(parsed)) {
            errors.push(`${rowLabel} (${matchValue}): invalid stock quantity`);
            continue;
          }
          updatePayload.stock_quantity = parsed;
        }

        const lowStockValue = getExcelValue(row, "low_stock_threshold", "alert_quantity");
        if (lowStockValue !== undefined) {
          const parsed = Number(lowStockValue);
          if (Number.isNaN(parsed)) {
            errors.push(`${rowLabel} (${matchValue}): invalid alert quantity`);
            continue;
          }
          updatePayload.low_stock_threshold = parsed;
        }

        const unitValue = getExcelValue(row, "unit");
        if (unitValue !== undefined) updatePayload.unit = String(unitValue).trim() || null;

        const brandValue = getExcelValue(row, "brand");
        if (brandValue !== undefined) updatePayload.brand = String(brandValue).trim() || null;

        const descriptionValue = getExcelValue(row, "description", "product_description");
        if (descriptionValue !== undefined) updatePayload.description = String(descriptionValue).trim() || null;

        const imageValue = getExcelValue(row, "image");
        if (imageValue !== undefined) {
          const image = String(imageValue).trim();
          updatePayload.images = image ? [image] : null;
        }

        const weightValue = getExcelValue(row, "weight");
        if (weightValue !== undefined) {
          const parsed = Number(weightValue);
          if (Number.isNaN(parsed)) {
            errors.push(`${rowLabel} (${matchValue}): invalid weight`);
            continue;
          }
          updatePayload.weight_kg = parsed;
        }

        const activeValue = getExcelValue(row, "is_active", "not_for_selling_1_yes_0_no");
        if (activeValue !== undefined) {
          const normalized = String(activeValue).trim().toLowerCase();
          if (normalized === "1") updatePayload.is_active = false;
          else if (normalized === "0") updatePayload.is_active = true;
        }

        const categoryValue = getExcelValue(row, "category");
        if (categoryValue !== undefined) {
          const categoryName = String(categoryValue).trim();
          if (categoryName) {
            const normalizedCategory = normalizeCategoryName(categoryName);
            let categoryId = catMap[normalizedCategory];

            if (!categoryId) {
              const { data: newCategory, error: categoryError } = await supabase
                .from("categories")
                .insert({ name: categoryName, slug: autoSlug(categoryName), is_active: true })
                .select("id, name")
                .single();

              if (categoryError || !newCategory) {
                errors.push(`${rowLabel} (${matchValue}): could not create category "${categoryName}"`);
                continue;
              }

              categoryId = newCategory.id;
              catMap[normalizedCategory] = newCategory.id;
              setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
            }

            updatePayload.category_id = categoryId;
          } else {
            updatePayload.category_id = null;
          }
        }

        if (Object.keys(updatePayload).length === 0) {
          errors.push(`${rowLabel} (${matchValue}): no updatable fields found`);
          continue;
        }

        let matchedIds: string[] = [];
        let updateError: any = null;

        if (sku) {
          const { data: skuMatches, error: skuError } = await supabase
            .from("products")
            .select("id")
            .eq("sku", sku);

          if (skuError) {
            errors.push(`${rowLabel} (${matchValue}): ${skuError.message}`);
            continue;
          }

          matchedIds = (skuMatches || []).map(product => product.id);
        }

        if (matchedIds.length === 0 && name) {
          const exactNameMatches = products.filter(product => {
            const productName = String(product.name || "").toLowerCase().replace(/\s+/g, " ").trim();
            return productName === normalizedName;
          });

          matchedIds = exactNameMatches.map(product => product.id);
        }

        if (matchedIds.length === 0 && name) {
          const looseNameMatches = products.filter(product => {
            const productName = String(product.name || "").toLowerCase().replace(/['"]/g, "").replace(/\s+/g, " ").trim();
            const targetName = normalizedName.replace(/['"]/g, "");
            return productName === targetName;
          });

          matchedIds = looseNameMatches.map(product => product.id);
        }

        if (matchedIds.length === 0 && name) {
          const normalizedMatches = products.filter(product => {
            const productName = normalizeProductMatchName(String(product.name || ""));
            return productName === normalizedLooseName;
          });

          matchedIds = normalizedMatches.map(product => product.id);
        }

        if (matchedIds.length === 0 && name) {
          const containsMatches = products.filter(product => {
            const productName = normalizeProductMatchName(String(product.name || ""));
            return (
              productName.includes(normalizedLooseName) ||
              normalizedLooseName.includes(productName)
            );
          });

          if (containsMatches.length === 1) {
            matchedIds = containsMatches.map(product => product.id);
          }
        }

        if (matchedIds.length === 0) {
          errors.push(`${rowLabel} (${matchValue}): product not found`);
          continue;
        }

        const { data: updatedRows, error } = await supabase
          .from("products")
          .update(updatePayload)
          .in("id", matchedIds)
          .select("id");

        updateError = error;

        if (updateError) {
          errors.push(`${rowLabel} (${matchValue}): ${updateError.message}`);
        } else if (!updatedRows || updatedRows.length === 0) {
          errors.push(`${rowLabel} (${matchValue}): product not found`);
        } else {
          updated += updatedRows.length;
        }
      }

      setExcelResults({ updated, errors });
      if (updated > 0) {
        toast({ title: "Bulk Update", description: `${updated} products updated` });
        load();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setExcelProcessing(false);
  };

  // Bulk product creation from Excel
  const handleBulkProductUpload = async (file: File) => {
    setBulkUploading(true); setBulkResults(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      let created = 0; const errors: string[] = [];
      const catMap: Record<string, string> = {};
      const categoryDisplayMap: Record<string, string> = {};
      categories.forEach(c => {
        const normalized = normalizeCategoryName(c.name);
        catMap[normalized] = c.id;
        categoryDisplayMap[normalized] = c.name;
      });

      rows.forEach((rawRow, index) => {
        rows[index] = normalizeExcelRow(rawRow);
      });

      for (const [index, row] of rows.entries()) {
        const rowLabel = `Row ${index + 2}`;
        const nameValue = getExcelValue(row, "name", "product");
        const priceValue = getExcelValue(row, "price", "selling_price");
        const categoryValue = getExcelValue(row, "category");
        const name = nameValue ? String(nameValue).trim() : "";

        if (!name) {
          errors.push(`${rowLabel}: missing name`);
          continue;
        }

        if (priceValue === undefined) {
          errors.push(`${rowLabel} (${name}): missing price`);
          continue;
        }

        const price = Number(priceValue);
        if (Number.isNaN(price)) {
          errors.push(`${rowLabel} (${name}): invalid price`);
          continue;
        }

        const categoryName = categoryValue ? String(categoryValue).trim() : "";
        let categoryId: string | null = null;
        if (categoryName) {
          const normalizedCategory = normalizeCategoryName(categoryName);
          categoryId = catMap[normalizedCategory] ?? null;

          if (!categoryId) {
            const { data: newCategory, error: categoryError } = await supabase
              .from("categories")
              .insert({ name: categoryName, slug: autoSlug(categoryName), is_active: true })
              .select("id, name")
              .single();

            if (categoryError || !newCategory) {
              errors.push(`${rowLabel} (${name}): could not create category "${categoryName}"`);
              continue;
            }

            categoryId = newCategory.id;
            catMap[normalizedCategory] = newCategory.id;
            categoryDisplayMap[normalizedCategory] = newCategory.name;
          }
        }

        const originalPriceValue = getExcelValue(row, "original_price", "purchase_price_including_tax", "purchase_price_excluding_tax");
        const stockQuantityValue = getExcelValue(row, "stock_quantity", "stock", "opening_stock");
        const skuValue = getExcelValue(row, "sku", "sku_leave_blank_to_auto_generate_sku");
        const unitValue = getExcelValue(row, "unit");
        const brandValue = getExcelValue(row, "brand");
        const descriptionValue = getExcelValue(row, "description", "product_description");
        const imageValue = getExcelValue(row, "image");
        const payload: any = {
          name,
          slug: autoSlug(name),
          price,
          original_price: toOptionalNumber(originalPriceValue),
          stock_quantity: toOptionalNumber(stockQuantityValue) ?? 0,
          sku: skuValue ? String(skuValue).trim() : null,
          unit: unitValue ? String(unitValue).trim() : "piece",
          brand: brandValue ? String(brandValue).trim() : null,
          description: descriptionValue ? String(descriptionValue).trim() : null,
          category_id: categoryId,
          images: imageValue ? [String(imageValue).trim()] : null,
          is_active: true,
        };

        const { error } = await supabase.from("products").insert(payload);
        if (error) errors.push(`${rowLabel} (${name}): ${error.message}`); else created++;
      }
      setBulkResults({ created, errors });
      if (created > 0) { toast({ title: "Bulk Import", description: `${created} products created` }); load(); }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    setBulkUploading(false);
  };

  // Group products by category
  const productsByCategory = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id),
  })).concat([{ id: "uncategorized", name: "Uncategorized", products: products.filter(p => !p.category_id) }]).filter(c => c.products.length > 0);

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev);
      n.has(catId) ? n.delete(catId) : n.add(catId);
      return n;
    });
  };

  const f = (key: keyof ProductForm, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  const renderInlineRow = (p: any) => {
    const edits = inlineEdits[p.id] || {};
    const hasEdits = Object.keys(edits).length > 0;
    const isSaving = savingInline.has(p.id);
    return (
      <tr key={p.id} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors group">
        <td className="p-2">
          {p.images?.[0] ? (
            <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover border border-border" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Image className="w-3.5 h-3.5 text-muted-foreground" /></div>
          )}
        </td>
        <td className="p-2">
          <input
            className="bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-sm text-foreground font-medium w-full transition-colors"
            value={edits.name ?? p.name}
            onChange={e => setInlineField(p.id, "name", e.target.value)}
          />
        </td>
        <td className="p-2 font-mono text-xs text-muted-foreground">{p.sku || "—"}</td>
        <td className="p-2">
          <input
            type="number"
            className="bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-sm font-mono text-primary font-semibold w-20 transition-colors"
            value={edits.price ?? p.price}
            onChange={e => setInlineField(p.id, "price", e.target.value)}
          />
        </td>
        <td className="p-2">
          <input
            type="number"
            className={`bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-sm font-mono w-16 transition-colors ${p.stock_quantity <= 5 ? "text-destructive" : "text-foreground"}`}
            value={edits.stock_quantity ?? p.stock_quantity}
            onChange={e => setInlineField(p.id, "stock_quantity", e.target.value)}
          />
        </td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="checkbox" checked={edits.is_active ?? p.is_active} onChange={e => setInlineField(p.id, "is_active", e.target.checked)} className="rounded border-border w-3 h-3" />
              <span className="text-muted-foreground">Active</span>
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="checkbox" checked={edits.is_featured ?? p.is_featured} onChange={e => setInlineField(p.id, "is_featured", e.target.checked)} className="rounded border-border w-3 h-3" />
              <span className="text-muted-foreground">Featured</span>
            </label>
          </div>
        </td>
        <td className="p-2">
          <div className="flex items-center gap-1">
            {hasEdits && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400" onClick={() => saveInlineEdit(p.id)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-heading text-xl font-bold">Products ({products.length})</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Table</button>
            <button onClick={() => setViewMode("category")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "category" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>By Category</button>
          </div>
          <Button onClick={() => setBulkUploadOpen(true)} size="sm" variant="outline" className="gap-1 h-9"><Upload className="w-3.5 h-3.5" /> Bulk Import</Button>
          <Button onClick={() => setExcelDialogOpen(true)} size="sm" variant="outline" className="gap-1 h-9"><FileSpreadsheet className="w-3.5 h-3.5" /> Bulk Update</Button>
          <Button onClick={openCreate} size="sm" className="gap-1 h-9"><Plus className="w-3.5 h-3.5" /> Add</Button>
        </div>
      </div>

      {/* Category View */}
      {viewMode === "category" ? (
        <div className="space-y-3">
          {productsByCategory.map(cat => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-border/50 overflow-hidden">
              <button onClick={() => toggleCat(cat.id)} className="w-full flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  {expandedCats.has(cat.id) ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-heading font-bold text-foreground">{cat.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{cat.products.length}</span>
                </div>
              </button>
              <AnimatePresence>
                {expandedCats.has(cat.id) && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-b border-border bg-surface-2/30">
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs w-12">Img</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs">Name</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs w-20">SKU</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs w-24">Price</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs w-20">Stock</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs w-32">Flags</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>{cat.products.map(renderInlineRow)}</tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Img</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Name</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">SKU</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Price</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Stock</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Flags</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products found</td></tr>
                ) : products.map(renderInlineRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editingId ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Name *</label><Input value={form.name} onChange={e => { f("name", e.target.value); if (!editingId) f("slug", autoSlug(e.target.value)); }} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Slug</label><Input value={form.slug} onChange={e => f("slug", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">SKU</label><Input value={form.sku} onChange={e => f("sku", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Price *</label><Input type="number" value={form.price} onChange={e => f("price", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Original Price</label><Input type="number" value={form.original_price} onChange={e => f("original_price", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Stock</label><Input type="number" value={form.stock_quantity} onChange={e => f("stock_quantity", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Unit</label><Input value={form.unit} onChange={e => f("unit", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Low Stock</label><Input type="number" value={form.low_stock_threshold} onChange={e => f("low_stock_threshold", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category_id} onValueChange={v => f("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Brand</label><Input value={form.brand} onChange={e => f("brand", e.target.value)} /></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Description</label><Textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3} /></div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Product Images (bulk upload)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <AnimatePresence>
                  {productImages.map((url, idx) => (
                    <motion.div key={url} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      <button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-white" /></button>
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
            <div><label className="text-xs text-muted-foreground mb-1 block">Offer Label</label><Input value={form.offer_label} onChange={e => f("offer_label", e.target.value)} placeholder="e.g. 20% OFF" /></div>
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

      {/* Bulk Import Dialog */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Bulk Import Products</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="glass-card p-4 text-sm space-y-2 border border-border/50">
              <p className="font-heading font-semibold text-foreground">Excel format for new products:</p>
              <p className="text-muted-foreground">This importer now fits your admin export sheet format.</p>
              <p className="text-muted-foreground">Download the template below, fill in the missing products, then upload it here.</p>
              <p className="text-muted-foreground">Required columns:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {["NAME", "SELLING PRICE"].map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{c}</span>
                ))}
              </div>
              <p className="text-muted-foreground mt-2">Supported optional columns from your sheet:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {["CATEGORY", "BRAND", "UNIT", "OPENING STOCK", "PRODUCT DESCRIPTION", "SKU (Leave blank to auto generate sku)", "IMAGE", "PURCHASE PRICE (Including tax)"].map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{c}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Category names are matched case-insensitively, and any missing categories in the sheet are created automatically during import. Extra columns in the export file are safely ignored.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={downloadBulkImportTemplate} className="flex-1 gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Download Template
              </Button>
              <Button onClick={() => bulkExcelRef.current?.click()} disabled={bulkUploading} className="flex-1 gap-2">
                {bulkUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Select Excel File</>}
              </Button>
            </div>
            <input ref={bulkExcelRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleBulkProductUpload(e.target.files[0]); }} />
            {bulkResults && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-2 border border-border/50">
                <p className="text-sm text-green-400 font-medium">✅ {bulkResults.created} products created</p>
                {bulkResults.errors.length > 0 && (
                  <div>
                    <p className="text-sm text-destructive font-medium">Errors ({bulkResults.errors.length}):</p>
                    <div className="max-h-32 overflow-y-auto pr-2 text-xs text-muted-foreground mt-1 space-y-1">
                      {bulkResults.errors.map((e, i) => <p key={i}>• {e}</p>)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Bulk Update Dialog */}
      <Dialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-primary" /> Bulk Update from Excel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="glass-card p-4 text-sm space-y-2 border border-border/50">
              <p className="font-heading font-semibold text-foreground">Match by <code className="text-primary">SKU</code> or <code className="text-primary">NAME</code> from your export sheet.</p>
              <p className="text-muted-foreground">Supported update columns from the Excel you attached:</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  "NAME",
                  "SKU (Leave blank to auto generate sku)",
                  "SELLING PRICE",
                  "PURCHASE PRICE (Including tax)",
                  "PURCHASE PRICE (Excluding tax)",
                  "OPENING STOCK",
                  "ALERT QUANTITY",
                  "UNIT",
                  "BRAND",
                  "CATEGORY",
                  "PRODUCT DESCRIPTION",
                  "IMAGE",
                  "WEIGHT",
                  "NOT FOR SELLING(1=yes 0=No)",
                ].map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{c}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Category names are matched case-insensitively and created automatically if missing. Other columns in the file are ignored.</p>
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
                    <div className="max-h-32 overflow-y-auto pr-2 text-xs text-muted-foreground mt-1 space-y-1">
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
