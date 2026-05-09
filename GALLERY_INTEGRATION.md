# Heqja & Rikthimi nga Galeria e Telefonit (Android nativ)

Heqja automatike e fotos/videos nga galeria e telefonit kur importohet në
SecureVault Pro **NUK mund të bëhet nga web (Lovable preview)**. Browser-i
nuk ka qasje në MediaStore të Android-it. Kjo punë bëhet **vetëm pas
eksportimit në Capacitor + Android Studio**.

## Hapat (në projektin Android lokal)

### 1) Instalo plugin-et
```bash
npm install @capacitor/share @capacitor/filesystem
npx cap sync android
```

### 2) Share (WhatsApp, Email, etj.) — TANI tashmë funksionon
Aplikacioni përdor `navigator.share()` që në Capacitor 5+ shkon automatikisht
te dialog-u nativ Android i ndarjes (WhatsApp, Gmail, Telegram, etj.).
Asnjë kod shtesë nuk nevojitet — vetëm sigurohu që APK është build-uar.

### 3) Heqja nga galeria (delete from MediaStore)
Për këtë duhet plugin nativ. Opsionet:

**a) `@capacitor-community/media`** (rekomandohet)
```bash
npm install @capacitor-community/media
npx cap sync android
```

Pastaj në `src/components/Vault.tsx`, te funksioni `handleUpload`, pas
`saveFile(row)` shto:

```ts
import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform() && file instanceof File) {
  // Hap MediaStore me URI dhe fshije origjinalin
  // (kërkon AndroidManifest.xml: READ_MEDIA_IMAGES, READ_MEDIA_VIDEO,
  //  WRITE_EXTERNAL_STORAGE për Android <= 10)
  await Media.deletePhoto({ identifier: file.name });
}
```

**b) Plugin custom** — më i sigurt për Android 11+:
Krijo `android/app/src/main/java/.../MediaPlugin.java` që përdor
`MediaStore.createDeleteRequest()` (Android Q+) për të kërkuar konfirmim
nga përdoruesi përpara fshirjes.

### 4) Rikthimi në galeri kur fshihet nga vault-i
Te `doDeleteFile()` shto:

```ts
import { Filesystem, Directory } from '@capacitor/filesystem';

if (Capacitor.isNativePlatform()) {
  const blob = await decryptFile(unlockKey, confirmDelete);
  const arrayBuf = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
  await Filesystem.writeFile({
    path: `Pictures/SecureVault/${confirmDelete.name}`,
    data: base64,
    directory: Directory.ExternalStorage,
    recursive: true,
  });
}
```

Kjo e shkruan file-in përsëri në `/storage/emulated/0/Pictures/SecureVault/`
ku galeria e Android-it e gjen automatikisht.

### 5) Permissions në `AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />
```

## Pse kjo nuk bëhet në Lovable preview
- Web browser nuk mund të modifikojë galerinë e telefonit (sandbox-i i web-it).
- `navigator.share()` punon në web vetëm për linke/tekst — për file kërkon HTTPS + Web Share API Level 2 (i kufizuar në Android Chrome).
- Në APK-në Capacitor, `navigator.share` automatikisht përdor Android Intent
  nativ → mund të ndash në WhatsApp/Email/Telegram/etj.

## Përfundim
- ✅ Thumbnails reale + Share button → **tashmë në kod** (punon në APK).
- ⚙️ Heqja/rikthimi nga galeria → **shto plugin-et e mësipërme në Android Studio**.
