// Limites et règles de saisie du formulaire de commande.
// Le serveur (google-apps-script/Code.gs) applique les MÊMES règles : le navigateur n'est jamais la seule barrière.

export const LIMITS = { name: 60, phone: 18, address: 150 };

const NAME_RE = /^[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*)*$/u;

/** Chiffres arabo-indiens / persans → chiffres 0-9. */
export const toAsciiDigits = (s) =>
  String(s ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));

const collapse = (s) => s.replace(/\s{2,}/g, " ").replace(/^\s+/, "");

/* Filtres appliqués pendant la frappe : les caractères interdits ne s'écrivent tout simplement pas. */
export const sanitizeName = (v) => collapse(String(v ?? "").replace(/[^\p{L}\s'’.-]/gu, "")).slice(0, LIMITS.name);
export const sanitizePhone = (v) =>
  toAsciiDigits(v)
    .replace(/[^\d+\s.-]/g, "")
    .replace(/(?!^)\+/g, "")
    .slice(0, LIMITS.phone);
// « Ville et adresse » : aucune règle de caractères, seulement 150 caractères maximum.
export const limitAddress = (v) => String(v ?? "").slice(0, LIMITS.address);

/** Numéro marocain (05/06/07 + 8 chiffres, ou +212 / 00212) → « 0612345678 », sinon null. */
export function normalizeMoroccanPhone(value) {
  const digits = toAsciiDigits(value).replace(/[\s.-]/g, "");
  const m = digits.match(/^(?:\+212|00212|0)([5-7]\d{8})$/);
  return m ? `0${m[1]}` : null;
}

/** Retourne un objet { champ: message } — vide si tout est valide. */
export function validateOrderForm({ name, phone, address }) {
  const errors = {};
  const n = String(name ?? "").trim();
  const a = String(address ?? "").trim();
  if (!NAME_RE.test(n) || n.length > LIMITS.name) {
    errors.name = "Indiquez votre nom ou votre prénom.";
  }
  if (!normalizeMoroccanPhone(phone)) {
    errors.phone = "Numéro marocain invalide. Exemple : 06 12 34 56 78 ou +212 6 12 34 56 78.";
  }
  if (!a) errors.address = "Indiquez votre ville et votre adresse.";
  else if (a.length > LIMITS.address) errors.address = `Maximum ${LIMITS.address} caractères.`;
  return errors;
}
