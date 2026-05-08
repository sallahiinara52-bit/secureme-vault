import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SecureVault Pro" },
      {
        name: "description",
        content:
          "Privacy Policy for SecureVault Pro by DS Interactive. We do not collect personal data — everything is stored locally on your device with AES-256 encryption.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="glass-card rounded-3xl p-6 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl btn-grad flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">
                Effective date: May 8, 2026 · DS Interactive
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-5 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground">
                SecureVault Pro ("the App", "we", "us") is developed by DS Interactive. This
                Privacy Policy explains how the App handles your information. The App is designed
                with a privacy-first, offline-first architecture. <strong>We do not collect, store,
                or transmit any personal data to our servers.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Data We Collect</h2>
              <p className="text-muted-foreground">
                <strong>None.</strong> The App does not require an account, email address, phone
                number, or any other identifier. All photos, videos, and files you add to the vault
                are stored exclusively on your device using the browser's IndexedDB and encrypted
                with AES-256-GCM. Your password is never stored — only a derived verifier is kept
                locally to validate unlock attempts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Local Storage & Encryption</h2>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>All vault content is encrypted on your device before being saved.</li>
                <li>Encryption: AES-256-GCM with PBKDF2 (250,000 iterations).</li>
                <li>The encryption key is derived from your password and never leaves your device.</li>
                <li>Failed unlock attempts are logged locally for your awareness only.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Permissions</h2>
              <p className="text-muted-foreground">
                The App may request permission to access your photo library, camera, or files —
                <strong> only when you explicitly choose to import content into the vault.</strong>
                Imported files are copied into the encrypted local storage and are not uploaded
                anywhere.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Advertising</h2>
              <p className="text-muted-foreground">
                The App may display advertisements via Google AdMob. AdMob may collect device
                identifiers (e.g., advertising ID) to show relevant ads. Please review Google's
                privacy policy at{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  policies.google.com/privacy
                </a>
                . You can opt out of personalized ads in your device settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Children's Privacy</h2>
              <p className="text-muted-foreground">
                The App is not directed to children under 13. We do not knowingly collect data from
                children.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Data Loss</h2>
              <p className="text-muted-foreground">
                Because the App is fully offline and your password is never transmitted,
                <strong> we cannot recover your password or your encrypted data</strong> if you
                forget your password or uninstall the App. Please remember your password and back up
                important files separately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. The latest version will always
                be available at this URL.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
              <p className="text-muted-foreground">
                For any privacy-related questions, contact DS Interactive at:{" "}
                <a
                  href="mailto:dsinteractive.support@gmail.com"
                  className="text-primary hover:underline"
                >
                  dsinteractive.support@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service →
            </Link>
            <span>© {new Date().getFullYear()} DS Interactive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
