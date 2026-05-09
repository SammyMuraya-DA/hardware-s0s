import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle2, XCircle, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UploadResult { filename: string; matched: string | null; status: 'success' | 'failed' | 'unmatched'; error?: string }

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Drop a folder of images named `<slug>.jpg` or `<sku>.png` and the uploader
 * matches each file to a product by slug, uploads to storage, and updates
 * the product's image_url.
 */
const BulkImageUpload = () => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => ACCEPTED.includes(f.type) && f.size <= MAX_BYTES);
    if (arr.length !== list.length) {
      toast.warning(`Skipped ${list.length - arr.length} invalid file(s)`);
    }
    setFiles(arr);
    setResults([]);
  };

  const slugFromFilename = (name: string) =>
    name.replace(/\.[^.]+$/, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const run = async () => {
    if (files.length === 0) return;
    setRunning(true);
    setProgress({ done: 0, total: files.length });
    const out: UploadResult[] = [];

    // Pre-fetch products for matching
    const slugs = files.map((f) => slugFromFilename(f.name));
    const { data: products } = await supabase.from('products').select('id, slug, name').in('slug', slugs);
    const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));

    for (const file of files) {
      const slug = slugFromFilename(file.name);
      const product = bySlug.get(slug);
      if (!product) {
        out.push({ filename: file.name, matched: null, status: 'unmatched' });
        setResults([...out]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `products/${slug}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
        const { error: updErr } = await supabase.from('products').update({ image_url: pub.publicUrl }).eq('id', product.id);
        if (updErr) throw updErr;
        out.push({ filename: file.name, matched: product.name, status: 'success' });
      } catch (err) {
        out.push({ filename: file.name, matched: product.name, status: 'failed', error: err instanceof Error ? err.message : 'Unknown' });
      }
      setResults([...out]);
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    const ok = out.filter((r) => r.status === 'success').length;
    toast.success(`Bulk upload complete: ${ok} / ${out.length} matched & updated`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 border border-dashed rounded-lg p-6 text-center">
        <FileImage className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium mb-1">Bulk product image upload</p>
        <p className="text-xs text-muted-foreground mb-4">
          Name each file with the product slug (e.g. <code className="bg-background px-1 rounded">portland-cement-50kg.jpg</code>)
          to auto-match. Max 5MB per image.
        </p>
        <input
          id="bulk-files"
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label htmlFor="bulk-files">
          <Button type="button" variant="outline" size="sm" asChild>
            <span><Upload className="w-4 h-4 mr-1" /> Choose Files ({files.length} selected)</span>
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm">{files.length} file(s) ready</p>
          <Button onClick={run} disabled={running}>
            {running ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading {progress.done}/{progress.total}…</>
            ) : (
              <>Start upload</>
            )}
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <div className="border rounded-lg max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-xs">
              {r.status === 'success' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              {r.status === 'failed' && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
              {r.status === 'unmatched' && <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />}
              <span className="font-mono">{r.filename}</span>
              <span className="text-muted-foreground truncate flex-1">
                {r.status === 'unmatched' ? 'No matching product slug' : r.matched ?? ''}
              </span>
              {r.error && <span className="text-destructive truncate">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkImageUpload;