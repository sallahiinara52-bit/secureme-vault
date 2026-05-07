import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "@/components/AppProvider";
import { LoginScreen } from "@/components/LoginScreen";
import { Vault } from "@/components/Vault";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SecureVault Pro — Hide your photos, videos & files" },
      {
        name: "description",
        content:
          "Private encrypted vault for photos, videos and documents. AES-256 encryption. Multi-language.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Index,
});

function Shell() {
  const { session, loading, passphrase, setPassphrase } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        …
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  // Once logged in, derive an encryption passphrase from the user id.
  // (RLS + Storage policies still scope all access to this user.)
  if (!passphrase) {
    setPassphrase(`svp:${session.user.id}`);
    return null;
  }

  return <Vault />;
}

function Index() {
  return (
    <AppProvider>
      <Shell />
      <Toaster richColors theme="dark" position="top-center" />
    </AppProvider>
  );
}
