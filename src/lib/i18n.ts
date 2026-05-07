import { createContext, useContext } from "react";

export type Lang = "en" | "sq" | "es" | "de" | "fr" | "it" | "tr" | "ar";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sq", label: "Shqip", flag: "🇦🇱" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

type Dict = Record<string, string>;
type PartialDict = Partial<Dict>;

const en: Dict = {
  appName: "SecureVault Pro",
  tagline: "Calculator on the outside. Vault on the inside.",
  setup: "Setup",
  setupTitle: "Welcome — Set up your vault",
  setupDesc: "Pick a secret code. Type it in the calculator + '=' to unlock.",
  email: "Email",
  password: "Password",
  realCode: "Secret code",
  decoyCode: "Decoy code (optional)",
  language: "Language",
  create: "Create vault",
  signIn: "Sign in",
  signUp: "Sign up",
  alreadyHave: "Already have an account?",
  noAccount: "No account yet?",
  vault: "Vault",
  decoyVault: "Decoy Vault",
  uploadFiles: "Upload files",
  encrypting: "Encrypting…",
  decrypting: "Decrypting…",
  noFiles: "Your vault is empty. Upload files to get started.",
  albums: "Albums",
  newAlbum: "New album",
  all: "All",
  delete: "Delete",
  download: "Download",
  open: "Open",
  close: "Close",
  lock: "Lock",
  settings: "Settings",
  signOut: "Sign out",
  changeCode: "Change codes",
  intruders: "Intruder log",
  noIntruders: "No failed attempts.",
  shake: "Shake to lock",
  hideOnBlur: "Hide content on tab switch",
  wrongCode: "Wrong code",
  attempts: "Failed attempts will be logged.",
  cancel: "Cancel",
  save: "Save",
  name: "Name",
  size: "Size",
  type: "Type",
  date: "Date",
  files: "files",
  loading: "Loading…",
  search: "Search",
  pickAlbum: "Pick album",
  none: "None",
  setupHint: "Tap the small dot at the bottom-right of the calculator anytime to open setup.",
};

const sq: Dict = {
  appName: "SecureVault Pro",
  tagline: "Kalkulator nga jashtë. Kasafortë nga brenda.",
  setup: "Konfigurim",
  setupTitle: "Mirësevjen — Konfiguro kasafortën",
  setupDesc: "Zgjidh një kod sekret. Shkruaje në kalkulator dhe shtyp '=' për ta hapur.",
  email: "Email",
  password: "Fjalëkalimi",
  realCode: "Kodi sekret",
  decoyCode: "Kodi fallco (opsional)",
  language: "Gjuha",
  create: "Krijo kasafortën",
  signIn: "Hyr",
  signUp: "Regjistrohu",
  alreadyHave: "Ke llogari?",
  noAccount: "Nuk ke llogari?",
  vault: "Kasaforta",
  decoyVault: "Kasaforta Fallco",
  uploadFiles: "Ngarko skedarë",
  encrypting: "Po enkriptohet…",
  decrypting: "Po dekriptohet…",
  noFiles: "Kasaforta jote është bosh. Ngarko skedarët për të nisur.",
  albums: "Albumet",
  newAlbum: "Album i ri",
  all: "Të gjitha",
  delete: "Fshi",
  download: "Shkarko",
  open: "Hap",
  close: "Mbyll",
  lock: "Mbyll me kyç",
  settings: "Cilësimet",
  signOut: "Dil",
  changeCode: "Ndrysho kodet",
  intruders: "Regjistri i ndërhyresve",
  noIntruders: "Asnjë tentativë e dështuar.",
  shake: "Tundja për kyç",
  hideOnBlur: "Fshih përmbajtjen kur ndërron tab",
  wrongCode: "Kod i gabuar",
  attempts: "Tentativat e dështuara regjistrohen.",
  cancel: "Anulo",
  save: "Ruaj",
  name: "Emri",
  size: "Madhësia",
  type: "Lloji",
  date: "Data",
  files: "skedarë",
  loading: "Po ngarkohet…",
  search: "Kërko",
  pickAlbum: "Zgjidh albumin",
  none: "Asnjë",
  setupHint: "Prek pikën e vogël poshtë-djathtas në kalkulator për të hapur konfigurimin.",
};

// Compact translations: fall back to English for missing keys
const baseEs: Partial<Dict> = { tagline: "Calculadora por fuera. Bóveda por dentro.", signIn: "Iniciar sesión", signUp: "Registrarse", vault: "Bóveda", decoyVault: "Bóveda señuelo", uploadFiles: "Subir archivos", noFiles: "Tu bóveda está vacía.", albums: "Álbumes", newAlbum: "Nuevo álbum", all: "Todos", delete: "Eliminar", download: "Descargar", open: "Abrir", close: "Cerrar", lock: "Bloquear", settings: "Ajustes", signOut: "Salir", wrongCode: "Código incorrecto", cancel: "Cancelar", save: "Guardar", language: "Idioma", create: "Crear bóveda", email: "Correo", password: "Contraseña", realCode: "Código secreto", decoyCode: "Código señuelo" };
const baseDe: Partial<Dict> = { tagline: "Außen Taschenrechner. Innen Tresor.", signIn: "Anmelden", signUp: "Registrieren", vault: "Tresor", decoyVault: "Schein-Tresor", uploadFiles: "Dateien hochladen", noFiles: "Tresor ist leer.", albums: "Alben", newAlbum: "Neues Album", all: "Alle", delete: "Löschen", download: "Herunterladen", open: "Öffnen", close: "Schließen", lock: "Sperren", settings: "Einstellungen", signOut: "Abmelden", wrongCode: "Falscher Code", cancel: "Abbrechen", save: "Speichern", language: "Sprache", create: "Tresor erstellen", email: "E-Mail", password: "Passwort", realCode: "Geheimcode", decoyCode: "Schein-Code" };
const baseFr: Partial<Dict> = { tagline: "Calculatrice à l'extérieur. Coffre-fort à l'intérieur.", signIn: "Connexion", signUp: "S'inscrire", vault: "Coffre", decoyVault: "Coffre leurre", uploadFiles: "Téléverser", noFiles: "Coffre vide.", albums: "Albums", newAlbum: "Nouvel album", all: "Tous", delete: "Supprimer", download: "Télécharger", open: "Ouvrir", close: "Fermer", lock: "Verrouiller", settings: "Paramètres", signOut: "Déconnexion", wrongCode: "Code incorrect", cancel: "Annuler", save: "Enregistrer", language: "Langue", create: "Créer le coffre", email: "Email", password: "Mot de passe", realCode: "Code secret", decoyCode: "Code leurre" };
const baseIt: Partial<Dict> = { tagline: "Calcolatrice fuori. Cassaforte dentro.", signIn: "Accedi", signUp: "Registrati", vault: "Cassaforte", decoyVault: "Cassaforte esca", uploadFiles: "Carica file", noFiles: "Cassaforte vuota.", albums: "Album", newAlbum: "Nuovo album", all: "Tutti", delete: "Elimina", download: "Scarica", open: "Apri", close: "Chiudi", lock: "Blocca", settings: "Impostazioni", signOut: "Esci", wrongCode: "Codice errato", cancel: "Annulla", save: "Salva", language: "Lingua", create: "Crea cassaforte", email: "Email", password: "Password", realCode: "Codice segreto", decoyCode: "Codice esca" };
const baseTr: Partial<Dict> = { tagline: "Dışarıdan hesap makinesi. İçeride kasa.", signIn: "Giriş", signUp: "Kayıt ol", vault: "Kasa", decoyVault: "Sahte kasa", uploadFiles: "Dosya yükle", noFiles: "Kasa boş.", albums: "Albümler", newAlbum: "Yeni albüm", all: "Tümü", delete: "Sil", download: "İndir", open: "Aç", close: "Kapat", lock: "Kilitle", settings: "Ayarlar", signOut: "Çıkış", wrongCode: "Hatalı kod", cancel: "İptal", save: "Kaydet", language: "Dil", create: "Kasayı oluştur", email: "E-posta", password: "Şifre", realCode: "Gizli kod", decoyCode: "Sahte kod" };
const baseAr: Partial<Dict> = { tagline: "حاسبة من الخارج. خزنة من الداخل.", signIn: "تسجيل دخول", signUp: "إنشاء حساب", vault: "الخزنة", decoyVault: "خزنة شَرَك", uploadFiles: "رفع ملفات", noFiles: "الخزنة فارغة.", albums: "ألبومات", newAlbum: "ألبوم جديد", all: "الكل", delete: "حذف", download: "تنزيل", open: "فتح", close: "إغلاق", lock: "قفل", settings: "إعدادات", signOut: "خروج", wrongCode: "رمز خاطئ", cancel: "إلغاء", save: "حفظ", language: "اللغة", create: "إنشاء الخزنة", email: "البريد", password: "كلمة المرور", realCode: "الرمز السري", decoyCode: "رمز الشَرَك" };

export const dictionaries: Record<Lang, Dict> = {
  en,
  sq,
  es: { ...en, ...baseEs } as Dict,
  de: { ...en, ...baseDe } as Dict,
  fr: { ...en, ...baseFr } as Dict,
  it: { ...en, ...baseIt } as Dict,
  tr: { ...en, ...baseTr } as Dict,
  ar: { ...en, ...baseAr } as Dict,
};

export const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k] || k,
});

export const useI18n = () => useContext(I18nContext);
