import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Offer {
  id: string; title: string; description: string | null; discount_percent: number;
  banner_url: string | null; category_id: string | null; starts_at: string; ends_at: string | null;
  is_active: boolean;
}
interface Category { id: string; name: string }

const OffersManager = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Offer> | null>(null);
  const [open, setOpen] = useState(false);

  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Offer[];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories-light'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id,name').order('name');
      return (data as Category[]) ?? [];
    },
  });

  const save = async (off: Partial<Offer>) => {
    if (!off.title?.trim()) { toast.error('Title is required'); return; }
    const payload = {
      title: off.title.trim(),
      description: off.description?.trim() ?? null,
      discount_percent: Number(off.discount_percent ?? 0),
      banner_url: off.banner_url || null,
      category_id: off.category_id || null,
      starts_at: off.starts_at ?? new Date().toISOString(),
      ends_at: off.ends_at || null,
      is_active: off.is_active ?? true,
    };
    const { error } = off.id
      ? await supabase.from('offers').update(payload).eq('id', off.id)
      : await supabase.from('offers').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(off.id ? 'Offer updated' : 'Offer created');
    queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    setOpen(false);
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Offer deleted');
    queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
  };

  const toLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{offers.length} Offers</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ title: '', discount_percent: 10, is_active: true, starts_at: new Date().toISOString() })}>
              <Plus className="w-4 h-4 mr-1" /> New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Offer</DialogTitle></DialogHeader>
            {editing && (
              <form onSubmit={(e) => { e.preventDefault(); save(editing); }} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={120} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={500} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Discount %</Label>
                    <Input type="number" min={0} max={100} value={editing.discount_percent ?? 0} onChange={(e) => setEditing({ ...editing, discount_percent: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Category (optional)</Label>
                    <Select value={editing.category_id ?? 'none'} onValueChange={(v) => setEditing({ ...editing, category_id: v === 'none' ? null : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All categories</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Starts</Label>
                    <Input type="datetime-local" value={toLocalInput(editing.starts_at)} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                  </div>
                  <div>
                    <Label>Ends (optional)</Label>
                    <Input type="datetime-local" value={toLocalInput(editing.ends_at)} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </div>
                </div>
                <ImageUploader
                  value={editing.banner_url ?? ''}
                  onChange={(url) => setEditing({ ...editing, banner_url: url })}
                  label="Banner Image"
                  folder="offers"
                />
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No offers yet — create one to start a promotion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {offers.map((o) => (
            <div key={o.id} className="bg-card border rounded-lg p-4 flex gap-3">
              {o.banner_url ? (
                <img src={o.banner_url} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded bg-secondary flex items-center justify-center shrink-0">
                  <Tag className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{o.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{o.description}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${o.is_active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {o.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="font-bold text-primary">-{o.discount_percent}%</span>
                  {o.ends_at && <span>Ends {new Date(o.ends_at).toLocaleDateString()}</span>}
                </div>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => { setEditing(o); setOpen(true); }} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(o.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersManager;