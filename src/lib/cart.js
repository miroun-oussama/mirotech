import { getProduct } from "../data/products";

export const CART_STORAGE_KEY = "mirotech-cart";
export const MAX_QTY = 99;

/** Résout une ligne de panier vers son produit/variante, ou null si elle n'existe plus. */
export function resolveLine(item) {
  const product = getProduct(item.id);
  const variant = product?.variants[item.variantIndex];
  if (!product || !variant) return null;
  return { ...item, product, variant, lineTotal: variant.price * item.qty };
}

/** Lit un panier depuis une valeur brute (localStorage) en ignorant tout ce qui est invalide. */
export function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Map();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { id, variantIndex } = entry;
    const qty = Math.floor(Number(entry.qty));
    if (typeof id !== "string" || !Number.isInteger(variantIndex) || !(qty >= 1)) continue;
    const product = getProduct(id);
    if (!product || !product.variants[variantIndex]) continue;
    const key = `${id}-${variantIndex}`;
    const existing = seen.get(key);
    const nextQty = Math.min(MAX_QTY, (existing?.qty ?? 0) + qty);
    seen.set(key, { key, id, variantIndex, qty: nextQty });
  }
  return [...seen.values()];
}

// L'accès à localStorage lui-même peut lever (cookies bloqués) : il reste donc dans le try.
export function loadCart(storage) {
  try {
    const s = storage ?? globalThis.localStorage;
    return sanitizeCart(JSON.parse(s.getItem(CART_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function persistCart(cart, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* stockage indisponible (navigation privée, quota) : le panier reste en mémoire */
  }
}

export function cartReducer(state, action) {
  switch (action.type) {
    case "add": {
      const { id, variantIndex = 0 } = action;
      if (!getProduct(id)?.variants[variantIndex]) return state;
      const add = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(action.qty) || 1)));
      const key = `${id}-${variantIndex}`;
      const existing = state.find((x) => x.key === key);
      // « ensure » (Commander maintenant) : l'article doit être présent avec au moins cette quantité.
      if (existing && action.ensure) {
        return existing.qty >= add ? state : state.map((x) => (x.key === key ? { ...x, qty: add } : x));
      }
      if (existing) {
        return state.map((x) => (x.key === key ? { ...x, qty: Math.min(MAX_QTY, x.qty + add) } : x));
      }
      return [...state, { key, id, variantIndex, qty: add }];
    }
    case "setQty": {
      const qty = Math.min(MAX_QTY, action.qty);
      if (qty < 1) return state.filter((x) => x.key !== action.key);
      return state.map((x) => (x.key === action.key ? { ...x, qty } : x));
    }
    case "remove":
      return state.filter((x) => x.key !== action.key);
    case "clear":
      return [];
    case "replace":
      return sanitizeCart(action.cart);
    default:
      return state;
  }
}

export const cartLines = (cart) => cart.map(resolveLine).filter(Boolean);
export const cartCount = (cart) => cartLines(cart).reduce((n, l) => n + l.qty, 0);
export const cartTotal = (cart) => cartLines(cart).reduce((n, l) => n + l.lineTotal, 0);
