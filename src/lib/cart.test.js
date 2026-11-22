import { describe, expect, it } from "vitest";
import { cartCount, cartReducer, cartTotal, loadCart, sanitizeCart } from "./cart";

const storageWith = (value) => ({ getItem: () => value });


describe("cartReducer", () => {
  it("ajoute puis incrémente une même variante", () => {
    let cart = cartReducer([], { type: "add", id: "ai-premium", variantIndex: 1 });
    cart = cartReducer(cart, { type: "add", id: "ai-premium", variantIndex: 1 });
    expect(cart).toEqual([{ key: "ai-premium-1", id: "ai-premium", variantIndex: 1, qty: 2 }]);
  });

  it("ignore un produit ou une variante inconnus", () => {
    expect(cartReducer([], { type: "add", id: "nope" })).toEqual([]);
    expect(cartReducer([], { type: "add", id: "ai-premium", variantIndex: 9 })).toEqual([]);
  });

  it("retire la ligne quand la quantité tombe sous 1", () => {
    const cart = cartReducer([], { type: "add", id: "carplay-2in1" });
    expect(cartReducer(cart, { type: "setQty", key: "carplay-2in1-0", qty: 0 })).toEqual([]);
  });

  it("plafonne la quantité à 99", () => {
    const cart = cartReducer([], { type: "add", id: "carplay-2in1" });
    expect(cartReducer(cart, { type: "setQty", key: "carplay-2in1-0", qty: 500 })[0].qty).toBe(99);
  });
});

describe("totaux (prix communiqués par MIROTECH)", () => {
  it("calcule le sous-total selon la variante", () => {
    let cart = cartReducer([], { type: "add", id: "ai-premium", variantIndex: 2 }); // 990
    cart = cartReducer(cart, { type: "add", id: "carplay-2in1" }); // 219
    cart = cartReducer(cart, { type: "add", id: "carplay-2in1" });
    expect(cartTotal(cart)).toBe(990 + 219 * 2);
    expect(cartCount(cart)).toBe(3);
  });
});

describe("chargement du panier", () => {
  it("renvoie un panier vide si le JSON est corrompu", () => {
    expect(loadCart(storageWith("{pas du json"))).toEqual([]);
  });

  it("écarte les lignes dont le produit n'existe plus ou invalides", () => {
    const raw = [
      { key: "x", id: "produit-supprime", variantIndex: 0, qty: 1 },
      { id: "ai-standard", variantIndex: 7, qty: 1 },
      { id: "ai-standard", variantIndex: 0, qty: -2 },
      null,
      { id: "ai-standard", variantIndex: 1, qty: 2 },
    ];
    expect(sanitizeCart(raw)).toEqual([{ key: "ai-standard-1", id: "ai-standard", variantIndex: 1, qty: 2 }]);
  });

  it("fusionne les doublons et ne plante pas si le stockage est indisponible", () => {
    const dup = [
      { id: "carplay-2in1", variantIndex: 0, qty: 1 },
      { id: "carplay-2in1", variantIndex: 0, qty: 2 },
    ];
    expect(sanitizeCart(dup)[0].qty).toBe(3);
    expect(loadCart({ getItem: () => { throw new Error("blocked"); } })).toEqual([]);
  });
});
