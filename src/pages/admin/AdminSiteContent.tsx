import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Upload, Loader2, Save, Image, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface SiteContentItem {
  id: string;
  key: string;
  label: string;
  section: string;
  value: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

const sectionLabels: Record<string, string> = {
  navbar: "🧭 Navigation Bar",
  hero: "🏠 Hero Section",
  homepage: "📄 Homepage Sections",
  general: "⚙️ General",
};

export default function AdminSiteContent() {
  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_content")
      .select("*")
      .order("section")
      .order("display_order");
    setItems((data as SiteContentItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaveValue = async (item: SiteContentItem) => {
    setSavingId(item.id);
    const { error } = await supabase
      .from("site_content")
      .update({ value: editValue })
      .eq("id", item.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: `"${item.label}" updated` });
    setEditingId(null);
    load();
  };

  const handleImageUpload = async (file: File, itemId: string) => {
    setUploadingId(itemId);
    const ext = file.name.split(".").pop();
    const path = `site/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("site_content")
      .update({ image_url: urlData.publicUrl })
      .eq("id", itemId);
    setUploadingId(null);
    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      return;
    }
    toast({ title: "Image uploaded", description: "Content updated" });
    load();
  };

  const grouped = items.reduce<Record<string, SiteContentItem[]>>((acc, item) => {
    (acc[item.section] = acc[item.section] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-primary" />
        <h2 className="font-heading text-xl font-bold">Site Content Manager</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Edit homepage text, images, logo and other site-wide content. Changes sync to the live website immediately.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        Object.entries(grouped).map(([section, sectionItems]) => (
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-bold text-lg border-b border-border pb-2">
              {sectionLabels[section] || section}
            </h3>
            <div className="grid gap-4">
              {sectionItems.map((item) => (
                <div key={item.id} className="glass-card p-4 border border-border/50 hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-heading font-semibold text-sm text-foreground">{item.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded">{item.key}</span>
                      </div>

                      {/* Text value editing */}
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          {(item.value?.length || 0) > 80 ? (
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              rows={3}
                              className="flex-1 text-sm"
                            />
                          ) : (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 text-sm"
                            />
                          )}
                          <Button size="sm" onClick={() => handleSaveValue(item)} disabled={savingId === item.id}>
                            {savingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {item.value || <span className="italic text-muted-foreground/50">No text set</span>}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => { setEditingId(item.id); setEditValue(item.value || ""); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Image */}
                      <div className="mt-3 flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-20 h-14 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="w-20 h-14 rounded-lg bg-surface-2 flex items-center justify-center">
                            <Image className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={uploadingId === item.id}
                          onClick={() => {
                            setUploadTargetId(item.id);
                            imageInputRef.current?.click();
                          }}
                        >
                          {uploadingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          {uploadingId === item.id ? "Uploading..." : item.image_url ? "Replace Image" : "Upload Image"}
                        </Button>
                        {item.image_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive text-xs"
                            onClick={async () => {
                              await supabase.from("site_content").update({ image_url: null }).eq("id", item.id);
                              toast({ title: "Image removed" });
                              load();
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTargetId) {
            handleImageUpload(file, uploadTargetId);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}