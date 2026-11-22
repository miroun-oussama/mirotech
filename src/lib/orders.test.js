import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { products } from "../data/products";
import { fetchOrders, submitOrder, toWhatsappNumber } from "./orders";

const cart = [{ key: "ai-premium-1", id: "ai-premium", variantIndex: 1, qty: 2 }];
const customer = { name: " Sara Alaoui ", phone: "0612345678", address: "Casablanca, Maarif, rue 3" };
const API = "https://script.example/exec";

afterEach(() => vi.unstubAllGlobals());

describe("submitOrder", () => {
  it("n'envoie que id/variante/quantité (jamais de prix) en text/plain", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, orderId: "MT-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    const res = await submitOrder(cart, customer, { url: API, requestId: "abc-1" });
    expect(res.orderId).toBe("MT-1");
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(API);
    expect(init.headers["Content-Type"]).toMatch(/^text\/plain/);
    const body = JSON.parse(init.body);
    expect(body.action).toBe("order");
    expect(body.items).toEqual([{ id: "ai-premium", variantIndex: 1, qty: 2 }]);
    expect(body.customer.name).toBe("Sara Alaoui");
    expect(body.customer.address).toBe("Casablanca, Maarif, rue 3");
    expect(init.body).not.toMatch(/price|total/i);
    expect(body.requestId).toBe("abc-1");
  });

  it("remonte le message d'erreur du serveur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false, error: "Panier invalide." }) }));
    await expect(submitOrder(cart, customer, { url: API })).rejects.toThrow("Panier invalide.");
  });

  it("traduit une panne réseau en message clair", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(submitOrder(cart, customer, { url: API })).rejects.toThrow(/Connexion impossible/);
  });
});

describe("fetchOrders", () => {
  it("envoie le mot de passe dans le corps (pas dans l'URL)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, orders: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await fetchOrders({ password: "secret" }, { url: API });
    expect(fetchMock.mock.calls[0][0]).toBe(API);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: "list", password: "secret" });
  });
});

describe("toWhatsappNumber", () => {
  it.each([
    ["0612345678", "212612345678"],
    ["+212 6 12 34 56 78", "212612345678"],
    ["00212612345678", "212612345678"],
  ])("%s → %s", (input, expected) => expect(toWhatsappNumber(input)).toBe(expected));
});

describe("Code.gs (Google Apps Script)", () => {
  const src = readFileSync(resolve(process.cwd(), "google-apps-script/Code.gs"), "utf8");

  it("le catalogue du serveur est identique à src/data/products.js (prix recalculés côté serveur)", () => {
    const block = src.split("// CATALOGUE-START")[1].split("// CATALOGUE-END")[0];
    const json = block.replace(/^\s*const CATALOGUE =/, "").trim().replace(/;$/, "");
    const server = JSON.parse(json);
    const expected = Object.fromEntries(
      products.map((p) => [p.id, { name: p.name, variants: p.variants.map((v) => ({ label: v.label, price: v.price })) }]),
    );
    expect(server).toEqual(expected);
  });

  it("limite les droits au seul classeur et bloque la connexion admin après 5 échecs (mot de passe court)", () => {
    expect(src).toMatch(/@OnlyCurrentDoc/);
    expect(src).toMatch(/MAX_FAILED_LOGINS = 5/);
    expect(src).toMatch(/LOGIN_LOCKED_UNTIL/);
    expect(src).toMatch(/registerFailedLogin_\(\)/);
  });

  it("ne contient aucun mot de passe en clair et lit ADMIN_PASSWORD depuis les propriétés du script", () => {
    expect(src).toMatch(/getProperty\("ADMIN_PASSWORD"\)/);
    expect(src).not.toMatch(/ADMIN_PASSWORD\s*=\s*["']/);
  });
});
