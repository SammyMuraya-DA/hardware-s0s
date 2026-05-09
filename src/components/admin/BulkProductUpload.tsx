import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet, FileImage, Download, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { slugify } from '@/types';
import { useAuth } from '@/context/AuthContext';

/**
 * Bulk product creator. Accepts a CSV of product rows + an optional batch
 * of image files. Each row's `image` column should match an image filename
 * (or product slug); the matching image is uploaded to storage and its
 * public URL set as `image_url` on the inserted product.
 */

interface RowResult {
  name: string;
  status: 'success' | 'failed';
  error?: string;
}

interface ValidationIssue {
  row: number;
  name: string;
  problems: string[];
}

const REQUIRED = ['name', 'category', 'price'];
const ACCEPTED_IMG = ['image/jpeg', 'image/png', 'image/webp'];

const parseCSV = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field !== '' || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else field += c;
    }
  }
  if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== '')).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
};

const TEMPLATE = `name,category,price,original_price,stock,brand,description,image\nPortland Cement 50kg,Cement & Building,750,800,100,Bamburi,Quality cement bag,portland-cement.jpg\n`;

const BulkProductUpload = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [results, setResults] = useState<RowResult[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result ?? ''));
        if (parsed.length === 0) { toast.error('CSV is empty'); return; }
        const missing = REQUIRED.filter((k) => !(k in parsed[0]));
        if (missing.length) { toast.error(`Missing CSV column(s): ${missing.join(', ')}`); return; }
        setRows(parsed);
        setResults([]);
        setIssues(validateRows(parsed));
        toast.success(`Loaded ${parsed.length} row(s)`);
      } catch (e) {
        toast.error('Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  };

  const validateRows = (data: Record<string, string>[]): ValidationIssue[] => {
    const out: ValidationIssue[] = [];
    const seen = new Map<string, number>();
    data.forEach((row, idx) => {
      const problems: string[] = [];
      const name = (row.name || '').trim();
      if (!name) problems.push('Missing name');
      if (name.length > 200) problems.push('Name exceeds 200 chars');
      if (!row.category?.trim()) problems.push('Missing category');
      const price = Number(row.price);
      if (row.price === undefined || row.price === '') problems.push('Missing price');
      else if (Number.isNaN(price)) problems.push(`Invalid price "${row.price}"`);
      else if (price < 0) problems.push('Price cannot be negative');
      if (row.original_price && Number.isNaN(Number(row.original_price))) problems.push(`Invalid original_price "${row.original_price}"`);
      if (row.stock !== undefined && row.stock !== '') {
        const s = Number(row.stock);
        if (Number.isNaN(s) || !Number.isInteger(s)) problems.push(`Stock not a whole number "${row.stock}"`);
        else if (s < 0) problems.push('Stock cannot be negative');
      }
      if (name) {
        const key = slugify(name);
        if (seen.has(key)) problems.push(`Duplicate of row ${seen.get(key)}`);
        else seen.set(key, idx + 2);
      }
      if (problems.length) out.push({ row: idx + 2, name: name || '(unnamed)', problems });
    });
    return out;
  };

  const handleImages = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => ACCEPTED_IMG.includes(f.type) && f.size <= 5 * 1024 * 1024);
    if (arr.length !== list.length) toast.warning(`Skipped ${list.length - arr.length} invalid image(s)`);
    setImages(arr);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const findImageFor = (row: Record<string, string>): File | null => {
    const hint = (row.image || '').toLowerCase().trim();
    const slug = slugify(row.name);
    const norm = (n: string) => n.toLowerCase().replace(/\.[^.]+$/, '');
    if (hint) {
      const exact = images.find((f) => f.name.toLowerCase() === hint);
      if (exact) return exact;
      const byBase = images.find((f) => norm(f.name) === norm(hint));
      if (byBase) return byBase;
    }
    return images.find((f) => slugify(norm(f.name)) === slug) ?? null;
  };

  const run = async () => {
    if (!rows.length) return;
    if (issues.length) { toast.error(`Fix ${issues.length} validation issue(s) first`); return; }
    if (!isAdmin) { toast.error('Admin access required'); return; }
    setRunning(true);
    setProgress({ done: 0, total: rows.length });
    const out: RowResult[] = [];

    for (const row of rows) {
      try {
        const price = Number(row.price);
        if (!row.name) throw new Error('Missing name');
        if (!row.category) throw new Error('Missing category');
        if (Number.isNaN(price)) throw new Error('Invalid price');

        let imageUrl = '';
        const file = findImageFor(row);
        if (file) {
          const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
          const path = `products/${slugify(row.name)}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
          if (upErr) throw new Error(`Image upload: ${upErr.message}`);
          imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        }

        const original = row.original_price ? Number(row.original_price) : null;
        const payload = {
          name: row.name,
          category: row.category,
          price,
          original_price: original,
          discount: original && original > price ? Math.round(((original - price) / original) * 100) : 0,
          stock: row.stock ? Number(row.stock) : 0,
          brand: row.brand || '',
          description: row.description || '',
          image_url: imageUrl,
          slug: slugify(row.name),
        };
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw new Error(error.message);
        out.push({ name: row.name, status: 'success' });
      } catch (err) {
        out.push({ name: row.name || '(unnamed)', status: 'failed', error: err instanceof Error ? err.message : 'Unknown' });
      }
      setResults([...out]);
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
    const ok = out.filter((r) => r.status === 'success').length;
    toast.success(`Bulk import complete: ${ok} / ${out.length} created`);
  };

  if (authLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-6 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-2" />
        <p className="font-semibold">Admin access required</p>
        <p className="text-sm text-muted-foreground mt-1">Only authorised staff can perform bulk product imports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 border border-dashed rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-8 h-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">1. Upload product CSV</p>
            <p className="text-xs text-muted-foreground mb-3">
              Required columns: <code className="bg-background px-1 rounded">name, category, price</code>.
              Optional: <code className="bg-background px-1 rounded">original_price, stock, brand, description, image</code>.
              The <code>image</code> column should match an image filename below.
            </p>
            <div className="flex flex-wrap gap-2">
              <input id="bulk-csv" type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); e.target.value = ''; }} />
              <label htmlFor="bulk-csv">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span><Upload className="w-4 h-4 mr-1" /> Choose CSV ({rows.length} rows)</span>
                </Button>
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-1" /> Download template
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary/50 border border-dashed rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileImage className="w-8 h-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">2. Upload product images (optional)</p>
            <p className="text-xs text-muted-foreground mb-3">
              JPEG/PNG/WebP, max 5MB each. Filename should match the CSV <code>image</code> column or product slug.
            </p>
            <input id="bulk-imgs" type="file" multiple accept={ACCEPTED_IMG.join(',')} className="hidden"
              onChange={(e) => handleImages(e.target.files)} />
            <label htmlFor="bulk-imgs">
              <Button type="button" variant="outline" size="sm" asChild>
                <span><Upload className="w-4 h-4 mr-1" /> Choose Images ({images.length})</span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <>
        {issues.length > 0 && (
          <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-3">
            <p className="text-sm font-medium flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="w-4 h-4" /> {issues.length} row(s) need fixing before import
            </p>
            <div className="max-h-48 overflow-y-auto text-xs space-y-1">
              {issues.map((i) => (
                <div key={i.row} className="flex gap-2">
                  <span className="font-mono text-muted-foreground shrink-0">Row {i.row}</span>
                  <span className="font-medium truncate max-w-[180px]">{i.name}</span>
                  <span className="text-destructive">{i.problems.join('; ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm">{rows.length - issues.length} valid · {issues.length} invalid · {images.length} image(s)</p>
          <Button onClick={run} disabled={running || issues.length > 0}>
            {running ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing {progress.done}/{progress.total}…</>
            ) : (
              <>Start import</>
            )}
          </Button>
        </div>
        </>
      )}

      {results.length > 0 && (
        <div className="border rounded-lg max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-xs">
              {r.status === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
              <span className="font-medium truncate flex-1">{r.name}</span>
              {r.error && <span className="text-destructive truncate">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkProductUpload;