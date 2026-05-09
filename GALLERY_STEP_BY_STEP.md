# 📱 Heqja & Rikthimi nga Galeria — Udhëzues për Fillestarë

Ky udhëzues është për ty që **kurrë nuk ke bërë Capacitor / Android Studio**.
Do të ndjekim çdo hap me kujdes. Mos ki frikë — nëse diçka prishet,
gjithmonë mund të fshish folderin `android/` dhe të fillosh nga zero.

> ⚠️ **Para se të fillosh** duhet të kesh përfunduar `ANDROID_BUILD.md`:
> - Node.js i instaluar
> - Android Studio i instaluar
> - Projekti i shkarkuar nga GitHub në kompjuterin tënd
> - Komanda `npx cap add android` ka krijuar folderin `android/`

---

## 🎯 Çfarë do të bëjmë (përmbledhje)

1. Instalojmë 3 plugin-e Capacitor (komanda në terminal)
2. Sinkronizojmë me Android (1 komandë)
3. Shtojmë permissions në një file XML (kopjo-ngjit)
4. Modifikojmë `Vault.tsx` (kopjo-ngjit blloqe kodi)
5. Rebuild APK në Android Studio

Koha totale: **20–30 minuta**.

---

## HAPI 1️⃣ — Instalo plugin-et

Hap **terminal/CMD** brenda folderit të projektit (atje ku është `package.json`):

```bash
npm install @capacitor/share @capacitor/filesystem @capacitor-community/media
```

Pastaj sinkronizo me Android:

```bash
npx cap sync android
```

Kjo komandë kopjon plugin-et e reja brenda folderit `android/`.
**Sa herë** instalon një plugin të ri, duhet të rinisësh `npx cap sync android`.

✅ Kontrollo: Nuk duhet të dalin gabime të kuqe. Mund të dalin disa
"warnings" (të verdha) — ato janë normale.

---

## HAPI 2️⃣ — Shto permissions në AndroidManifest.xml

Hap me Notepad/VSCode këtë file:

```
android/app/src/main/AndroidManifest.xml
```

Do gjesh diçka të tillë në fillim:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application ...>
```

**Mes** rreshtit `<manifest ...>` dhe `<application ...>`, ngjit këto rreshta:

```xml
    <!-- Leximi i fotove/videove nga galeria (Android 13+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

    <!-- Leximi nga storage (Android 12 e poshtë) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <!-- Shkrimi për të rikthyer file në galeri (Android 10 e poshtë) -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="29" />
```

Ruaj file-in (Ctrl+S).

---

## HAPI 3️⃣ — Modifiko `src/components/Vault.tsx`

Tani do shtosh kodin që:
- **Fshin** automatikisht foton nga galeria kur e importon në vault
- **Rikthen** foton në galeri kur e fshin nga vault-i

### 3a) Shto import-et

Në krye të file-it `src/components/Vault.tsx`, atje ku janë import-et e tjera, shto:

```ts
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Media } from "@capacitor-community/media";
```

### 3b) Fshi nga galeria pas import-it

Gjej funksionin `handleUpload` (ose ai që thërret `saveFile(row)`).
**Menjëherë pas** rreshtit `await saveFile(row);` shto:

```ts
// Heqe origjinalin nga galeria e telefonit (vetëm në Android nativ)
if (Capacitor.isNativePlatform()) {
  try {
    await Media.deletePhoto({ identifier: file.name });
  } catch (e) {
    console.warn("Nuk u hoq nga galeria:", e);
    // Përdoruesi mund të refuzojë konfirmimin — kjo është normale
  }
}
```

### 3c) Rikthe në galeri kur fshin nga vault-i

Gjej funksionin `doDeleteFile` (ai që thërret `deleteFileRow`).
**Para** rreshtit `await deleteFileRow(...)` shto:

```ts
// Rikthe file-in në galerinë e telefonit (vetëm në Android nativ)
if (Capacitor.isNativePlatform() && unlockKey) {
  try {
    const blob = await decryptFile(unlockKey, confirmDelete);
    const arrayBuf = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    await Filesystem.writeFile({
      path: `Pictures/SecureVault/${confirmDelete.name}`,
      data: base64,
      directory: Directory.ExternalStorage,
      recursive: true,
    });
  } catch (e) {
    console.warn("Nuk u rikthye në galeri:", e);
  }
}
```

> 💡 **Shënim:** `unlockKey` dhe `confirmDelete` janë emrat që përdor kodi
> ekzistues. Nëse emrat ndryshojnë në file-in tënd, përshtati.

Ruaj file-in.

---

## HAPI 4️⃣ — Rebuild dhe sinko

Në terminal, brenda projektit:

```bash
npm run build
npx cap sync android
```

- `npm run build` → kompilon kodin React në `dist/`
- `npx cap sync android` → kopjon `dist/` brenda `android/` dhe përditëson plugin-et

---

## HAPI 5️⃣ — Hap Android Studio dhe build APK

```bash
npx cap open android
```

Në Android Studio:

1. **Prit** Gradle Sync (poshtë-djathtas, 1–3 min)
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Kur mbaron, klikon **locate** për ta gjetur APK-në
4. Kopjo APK-në në telefon dhe instaloje

---

## HAPI 6️⃣ — Testo në telefon

Hape app-in në telefon. Hera e parë:

1. Hap vault-in me password
2. Klik **+** për të shtuar foto
3. Zgjidh një foto nga galeria
4. Android do **kërkojë leje** për Media — kliko **Allow**
5. Foto-ja shfaqet brenda vault-it ✅
6. Hape galerinë e telefonit → foto-ja **NUK është më aty** ✅
7. Kthehu te vault-i → fshi foton (3 pikat → Delete)
8. Hape galerinë → foto-ja është **përsëri aty** në album "SecureVault" ✅

---

## ❓ Probleme të zakonshme

| Problemi | Zgjidhja |
|---|---|
| `Cannot find module '@capacitor-community/media'` | Harrove `npx cap sync android` pas install |
| App-i bie kur shtypet **+** | Mungojnë permissions në AndroidManifest.xml |
| Foto nuk fshihet nga galeria (Android 11+) | Android kërkon konfirmim — përdoruesi duhet të klikojë **Allow** në dialog |
| Foto nuk rikthehet | Hap **Files app → Pictures → SecureVault** — duhet të jetë aty. Galeria mund të kërkojë 1 minutë për refresh |
| `Permission denied` në Android 13+ | App-i duhet të kërkojë leje në runtime — Android Studio → run → kontrollo Logcat |

---

## 🔄 Kur të bësh ndryshime në kod

Sa herë modifikon kodin React në Lovable:

```bash
git pull                  # merr ndryshimet nga Lovable
npm run build             # kompilo
npx cap sync android      # kopjo në Android
```

Pastaj hap përsëri Android Studio dhe rebuild APK.

---

## 📞 Nëse ngec

1. Hap **Logcat** në Android Studio (View → Tool Windows → Logcat)
2. Filtro me `SecureVault` ose `Capacitor`
3. Kopjo gabimin e kuq dhe pyet në Lovable Chat

---

© DS Interactive — SecureVault Pro
