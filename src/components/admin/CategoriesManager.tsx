import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Category { id: string; name: string; slug: string; icon: string | null; sort_order: number; is_active: boolean }

const CategoriesManager = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [open, setOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      return data as Category[];
    },
  });

  const save = async (cat: Partial<Category>) => {
    if (!cat.name?.trim()) { toast.error('Name is required'); return; }
    const payload = {
      name: cat.name.trim(),
      slug: cat.slug?.trim() || slugify(cat.name),
      icon: cat.icon || '📦',
      sort_order: Number(cat.sort_order ?? 0),
      is_active: cat.is_active ?? true,
    };
    const { error } = cat.id
      ? await supabase.from('categories').update(payload).eq('id', cat.id)
      : await supabase.from('categories').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(cat.id ? 'Category updated' : 'Category added');
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    setOpen(false);
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category? Existing products will keep their category text.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Category deleted');
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{categories.length} Categories</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ name: '', icon: '📦', sort_order: categories.length, is_active: true })}>
              <Plus className="w-4 h-4 mr-1" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Category</DialogTitle></DialogHeader>
            {editing && (
              <form onSubmit={(e) => { e.preventDefault(); save(editing); }} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={80} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Icon (emoji)</Label>
                    <Input value={editing.icon ?? ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} maxLength={4} />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                  </div>
                </div>
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
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3">Icon</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Order</th>
                <th className="text-left p-3">Active</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t hover:bg-secondary/30">
                  <td className="p-3 text-xl">{c.icon}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                  <td className="p-3">{c.sort_order}</td>
                  <td className="p-3"><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} /></td>
                  <td className="p-3 flex gap-1 justify-end">
                    <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;