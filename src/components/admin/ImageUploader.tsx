import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Optional folder path inside the bucket */
  folder?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Single-image uploader for the product-images bucket.
 */
const ImageUploader = ({ value, onChange, label = 'Product Image', folder = 'products' }: Props) => {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Image must be JPEG, PNG, WebP, or GIF');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5MB');
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium block mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> Upload</>}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPEG/PNG/WebP, max 5MB</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;