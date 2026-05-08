# 📱 Si të krijoni APK Android për SecureVault Pro

Lovable ndërton vetëm aplikacione web. Për të marrë një APK të vërtetë Android,
duhet ta "mbështillni" projektin me **Capacitor** në kompjuterin tuaj.

## ✅ Çfarë ju duhet
- **Node.js** (versioni 18+)
- **Android Studio** (i instaluar) — https://developer.android.com/studio
- **Git**

## 🚀 Hapat (5–10 minuta)

### 1. Shkarkoni kodin
Klikoni butonin **GitHub → Connect** lart-djathtas në Lovable, eksportoni
projektin në GitHub-in tuaj, pastaj në kompjuter:

```bash
git clone https://github.com/USERI_JUAJ/REPO.git
cd REPO
npm install
```

### 2. Instaloni Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 3. Inicializoni Android-in
Skedari `capacitor.config.ts` është i gatshëm në projekt. Vetëm ekzekutoni:
```bash
npx cap add android
```
Kjo krijon folderin **`android/`** në projekt.

### 4. Hapeni në Android Studio
```bash
npx cap open android
```

Në Android Studio:
1. Prisni të mbarojnë Gradle sync (1–3 min herën e parë)
2. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK-ja do të jetë në: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Instaloni në telefon
- Kaloni APK-në në telefon (USB, Drive, etj.)
- Hapeni dhe lejoni instalimin nga burime të panjohura

## 🔄 Përditësime
Sa herë që publikoni ndryshime në Lovable, app-i në telefon i merr **automatikisht**
sepse `capacitor.config.ts` përdor `server.url` që pikon te app-i juaj i publikuar.

## 📦 Për Google Play Store
Duhet të krijoni një **Signed Bundle (.aab)**:
1. Android Studio → **Build → Generate Signed Bundle**
2. Zgjidhni **Android App Bundle**
3. Krijoni një **keystore** të ri (ruajeni mirë!)
4. Ngarkoni `.aab` te Play Console

## 🎨 Ikona dhe splash screen
Vendosni ikonat e ja në `android/app/src/main/res/` ose përdorni:
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

## 📺 AdMob (reklamat)
Slot-et `admob-banner-slot-top` dhe `admob-banner-slot-bottom` janë gati në UI.
Për t'i lidhur me AdMob real:
```bash
npm install @capacitor-community/admob
```
Dhe ndiqni: https://github.com/capacitor-community/admob

---
© DS Interactive
