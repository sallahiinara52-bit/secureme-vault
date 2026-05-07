import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useApp } from "./AppProvider";
import { toast } from "sonner";

export function SetupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const { realCode, decoyCode, saveCodes, signOut } = useApp();
  const [real, setReal] = useState("");
  const [decoy, setDecoy] = useState("");

  useEffect(() => {
    if (open) {
      setReal(realCode || "");
      setDecoy(decoyCode || "");
    }
  }, [open, realCode, decoyCode]);

  function save() {
    if (!/^\d{4,12}$/.test(real)) {
      toast.error("Code must be 4–12 digits");
      return;
    }
    if (decoy && decoy === real) {
      toast.error("Decoy code must differ");
      return;
    }
    saveCodes(real, decoy);
    toast.success("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("setupTitle")}</DialogTitle>
          <DialogDescription>{t("setupDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("realCode")}</Label>
            <Input inputMode="numeric" value={real} onChange={(e) => setReal(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 1234" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("decoyCode")}</Label>
            <Input inputMode="numeric" value={decoy} onChange={(e) => setDecoy(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 0000" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => signOut()}>
            {t("signOut")}
          </Button>
          <Button className="btn-grad" onClick={save}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
