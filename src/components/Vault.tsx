import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { useI18n, LANGS, Lang } from "@/lib/i18n";
import {
  AlbumRow,
  FileRow,
  IntruderRow,
  createAlbum,
  decryptFile,
  deleteAlbum,
  deleteFileRow,
  destroyVault,
  encryptFile,
  listAlbums,
  listFiles,
  listIntruders,
  saveFile,
  changePassword,
  unlockVault,
  updateFileAlbum,
} from "@/lib/vault-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  KeyRound,
  Share2,
  Play,
} from "lucide-react";
import { AdSlot } from "./AdSlot";

// In-memory thumbnail cache: id -> object URL of decrypted blob
const thumbCache = new Map<string, string>();

function Thumbnail({ file, unlockKey, onOpen }: { file: FileRow; unlockKey: CryptoKey; onOpen: () => void }) {
  const isImg = file.mime.startsWith("image/");
  const isVid = file.mime.startsWith("video/");
  const [url, setUrl] = useState<string | null>(() => thumbCache.get(file.id) ?? null);
  const Icon = iconFor(file.mime);

  useEffect(() => {
    if (!isImg && !isVid) return;
    if (thumbCache.has(file.id)) {
      setUrl(thumbCache.get(file.id)!);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const blob = await decryptFile(unlockKey, file);
        const u = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        thumbCache.set(file.id, u);
        setUrl(u);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, unlockKey, isImg, isVid]);

  return (
    <button
      onClick={onOpen}
      className="aspect-square rounded-lg bg-background/50 flex items-center justify-center overflow-hidden relative"
    >
      {isImg && url ? (
        <img src={url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
      ) : isVid && url ? (
        <>
          <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-8 w-8 text-white drop-shadow" fill="currentColor" />
          </div>
        </>
      ) : (
        <Icon className="h-8 w-8 text-muted-foreground" />
      )}
    </button>
  );
}

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
  const { unlockKey, lock, autoLockMinutes, setAutoLockMinutes, setHasVault, setUnlockKey } = useApp();
  const { t, lang, setLang } = useI18n();

  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [intruders, setIntruders] = useState<IntruderRow[]>([]);
  const [showIntruders, setShowIntruders] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FileRow | null>(null);
  const [confirmAlbumDelete, setConfirmAlbumDelete] = useState<AlbumRow | null>(null);
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [preview, setPreview] = useState<{ file: FileRow; url: string } | null>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const [pendingMins, setPendingMins] = useState(autoLockMinutes);
  useEffect(() => setPendingMins(autoLockMinutes), [autoLockMinutes]);

  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, f] = await Promise.all([listAlbums(), listFiles()]);
    setAlbums(a);
    setFiles(f);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    return files.filter((f) => {
      if (activeAlbum && f.albumId !== activeAlbum) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [files, activeAlbum, search]);

  async function handleUpload(list: FileList | null) {
    if (!list || !list.length || !unlockKey) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(list)) {
      try {
        const row = await encryptFile(unlockKey, file);
        row.albumId = activeAlbum;
        await saveFile(row);
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

  async function openFile(f: FileRow) {
    if (!unlockKey) return;
    try {
      const blob = await decryptFile(unlockKey, f);
      const url = URL.createObjectURL(blob);
      setPreview({ file: f, url });
    } catch {
      toast.error("Cannot decrypt");
    }
  }

  async function downloadFile(f: FileRow) {
    if (!unlockKey) return;
    try {
      const blob = await decryptFile(unlockKey, f);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Cannot decrypt");
    }
  }

  async function doDeleteFile() {
    if (!confirmDelete) return;
    await deleteFileRow(confirmDelete.id);
    setConfirmDelete(null);
    toast.success(t("delete"));
    load();
  }

  async function doDeleteAlbum() {
    if (!confirmAlbumDelete) return;
    // unset album_id on contained files
    const inAlbum = files.filter((f) => f.albumId === confirmAlbumDelete.id);
    for (const f of inAlbum) await updateFileAlbum(f.id, null);
    await deleteAlbum(confirmAlbumDelete.id);
    if (activeAlbum === confirmAlbumDelete.id) setActiveAlbum(null);
    setConfirmAlbumDelete(null);
    load();
  }

  async function doCreateAlbum() {
    if (!newAlbumName.trim()) return;
    await createAlbum(newAlbumName.trim());
    setNewAlbumName("");
    setNewAlbumOpen(false);
    load();
  }

  async function loadIntruders() {
    setIntruders(await listIntruders());
    setShowIntruders(true);
  }

  async function doChangePwd() {
    if (newPwd.length < 4) return toast.error("Min 4 chars");
    if (newPwd !== newPwd2) return toast.error("Passwords do not match");
    setPwdBusy(true);
    try {
      // Verify old password first
      const ok = await unlockVault(oldPwd);
      if (!ok) {
        toast.error(t("wrongCode"));
        return;
      }
      const success = await changePassword(oldPwd, newPwd);
      if (success) {
        toast.success("Password changed");
        setShowChangePwd(false);
        setOldPwd("");
        setNewPwd("");
        setNewPwd2("");
        // Re-derive key for current session
        const newKey = await unlockVault(newPwd);
        if (newKey) setUnlockKey(newKey);
      }
    } finally {
      setPwdBusy(false);
    }
  }

  async function doReset() {
    await destroyVault();
    setConfirmReset(false);
    setShowSettings(false);
    setHasVault(false);
    setUnlockKey(null);
    toast.success("Vault destroyed");
  }

  async function saveSettings() {
    await setAutoLockMinutes(pendingMins);
    setShowSettings(false);
    toast.success(t("save"));
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
                {t("vault")}
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
            <Button size="icon" variant="ghost" onClick={() => setShowSettings(true)} aria-label={t("settings")}>
              <SettingsIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" className="btn-grad" onClick={() => setConfirmLock(true)}>
              <Lock className="h-4 w-4 mr-1.5" /> {t("lock")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl w-full mx-auto px-4 pt-3">
        <AdSlot position="top" />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 grid md:grid-cols-[200px_1fr] gap-5">
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
              const count = files.filter((f) => f.albumId === a.id).length;
              return (
                <div key={a.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setActiveAlbum(a.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      activeAlbum === a.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </button>
                  <button
                    onClick={() => setConfirmAlbumDelete(a)}
                    className="h-6 w-6 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    aria-label="Delete album"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

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
                          {albums.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              {albums.map((a) => (
                                <DropdownMenuItem
                                  key={a.id}
                                  onClick={async () => {
                                    await updateFileAlbum(f.id, a.id);
                                    load();
                                  }}
                                >
                                  <span
                                    className="h-2 w-2 rounded-full mr-2"
                                    style={{ backgroundColor: a.color }}
                                  />{" "}
                                  {a.name}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setConfirmDelete(f)} className="text-destructive">
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

      <div className="max-w-5xl w-full mx-auto px-4 pb-4">
        <AdSlot position="bottom" />
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleUpload(e.target.files);
          if (fileInput.current) fileInput.current.value = "";
        }}
      />

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl px-6 py-4 text-sm">{t("encrypting")}</div>
        </div>
      )}

      {/* Settings */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings")}</DialogTitle>
            <DialogDescription>Security & privacy</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Auto-lock</Label>
                <span className="text-sm font-medium tabular-nums">{pendingMins} min</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[pendingMins]}
                onValueChange={(v) => setPendingMins(v[0])}
              />
              <p className="text-[11px] text-muted-foreground">
                Vault locks after {pendingMins} minute{pendingMins > 1 ? "s" : ""} of inactivity or background.
              </p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowChangePwd(true)}>
                <KeyRound className="h-4 w-4 mr-2" /> {t("changeCode")}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={loadIntruders}>
                <ShieldAlert className="h-4 w-4 mr-2" /> {t("intruders")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Erase vault
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSettings(false)}>
              {t("cancel")}
            </Button>
            <Button className="btn-grad" onClick={saveSettings}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password */}
      <Dialog open={showChangePwd} onOpenChange={setShowChangePwd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("changeCode")}</DialogTitle>
            <DialogDescription>All files will be re-encrypted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowChangePwd(false)}>
              {t("cancel")}
            </Button>
            <Button className="btn-grad" onClick={doChangePwd} disabled={pwdBusy}>
              {pwdBusy ? "…" : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Intruders */}
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
                <li
                  key={i.id}
                  className="flex items-center justify-between border-b border-border/40 py-1.5"
                >
                  <span className="text-muted-foreground">
                    {new Date(i.attemptedAt).toLocaleString()}
                  </span>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* New album */}
      <Dialog open={newAlbumOpen} onOpenChange={setNewAlbumOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("newAlbum")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewAlbumOpen(false)}>
              {t("cancel")}
            </Button>
            <Button className="btn-grad" onClick={doCreateAlbum}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: lock now */}
      <AlertDialog open={confirmLock} onOpenChange={setConfirmLock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lock")}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to enter your password again to unlock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => lock()}>{t("lock")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: delete file */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete")} {confirmDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDeleteFile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: delete album */}
      <AlertDialog
        open={!!confirmAlbumDelete}
        onOpenChange={(o) => !o && setConfirmAlbumDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete")} "{confirmAlbumDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Files in this album will not be deleted, only moved to "All".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDeleteAlbum}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: reset */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erase entire vault?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes ALL files, albums and the password. There is no recovery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={doReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Erase everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
