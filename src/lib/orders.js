import { cartLines } from "./cart";

/** URL de l'application Web Google Apps Script (voir google-apps-script/INSTALLATION.md). */
export const ORDERS_API_URL = import.meta.env.VITE_ORDERS_API_URL || "";
export const ordersEnabled = (url = ORDERS_API_URL) => Boolean(url);

// « text/plain » évite la requête de pré-vérification CORS que Apps Script ne gère pas.
async function callApi(url, payload, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Réponse inattendue du serveur.");
    }
    if (!res.ok || !data?.ok) throw new Error(data?.error || "Le serveur a refusé la demande.");
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Le serveur met trop de temps à répondre.");
    if (err instanceof TypeError) throw new Error("Connexion impossible. Vérifiez votre réseau.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Envoie la commande. Seuls id/variante/quantité partent : le serveur recalcule les prix. */
export function submitOrder(cart, customer, { url = ORDERS_API_URL, website = "", requestId = "" } = {}) {
  const items = cartLines(cart).map((l) => ({ id: l.id, variantIndex: l.variantIndex, qty: l.qty }));

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  };

  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");

  return callApi(url, {
    action: "order",
    items,
    customer: {
      name: String(customer.name ?? "").trim(),
      phone: String(customer.phone ?? "").trim(),
      address: String(customer.address ?? "").trim(),
    },
    meta: {
      fbp,
      fbc,
      userAgent: navigator.userAgent,
    },
    website,
    requestId,
  });
}

/**
 * Liste des commandes pour la page admin. `credentials` = { password } à la connexion,
 * puis { token } (jeton de session de 30 min délivré par Google) : le mot de passe n'est pas conservé.
 */
export function fetchOrders(credentials, { url = ORDERS_API_URL } = {}) {
  if (!url) return Promise.reject(new Error("VITE_ORDERS_API_URL n'est pas configurée."));
  return callApi(url, { action: "list", ...credentials }, 30000);
}

export function updateOrderStatus(token, { id, row }, status, { url = ORDERS_API_URL } = {}) {
  return callApi(url, { action: "updateStatus", token, orderId: id, row, status });
}

export function trackOrder(orderId, phone, { url = ORDERS_API_URL } = {}) {
  if (!url) return Promise.reject(new Error("Le suivi est momentanément indisponible."));
  return callApi(url, { action: "trackOrder", orderId, phone });
}

export function logoutOrders(token, { url = ORDERS_API_URL } = {}) {
  if (!url || !token) return Promise.resolve();
  return callApi(url, { action: "logout", token }, 10000).catch(() => {});
}

export const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/** Numéro marocain local (06…/07…) → format international pour wa.me. */
export function toWhatsappNumber(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;
  return digits;
}
