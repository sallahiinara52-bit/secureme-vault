import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for SecureVault Pro
 * ------------------------------------------------------------
 * This file is used ONLY when wrapping the published web app
 * into a native Android/iOS shell. Lovable does not use it.
 *
 * The `server.url` points to the published Lovable web app so
 * that any update you publish from Lovable shows up instantly
 * in the installed APK without rebuilding.
 *
 * If you prefer the app to work fully offline (bundled assets,
 * no internet required to load the UI), remove the `server`
 * block entirely and run `npx cap copy` after `npm run build`.
 */
const config: CapacitorConfig = {
  appId: "com.dsinteractive.securevaultpro",
  appName: "SecureVault Pro",
  webDir: "dist",
  server: {
    url: "https://secureme-vault.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0b0f1a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0b0f1a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
