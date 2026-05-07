import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { useI18n, LANGS, Lang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { encryptBlob, decryptBlob, randomFileName } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Upload,
  FolderPlus,
  Lock,
  MoreVertical,
  Trash2,
  Download,
  Eye,
  Image as ImageIcon,
  Video,
  FileText,
  File as FileIcon,
  Settings as SettingsIcon,
  ShieldAlert,
  Globe,
  Search as SearchIcon,
} from "lucide-react";
import { AdSlot } from "./AdSlot";

type Album = { id: string; name: string; color: string };
type VFile = {
  id: string;
  name: string;
  mime: string;
  size: number;
  storage_path: string;
  iv: string;
  salt: string;
  album_id: string | null;
  created_at: string;
};

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Video;
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("doc")) return FileText;
  return FileIcon;
}

export function Vault() {
  const { session, mode, setMode, passphrase, signOut } = useApp();
  const { t, lang, setLang } = useI18n();
  const isDecoy = mode === "decoy";

  const [albums, setAlbums] = useState<Album[]>([]);
  const [files, setFiles] = useState<VFile[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [intruders, setIntruders] = useState<{ id: string; attempted_at: string }[]>([]);
  const [showIntruders, setShowIntruders] = useState(false);
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [preview, setPreview] = useState<{ file: VFile; url: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const [{ data: a }, { data: f }] = await Promise.all([
      supabase.from("albums").select("id,name,color").order("created_at", { ascending: true }),
      supabase
        .from("vault_files")
        .select("id,name,mime,size,storage_path,iv,salt,album_id,created_at,is_decoy")
        .eq("is_decoy", isDecoy)
        .order("created_at", { ascending: false }),
    ]);
    setAlbums((a as Album[]) || []);
    setFiles((f as VFile[]) || []);
    setLoading(false);
  }, [session, isDecoy]);

  useEffect(() => {
    load();
  }, [load]);

  // Hide on tab switch / minimise
  useEffect(() => {
    function onVis() {
      if (document.hidden) {
        // soft lock back to calculator after 30s in background
        setTimeout(() => {
          if (document.hidden) setMode("locked");
        }, 30_000);
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setMode]);

  // Shake to lock (desktop: Esc)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMode("locked");
    }
    let last = { x: 0, y: 0, z: 0, t: 0 };
    function onMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const now = Date.now();
      if (now - last.t < 100) return;
      const dx = (a.x || 0) - last.x;
      const dy = (a.y || 0) - last.y;
      const dz = (a.z || 0) - last.z;
      const speed = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
      last = { x: a.x || 0, y: a.y || 0, z: a.z || 0, t: now };
      if (speed > 35) setMode("locked");
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [setMode]);

  const visible = useMemo(() => {
    return files.filter((f) => {
      if (activeAlbum && f.album_id !== activeAlbum) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [files, activeAlbum, search]);

  async function handleUpload(list: FileList | null) {
    if (!list || !list.length || !session || !passphrase) return;
    setUploading(true);
    const items = Array.from(list);
    let ok = 0;
    for (const file of items) {
      try {
        const buf = await file.arrayBuffer();
        const { ciphertext, ivB64, saltB64 } = await encryptBlob(buf, passphrase);
        const path = `${session.user.id}/${randomFileName()}.enc`;
        const { error: upErr } = await supabase.storage.from("vault").upload(path, ciphertext, {
          contentType: "application/octet-stream",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("vault_files").insert({
          user_id: session.user.id,
          album_id: activeAlbum,
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          storage_path: path,
          iv: ivB64,
          salt: saltB64,
          is_decoy: isDecoy,
        });
        if (dbErr) throw dbErr;
        ok++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        toast.error(msg);
      }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} ${t("files")}`);
    load();
  }

  async function decryptFile(f: VFile): Promise<Blob | null> {
    if (!passphrase) return null;
    const { data, error } = await supabase.storage.from("vault").download(f.storage_path);
    if (error || !data) {
      toast.error(error?.message || "Download failed");
      return null;
    }
    try {
      const buf = await data.arrayBuffer();
      const plain = await decryptBlob(buf, passphrase, f.iv, f.salt);
      return new Blob([plain], { type: f.mime });
    } catch {
      toast.error("Cannot decrypt");
      return null;
    }
  }

  async function openFile(f: VFile) {
    const blob = await decryptFile(f);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setPreview({ file: f, url });
  }

  async function downloadFile(f: VFile) {
    const blob = await decryptFile(f);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function deleteFile(f: VFile) {
    if (!confirm(`${t("delete")}: ${f.name}?`)) return;
    await supabase.storage.from("vault").remove([f.storage_path]);
    await supabase.from("vault_files").delete().eq("id", f.id);
    toast.success(t("delete"));
    load();
  }

  async function createAlbum() {
    if (!session || !newAlbumName.trim()) return;
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    await supabase.from("albums").insert({ user_id: session.user.id, name: newAlbumName.trim(), color });
    setNewAlbumName("");
    setNewAlbumOpen(false);
    load();
  }

  async function loadIntruders() {
    const { data } = await supabase
      .from("intruder_logs")
      .select("id,attempted_at")
      .order("attempted_at", { ascending: false })
      .limit(50);
    setIntruders((data as { id: string; attempted_at: string }[]) || []);
    setShowIntruders(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg btn-grad flex items-center justify-center text-primary-foreground font-bold">
              S
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{t("appName")}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {isDecoy ? t("decoyVault") : t("vault")}
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1.5 mr-2 px-2 py-1 rounded-md bg-muted/60">
              <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="bg-transparent outline-none text-sm w-40"
              />
            </div>
            <Button size="icon" variant="ghost" onClick={() => fileInput.current?.click()} aria-label={t("uploadFiles")}>
              <Upload className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label={t("language")}>
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGS.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => setLang(l.code as Lang)}>
                    {l.flag} {l.label} {lang === l.code && "✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label={t("settings")}>
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={loadIntruders}>
                  <ShieldAlert className="h-4 w-4 mr-2" /> {t("intruders")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>{t("signOut")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="btn-grad" onClick={() => setMode("locked")}>
              <Lock className="h-4 w-4 mr-1.5" /> {t("lock")}
            </Button>
          </div>
        </div>
      </header>

      {/* Top AdMob banner slot */}
      <div className="max-w-5xl w-full mx-auto px-4 pt-3">
        <AdSlot position="top" />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 grid md:grid-cols-[200px_1fr] gap-5">
        {/* Albums sidebar */}
        <aside className="md:sticky md:top-20 self-start">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("albums")}
            </h2>
            <button
              onClick={() => setNewAlbumOpen(true)}
              className="h-6 w-6 rounded-md hover:bg-accent flex items-center justify-center"
              aria-label={t("newAlbum")}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveAlbum(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                !activeAlbum ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
            >
              {t("all")} <span className="text-xs text-muted-foreground">({files.length})</span>
            </button>
            {albums.map((a) => {
              const count = files.filter((f) => f.album_id === a.id).length;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveAlbum(a.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                    activeAlbum === a.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Files grid */}
        <section>
          {loading ? (
            <div className="text-center py-20 text-muted-foreground text-sm">{t("loading")}</div>
          ) : visible.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl btn-grad flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">{t("noFiles")}</p>
              <Button className="btn-grad" onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> {t("uploadFiles")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map((f) => {
                const Icon = iconFor(f.mime);
                return (
                  <div
                    key={f.id}
                    className="group glass-card rounded-xl p-3 flex flex-col gap-2 hover:-translate-y-0.5 transition"
                  >
                    <button
                      onClick={() => openFile(f)}
                      className="aspect-square rounded-lg bg-background/50 flex items-center justify-center"
                    >
                      <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition" />
                    </button>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{f.name}</div>
                        <div className="text-[10px] text-muted-foreground">{fmtSize(f.size)}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openFile(f)}>
                            <Eye className="h-4 w-4 mr-2" /> {t("open")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadFile(f)}>
                            <Download className="h-4 w-4 mr-2" /> {t("download")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteFile(f)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Bottom AdMob banner slot */}
      <div className="max-w-5xl w-full mx-auto px-4 pb-4">
        <AdSlot position="bottom" />
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl px-6 py-4 text-sm">{t("encrypting")}</div>
        </div>
      )}

      {/* New album */}
      <Dialog open={newAlbumOpen} onOpenChange={setNewAlbumOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("newAlbum")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewAlbumOpen(false)}>
              {t("cancel")}
            </Button>
            <Button className="btn-grad" onClick={createAlbum}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Intruder log */}
      <Dialog open={showIntruders} onOpenChange={setShowIntruders}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("intruders")}</DialogTitle>
          </DialogHeader>
          {intruders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noIntruders")}</p>
          ) : (
            <ul className="text-sm space-y-1 max-h-72 overflow-auto">
              {intruders.map((i) => (
                <li key={i.id} className="flex items-center justify-between border-b border-border/40 py-1.5">
                  <span className="text-muted-foreground">{new Date(i.attempted_at).toLocaleString()}</span>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o && preview) {
            URL.revokeObjectURL(preview.url);
            setPreview(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.file.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="w-full max-h-[70vh] overflow-auto flex items-center justify-center bg-background/50 rounded-lg">
              {preview.file.mime.startsWith("image/") && (
                <img src={preview.url} alt={preview.file.name} className="max-w-full max-h-[70vh]" />
              )}
              {preview.file.mime.startsWith("video/") && (
                <video src={preview.url} controls className="max-w-full max-h-[70vh]" />
              )}
              {preview.file.mime.startsWith("audio/") && <audio src={preview.url} controls />}
              {!preview.file.mime.startsWith("image/") &&
                !preview.file.mime.startsWith("video/") &&
                !preview.file.mime.startsWith("audio/") && (
                  <iframe src={preview.url} className="w-full h-[70vh]" title={preview.file.name} />
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => preview && downloadFile(preview.file)}>
              <Download className="h-4 w-4 mr-2" /> {t("download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
