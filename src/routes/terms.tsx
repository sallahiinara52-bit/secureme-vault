import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SecureVault Pro" },
      {
        name: "description",
        content:
          "Terms of Service for SecureVault Pro by DS Interactive. Read the conditions of using our offline encrypted vault application.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">
                Effective date: May 8, 2026 · DS Interactive
              </p>
            </div>
          </div>

          <div className="space-y-5 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance</h2>
              <p className="text-muted-foreground">
                By installing or using SecureVault Pro ("the App"), you agree to these Terms of
                Service. If you do not agree, do not use the App.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. License</h2>
              <p className="text-muted-foreground">
                DS Interactive grants you a personal, non-exclusive, non-transferable, revocable
                license to use the App on devices you own, subject to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Acceptable Use</h2>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>You must not use the App for any unlawful purpose.</li>
                <li>You must not store illegal content of any kind in the vault.</li>
                <li>You must not reverse engineer, decompile, or attempt to break the encryption.</li>
                <li>You are solely responsible for the content you add to the vault.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Password & Data Loss</h2>
              <p className="text-muted-foreground">
                The App uses end-to-end encryption with a password only you know. <strong>If you
                forget your password, your data cannot be recovered.</strong> DS Interactive has no
                ability to reset, bypass, or restore lost data. You accept full responsibility for
                remembering your password and maintaining backups of important files.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. No Warranty</h2>
              <p className="text-muted-foreground">
                The App is provided <strong>"AS IS"</strong> without warranty of any kind, express
                or implied, including but not limited to warranties of merchantability, fitness for
                a particular purpose, or non-infringement. While we use industry-standard
                encryption, no security system is 100% impenetrable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, DS Interactive shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including loss
                of data, arising from your use of the App.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Advertising</h2>
              <p className="text-muted-foreground">
                The App may display third-party advertisements (e.g., Google AdMob). We are not
                responsible for the content of third-party ads.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Termination</h2>
              <p className="text-muted-foreground">
                You may stop using the App at any time by uninstalling it. We may discontinue or
                modify the App at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Changes</h2>
              <p className="text-muted-foreground">
                We may update these Terms. Continued use of the App after changes means you accept
                the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of the jurisdiction in which DS Interactive
                operates, without regard to conflict-of-law principles.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
              <p className="text-muted-foreground">
                Questions about these Terms? Contact:{" "}
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
            <Link to="/privacy" className="hover:text-foreground">
              ← Privacy Policy
            </Link>
            <span>© {new Date().getFullYear()} DS Interactive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
