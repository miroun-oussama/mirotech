import { describe, expect, it } from "vitest";
import {
  LIMITS,
  normalizeMoroccanPhone,
  limitAddress,
  sanitizeName,
  sanitizePhone,
  validateOrderForm,
} from "./validation";

const valid = { name: "Sara Alaoui", phone: "06 12 34 56 78", address: "Casablanca, Maarif, rue 3, immeuble 12" };

describe("filtres de saisie", () => {
  it("nom : refuse chiffres et symboles, garde accents, tirets et apostrophes", () => {
    expect(sanitizeName("Jean-Pierre d'Ö<script>123")).toBe("Jean-Pierre d'Öscript");
    expect(sanitizeName("a".repeat(200))).toHaveLength(LIMITS.name);
    expect(sanitizeName("  Sara   Alaoui")).toBe("Sara Alaoui");
  });

  it("téléphone : chiffres, +, espaces, tirets seulement ; longueur plafonnée ; chiffres arabes convertis", () => {
    expect(sanitizePhone("06abc 12-34.56 78")).toBe("06 12-34.56 78");
    expect(sanitizePhone("+212+6")).toBe("+2126");
    expect(sanitizePhone("٠٦١٢٣٤٥٦٧٨")).toBe("0612345678");
    expect(sanitizePhone("1".repeat(50))).toHaveLength(LIMITS.phone);
  });

  it("ville et adresse : aucune règle de caractères, seulement 150 max", () => {
    expect(limitAddress("Casa, n°5/B <rue> =x & 'é' #12")).toBe("Casa, n°5/B <rue> =x & 'é' #12");
    expect(limitAddress("x".repeat(400))).toHaveLength(LIMITS.address);
  });
});

describe("numéro marocain", () => {
  it.each([
    ["0612345678", "0612345678"],
    ["06 12 34 56 78", "0612345678"],
    ["+212 6 12 34 56 78", "0612345678"],
    ["00212712345678", "0712345678"],
    ["0522123456", "0522123456"],
    ["052212345", null],
    ["0812345678", null],
    ["061234567", null],
    ["+33612345678", null],
    ["", null],
  ])("%s → %s", (input, expected) => expect(normalizeMoroccanPhone(input)).toBe(expected));
});

describe("validateOrderForm", () => {
  it("accepte une commande correcte", () => {
    expect(validateOrderForm(valid)).toEqual({});
  });

  it("accepte un nom ou un prénom seul, et refuse un champ vide ou des chiffres", () => {
    expect(validateOrderForm({ ...valid, name: "Sara" })).toEqual({});
    expect(validateOrderForm({ ...valid, name: "Li" })).toEqual({});
    expect(validateOrderForm({ ...valid, name: "" }).name).toBeDefined();
    expect(validateOrderForm({ ...valid, name: "Sara 2" }).name).toBeDefined();
  });

  it("refuse un numéro non marocain et une adresse vide", () => {
    const errors = validateOrderForm({ name: "Sara Alaoui", phone: "123", address: "   " });
    expect(Object.keys(errors).sort()).toEqual(["address", "phone"]);
  });

  it("accepte n'importe quels caractères dans ville et adresse (150 max)", () => {
    expect(validateOrderForm({ ...valid, address: "Fès — Aïn Kadous, حي السلام #12 (près de la mosquée)" })).toEqual({});
    expect(validateOrderForm({ ...valid, address: "x".repeat(151) }).address).toBeDefined();
  });
});
