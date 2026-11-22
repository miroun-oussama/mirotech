/**
 * MIROTECH — Réception des commandes dans Google Sheets + consultation protégée par mot de passe.
 *
 * À coller dans Extensions > Apps Script du Google Sheet des commandes.
 * Voir INSTALLATION.md. Le mot de passe admin n'est JAMAIS écrit ici :
 * il se règle dans Paramètres du projet > Propriétés du script > ADMIN_PASSWORD (6 caractères minimum).
 *
 * @OnlyCurrentDoc
 */

const SHEET_NAME = "Commandes";
const HEADERS = ["Date", "N° commande", "Nom et prénom", "Téléphone", "Ville et adresse", "Articles", "Total (DH)", "Paiement", "Statut"];
const COLUMN_FORMATS = ["@", "@", "@", "@", "@", "@", "0", "@", "@"]; // texte partout (garde le 0 du téléphone), nombre pour le total
const STATUS_NEW = "Nouvelle";
const STATUS_COLORS = new Map([
  [STATUS_NEW, "#fce8b2"],
  ["Confirmée", "#d2e3fc"],
  ["Livrée", "#ceead6"],
  ["Annulée", "#fce8e6"],
]);
const TIMEZONE = "Africa/Casablanca";
const MAX_LIST_ROWS = 500;
const MIN_ADMIN_PASSWORD = 6; // mot de passe court accepté : le blocage après échecs ci-dessous compense
const MAX_FAILED_LOGINS = 5; // 5 mots de passe faux de suite...
const LOCK_MINUTES = 15; // ...et la connexion admin est bloquée 15 minutes
const SESSION_SECONDS = 1800; // la session admin dure 30 minutes
const MAX_ORDERS_PER_WINDOW = 30; // plafond global anti-spam
const WINDOW_SECONDS = 600;
const MAX_TOTAL_QTY = 99;

// Prix officiels : le serveur recalcule le total, il ne fait jamais confiance au prix envoyé par le navigateur.
// Doit rester identique à src/data/products.js (un test automatique vérifie la synchronisation).
// CATALOGUE-START
const CATALOGUE = {
  "ai-premium": {
    "name": "AI Box Android — Série Premium",
    "variants": [
      { "label": "2 Go RAM / 16 Go", "price": 650 },
      { "label": "2 Go RAM / 32 Go", "price": 750 },
      { "label": "4 Go RAM / 64 Go", "price": 990 }
    ]
  },
  "ai-standard": {
    "name": "AI Box Android — Série Standard",
    "variants": [
      { "label": "2 Go RAM / 16 Go", "price": 550 },
      { "label": "2 Go RAM / 32 Go", "price": 690 }
    ]
  },
  "charger-5in1": {
    "name": "Station de charge sans fil 5-en-1",
    "variants": [{ "label": "Station 5-en-1", "price": 385 }]
  },
  "carplay-2in1": {
    "name": "Adaptateur sans fil CarPlay & Android Auto 2-en-1",
    "variants": [{ "label": "Adaptateur 2-en-1", "price": 219 }]
  }
};
// CATALOGUE-END

/* ------------------------------ Points d'entrée ------------------------------ */

// Change ce numéro à chaque modification : il permet de vérifier que la NOUVELLE version est bien en ligne.
const VERSION = "2026-11-22-j";
const ORDER_SHEET_STYLE = "mirotech-orders-style-v1";

function doGet() {
  return json_({ ok: true, service: "mirotech-orders", version: VERSION });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 20000) return json_({ ok: false, error: "Requête invalide." });
    const body = JSON.parse(raw);
    if (body.action === "order") return json_(createOrder_(body));
    if (body.action === "trackOrder") return json_(trackOrder_(body));
    if (body.action === "list") return json_(listOrders_(body));
    if (body.action === "updateStatus") return json_(updateOrderStatus_(body));
    if (body.action === "logout") return json_(logout_(body));
    return json_({ ok: false, error: "Action inconnue." });
  } catch (err) {
    return json_({ ok: false, error: "Requête invalide." });
  }
}

/* --------------------------------- Commandes --------------------------------- */

function createOrder_(body) {
  // Champ piège : un humain ne le remplit jamais. On répond « ok » sans rien écrire.
  if (body.website) return { ok: true, orderId: "MT-OK" };

  // Mêmes règles que src/lib/validation.js : le serveur ne fait pas confiance au navigateur.
  const customer = body.customer || {};
  const name = clean_(customer.name, 60);
  const address = clean_(customer.address, 150); // « Ville et adresse » : 150 max, aucune autre règle de caractères
  const phone = normalizePhone_(customer.phone);
  if (!/^[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*)*$/u.test(name)) {
    return { ok: false, error: "Indiquez votre nom ou votre prénom." };
  }
  if (!phone) return { ok: false, error: "Numéro de téléphone marocain invalide." };
  if (!address) return { ok: false, error: "Indiquez votre ville et votre adresse." };
  const digits = phone;

  const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const lines = [];
  let total = 0;
  let totalQty = 0;
  for (const it of items) {
    const id = String(it && it.id);
    const product = Object.prototype.hasOwnProperty.call(CATALOGUE, id) ? CATALOGUE[id] : null;
    const variantIndex = Number(it && it.variantIndex);
    const variant = product && Number.isInteger(variantIndex) ? product.variants[variantIndex] : null;
    const qty = Math.floor(Number(it && it.qty));
    if (!product || !variant || !(qty >= 1) || qty > MAX_TOTAL_QTY) {
      return { ok: false, error: "Panier invalide. Rechargez la page et réessayez." };
    }
    totalQty += qty;
    total += variant.price * qty;
    lines.push(product.name + " — " + variant.label + " × " + qty);
  }
  if (!lines.length) return { ok: false, error: "Votre panier est vide." };
  if (totalQty > MAX_TOTAL_QTY) return { ok: false, error: "Quantité totale trop élevée. Contactez-nous directement." };

  const requestId = typeof body.requestId === "string" ? body.requestId.slice(0, 64) : "";
  const cache = CacheService.getScriptCache();

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { ok: false, error: "Le serveur est occupé. Réessayez dans quelques secondes." };
  }
  try {
    // Même requête renvoyée (timeout, double clic) : on renvoie le même n° sans écrire une 2e ligne.
    if (requestId) {
      const done = cache.get("idem:" + requestId);
      if (done) return { ok: true, orderId: done, total: total };
    }
    const dupKey = "dup:" + digits;
    if (cache.get(dupKey)) {
      return { ok: false, error: "Votre commande vient d'être reçue. Patientez une minute avant d'en envoyer une autre." };
    }
    const recent = Number(cache.get("window") || "0");
    if (recent >= MAX_ORDERS_PER_WINDOW) {
      return { ok: false, error: "Beaucoup de commandes en ce moment. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp." };
    }

    const sheet = getSheet_();
    const props = PropertiesService.getScriptProperties();
    const seq = Number(props.getProperty("ORDER_SEQ") || "0") + 1;
    props.setProperty("ORDER_SEQ", String(seq));
    const now = new Date();
    const orderId = "MT-" + Utilities.formatDate(now, TIMEZONE, "yyMMdd") + "-" + ("0000" + seq).slice(-4);

    sheet.insertRowBefore(2);
    const range = sheet.getRange(2, 1, 1, HEADERS.length);
    range.setNumberFormats([COLUMN_FORMATS]); // d'abord le format texte, sinon Sheets « devine » (0612… → nombre)
    range.setValues([[
      Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss"),
      orderId,
      safeCell_(name),
      phone,
      safeCell_(address),
      lines.join("\n"),
      total,
      "Paiement à la livraison",
      STATUS_NEW,
    ]]);
    range.setBackground(STATUS_COLORS.get(STATUS_NEW));
    range.setVerticalAlignment("middle").setWrap(true);
    SpreadsheetApp.flush();

    cache.put("dup:" + digits, "1", 60);
    cache.put("window", String(recent + 1), WINDOW_SECONDS);
    if (requestId) cache.put("idem:" + requestId, orderId, 21600);
    notify_(orderId, name, phone, address, lines, total);
    return { ok: true, orderId: orderId, total: total };
  } finally {
    lock.releaseLock();
  }
}

// Optionnel : si la propriété NOTIFY_EMAIL est définie, vous recevez un e-mail à chaque commande
// (et vous voyez tout de suite un éventuel spam).
function notify_(orderId, name, phone, address, lines, total) {
  try {
    const to = PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL");
    if (!to) return;
    MailApp.sendEmail(
      to,
      "Nouvelle commande " + orderId + " — " + total + " DH",
      name + " — " + phone + " — " + address + "\n\n" + lines.join("\n") + "\n\nTotal : " + total + " DH (paiement à la livraison)"
    );
  } catch (err) {
    /* l'e-mail ne doit jamais empêcher l'enregistrement de la commande */
  }
}

/* ------------------------------ Administration ------------------------------ */

// Connexion : mot de passe -> jeton de session (30 min). Ensuite le navigateur n'envoie plus que le jeton.
function listOrders_(body) {
  const cache = CacheService.getScriptCache();
  let token = typeof body.token === "string" ? body.token : "";

  if (!(token && cache.get("tok:" + token))) {
    const props = PropertiesService.getScriptProperties();
    const expected = props.getProperty("ADMIN_PASSWORD");
    if (!expected || expected.length < MIN_ADMIN_PASSWORD) {
      // La raison exacte n'est visible que par vous (menu « Exécutions » d'Apps Script), jamais par le public.
      console.error(!expected ? "ADMIN_PASSWORD absent : créez la propriété du script." : "ADMIN_PASSWORD trop court (" + expected.length + " caractères, minimum " + MIN_ADMIN_PASSWORD + ").");
      return { ok: false, error: "Administration indisponible." };
    }
    const lockedUntil = Number(props.getProperty("LOGIN_LOCKED_UNTIL") || "0");
    if (Date.now() < lockedUntil) {
      const minutes = Math.ceil((lockedUntil - Date.now()) / 60000);
      return { ok: false, error: "Trop de tentatives. Réessayez dans " + minutes + " min." };
    }
    if (!safeEqual_(String(body.password || ""), expected)) {
      registerFailedLogin_();
      Utilities.sleep(700); // ralentit aussi les essais en rafale
      return { ok: false, error: token ? "Session expirée. Reconnectez-vous." : "Mot de passe incorrect." };
    }
    props.deleteProperty("LOGIN_FAILS");
    token = Utilities.getUuid();
  }
  cache.put("tok:" + token, "1", SESSION_SECONDS);

  const sheet = getSheet_();
  applyOrdersSheetStyleOnce_(sheet);
  const lastRow = sheet.getLastRow();
  const orders = [];
  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, Math.min(lastRow - 1, MAX_LIST_ROWS), HEADERS.length).getValues();
    for (let i = 0; i < values.length; i++) {
      const r = values[i];
      orders.push({
        row: i + 2,
        date: String(r[0]),
        id: String(r[1]),
        name: String(r[2]),
        phone: String(r[3]),
        address: String(r[4]),
        items: String(r[5]),
        total: Number(r[6]) || 0,
        payment: String(r[7]),
        status: String(r[8]),
      });
    }
  }
  const sheetUrl = sheet.getParent().getUrl() + "#gid=" + sheet.getSheetId();
  return { ok: true, token: token, orders: orders, sheetUrl: sheetUrl };
}

function trackOrder_(body) {
  const orderId = typeof body.orderId === "string" ? body.orderId.trim().toUpperCase() : "";
  const phone = normalizePhone_(body.phone);
  if (!/^MT-\d{6}-\d{4}$/.test(orderId) || !phone) {
    return { ok: false, error: "Vérifiez le numéro de commande et le téléphone." };
  }

  const cache = CacheService.getScriptCache();
  const key = "track:" + orderId;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return { ok: false, error: "Suivi occupé. Réessayez dans un instant." };
  try {
    const attempts = Number(cache.get(key) || 0);
    if (attempts >= 12) return { ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." };
    cache.put(key, String(attempts + 1), 300);
  } finally {
    lock.releaseLock();
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const count = sheet ? sheet.getLastRow() - 1 : 0;
  if (count > 0) {
    const rows = sheet.getRange(2, 2, count, HEADERS.length - 1).getValues();
    const matches = rows.filter(([id, , storedPhone]) => id === orderId &&
      safeEqual_(normalizePhone_(storedPhone) || "", phone));
    if (matches.length === 1) {
      const status = matches[0][HEADERS.length - 2];
      return { ok: true, status: STATUS_COLORS.has(status) ? status : "En cours de traitement" };
    }
  }
  return { ok: false, error: "Aucune commande trouvée avec ces informations." };
}

function updateOrderStatus_(body) {
  const cache = CacheService.getScriptCache();
  const token = typeof body.token === "string" ? body.token : "";
  if (!token || !cache.get("tok:" + token)) {
    return { ok: false, error: "Session expirée. Reconnectez-vous." };
  }
  if (!STATUS_COLORS.has(body.status) || typeof body.orderId !== "string" || !body.orderId.trim()) {
    return { ok: false, error: "Commande ou statut invalide." };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: "Google Sheets est occupé. Réessayez." };
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    let row = body.row;
    if (!Number.isInteger(row) || row < 2 || row > lastRow ||
        String(sheet.getRange(row, 2).getValue()) !== body.orderId) {
      const ids = lastRow > 1 ? sheet.getRange(2, 2, lastRow - 1, 1).getValues() : [];
      const matches = [];
      ids.forEach(([id], index) => {
        if (String(id) === body.orderId) matches.push(index + 2);
      });
      if (matches.length !== 1) {
        return { ok: false, error: "Commande introuvable ou en double. Actualisez la liste et réessayez." };
      }
      [row] = matches;
    }
    sheet.getRange(row, HEADERS.length)
      .setValue(body.status);
    sheet.getRange(row, 1, 1, HEADERS.length).setBackground(STATUS_COLORS.get(body.status));
    SpreadsheetApp.flush();
    return { ok: true, status: body.status, row };
  } finally {
    lock.releaseLock();
  }
}

// Compte les échecs (sous verrou, dans les propriétés du script : fiable même sous requêtes parallèles).
function registerFailedLogin_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const fails = Number(props.getProperty("LOGIN_FAILS") || "0") + 1;
    if (fails >= MAX_FAILED_LOGINS) {
      props.setProperty("LOGIN_LOCKED_UNTIL", String(Date.now() + LOCK_MINUTES * 60000));
      props.deleteProperty("LOGIN_FAILS");
    } else {
      props.setProperty("LOGIN_FAILS", String(fails));
    }
  } finally {
    lock.releaseLock();
  }
}

function logout_(body) {
  if (typeof body.token === "string" && body.token) CacheService.getScriptCache().remove("tok:" + body.token);
  return { ok: true };
}

/* -------------------------------- Diagnostic --------------------------------- */

// À lancer à la main dans l'éditeur (bouton Exécuter, fonction « checkSetup ») : affiche l'état de la configuration
// dans le journal, SANS montrer le mot de passe.
function checkSetup() {
  const pw = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  console.log("Propriété ADMIN_PASSWORD : " + (pw ? "présente, " + pw.length + " caractères" : "ABSENTE"));
  console.log("Longueur minimale acceptée par ce code : " + MIN_ADMIN_PASSWORD);
  console.log(pw && pw.length >= MIN_ADMIN_PASSWORD ? "OK : la connexion admin est possible." : "PROBLÈME : la connexion admin sera refusée.");
  console.log("Feuille : " + SpreadsheetApp.getActiveSpreadsheet().getUrl());
}

// À exécuter une fois depuis l’éditeur après publication pour réordonner les commandes existantes.
function sortExistingOrdersNewestFirst() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const count = sheet.getLastRow() - 1;
    if (count < 2) return;
    sheet.getRange(2, 1, count, sheet.getLastColumn()).sort([
      { column: 1, ascending: false },
      { column: 2, ascending: false },
    ]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

/* -------------------------------- Utilitaires -------------------------------- */

// À exécuter dans l’éditeur pour appliquer le style au classeur déjà utilisé.
function formatOrdersSheet() {
  formatExistingOrders_(getSheet_());
}

function formatExistingOrders_(sheet) {
  formatOrdersSheet_(sheet);
  const count = sheet.getLastRow() - 1;
  if (count > 0) {
    sheet.getRange(2, 1, count, HEADERS.length).setVerticalAlignment("middle").setWrap(true);
    sheet.autoResizeRows(2, count);
  }
}

function applyOrdersSheetStyleOnce_(sheet) {
  const isStyled = () => sheet.getDeveloperMetadata().some((entry) => entry.getKey() === ORDER_SHEET_STYLE);
  const lock = LockService.getScriptLock();
  try {
    if (isStyled() || !lock.tryLock(3000)) return;
    try {
      if (isStyled()) return;
      formatExistingOrders_(sheet);
      SpreadsheetApp.flush();
      sheet.addDeveloperMetadata(ORDER_SHEET_STYLE);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error("Mise en forme de l’onglet Commandes : " + err.message);
  }
}

function formatOrdersSheet_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground("#e8edf3")
    .setFontColor("#172331")
    .setFontSize(11)
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setRowHeight(1, 42);
  sheet.setFrozenRows(Math.max(1, sheet.getFrozenRows()));
  const widths = [155, 140, 175, 130, 255, 280, 100, 170, 120];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setNumberFormats([COLUMN_FORMATS.map(function () { return "@"; })]);
    sheet.appendRow(HEADERS);
    formatOrdersSheet_(sheet);
  }
  return sheet;
}

// Numéro marocain (05/06/07 + 8 chiffres, ou +212 / 00212) -> "0612345678", sinon null.
function normalizePhone_(value) {
  const digits = String(value == null ? "" : value)
    .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
    .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x6f0); })
    .replace(/[\s.-]/g, "");
  const m = digits.match(/^(?:\+212|00212|0)([5-7]\d{8})$/);
  return m ? "0" + m[1] : null;
}

function clean_(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

// Neutralise les formules (=, +, -, @) au cas où la feuille serait exportée en CSV puis ouverte dans Excel.
function safeCell_(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

// Comparaison en temps constant.
function safeEqual_(a, b) {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
