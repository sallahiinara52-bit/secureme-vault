import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "@/components/AppProvider";
import { CalculatorGate } from "@/components/CalculatorGate";
import { Vault } from "@/components/Vault";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculator" },
      { name: "description", content: "Simple calculator." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Index,
});

function Shell() {
  const { mode } = useApp();
  return mode === "locked" ? <CalculatorGate /> : <Vault />;
}

function Index() {
  return (
    <AppProvider>
      <Shell />
      <Toaster richColors theme="dark" position="top-center" />
    </AppProvider>
  );
}
