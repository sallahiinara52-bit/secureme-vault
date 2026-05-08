# 🔐 Gjenerimi i APK-së të Nënshkruar (Release) dhe AAB për Google Play

Ky udhëzues ju merr nga zero deri te një **APK release** (për shpërndarje direkte)
dhe një **AAB** (Android App Bundle) për ngarkim në **Google Play Store**.

> ⚠️ Para se të filloni: duhet të keni përfunduar hapat në `ANDROID_BUILD.md`
> dhe të keni folderin **`android/`** të krijuar në projekt.

---

## 1️⃣ Krijoni Keystore (vetëm një herë!)

**Keystore** është "çelësi" juaj dixhital që nënshkruan app-in. Pa të, Google Play
nuk e pranon. **RUAJENI MIRË** — nëse e humbni, nuk mund të publikoni më update të
këtij app-i kurrë!

### Mënyra A — me Android Studio (e thjeshtë)
1. Hapni projektin: `npx cap open android`
2. Menu: **Build → Generate Signed Bundle / APK**
3. Zgjidhni **Android App Bundle** → **Next**
4. Klikoni **Create new...** te seksioni Key store path
5. Plotësoni:
   - **Key store path:** `C:\keys\securevault.jks` (ose ku doni — JASHTË projektit!)
   - **Password:** një fjalëkalim i fortë (shkruajeni në një menaxher fjalëkalimesh)
   - **Alias:** `securevault`
   - **Validity:** `25` vjet (minimumi për Play Store)
   - **Certificate:** plotësoni emrin/organizatën tuaj
6. **OK** → keystore-i u krijua

### Mënyra B — me komandë (terminal)
```bash
keytool -genkey -v -keystore securevault.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias securevault
```
Do t'ju kërkojë password dhe të dhëna identifikimi.

> 💾 **BACKUP:** Kopjojeni `securevault.jks` në Google Drive / USB / disk të jashtëm.
> Shkruani password-in në një vend të sigurt. Pa keystore + password = pa update.

---

## 2️⃣ Konfiguroni Gradle për nënshkrim automatik

Kjo ju lejon të bëni build pa rishkruar password çdo herë.

### Krijoni `android/keystore.properties`
```properties
storeFile=C:/keys/securevault.jks
storePassword=FJALEKALIMI_JUAJ
keyAlias=securevault
keyPassword=FJALEKALIMI_JUAJ
```

> ⚠️ Shtoni në `.gitignore`:
> ```
> android/keystore.properties
> *.jks
> *.keystore
> ```

### Modifikoni `android/app/build.gradle`

Te fillimi i file-it (mbi `android { ... }`):
```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Brenda `android { ... }` shtoni:
```groovy
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## 3️⃣ Rritni versionin (çdo release i ri!)

Te `android/app/build.gradle`, brenda `defaultConfig`:
```groovy
versionCode 2        // rriteni me +1 çdo herë (1, 2, 3...)
versionName "1.0.1"  // versioni që sheh përdoruesi
```

---

## 4️⃣ Build APK Release (për shpërndarje direkte / testim)

### Nga Android Studio
- Menu: **Build → Generate Signed Bundle / APK → APK → Next**
- Zgjidhni keystore-in → **release** → **Finish**
- APK-ja do të jetë në:
  `android/app/build/outputs/apk/release/app-release.apk`

### Nga terminali
```bash
cd android
./gradlew assembleRelease       # Linux/Mac
gradlew.bat assembleRelease     # Windows
```

✅ Tani mund ta instaloni APK-në direkt në çdo telefon Android.

---

## 5️⃣ Build AAB (për Google Play Store)

Google Play **kërkon AAB**, jo APK.

### Nga Android Studio
- Menu: **Build → Generate Signed Bundle / APK → Android App Bundle → Next**
- Zgjidhni keystore-in → **release** → **Finish**
- AAB-ja do të jetë në:
  `android/app/build/outputs/bundle/release/app-release.aab`

### Nga terminali
```bash
cd android
./gradlew bundleRelease         # Linux/Mac
gradlew.bat bundleRelease       # Windows
```

---

## 6️⃣ Ngarkoni në Google Play Console

1. Krijoni llogari: https://play.google.com/console (25$ një herë në jetë)
2. **Create app** → plotësoni emrin, gjuhën, kategorinë (Tools / Productivity)
3. **Production → Create new release**
4. Ngarkoni `app-release.aab`
5. Plotësoni:
   - **App content:** privacy policy, content rating, target audience
   - **Store listing:** përshkrim, screenshot (min 2), ikonë 512x512, feature graphic 1024x500
   - **Data safety:** deklaroni që të dhënat ruhen lokalisht dhe enkriptohen
6. **Send for review** → review zgjat 1–7 ditë

---

## 🐛 Probleme të zakonshme

| Problemi | Zgjidhja |
|---|---|
| `keystore was tampered with, or password was incorrect` | Password gabim — kontrolloni `keystore.properties` |
| `Execution failed for task ':app:minifyReleaseWithR8'` | Hiqni `minifyEnabled true` ose shtoni rregulla në `proguard-rules.pro` |
| Play Console: "Your app is using an old API level" | Te `build.gradle`: `targetSdkVersion 34` (ose më i ri) |
| Play Console: "App bundle was not signed" | Build-uat me `assembleDebug` — duhet `bundleRelease` |
| Sa herë rebuild-oj duhet password | Kontrolloni që `keystore.properties` ekziston dhe path është i saktë |

---

## 📝 Lista finale para publikimit

- [ ] Keystore i ruajtur në 2+ vende (cloud + USB)
- [ ] Password i shkruar në menaxher fjalëkalimesh
- [ ] `versionCode` dhe `versionName` të rritura
- [ ] Privacy Policy URL gati (kërkohet nga Play Store)
- [ ] Ikonë 512x512 PNG
- [ ] Të paktën 2 screenshot-e (1080x1920)
- [ ] Feature graphic 1024x500 PNG
- [ ] Testuar APK-në në një telefon real

---

© DS Interactive
