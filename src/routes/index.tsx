import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "@/components/AppProvider";
import { LockScreen } from "@/components/LockScreen";
import { Vault } from "@/components/Vault";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SecureVault Pro — Hide your photos, videos & files" },
      {
        name: "description",
        content:
          "Offline encrypted vault for photos, videos and documents. AES-256 encryption. No email required.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Index,
});

function Shell() {
  const { ready, unlockKey } = useApp();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        …
      </div>
    );
  }
  return unlockKey ? <Vault /> : <LockScreen />;
}

function Index() {
  return (
    <AppProvider>
      <Shell />
      <Toaster richColors theme="dark" position="top-center" />
    </AppProvider>
  );
}
