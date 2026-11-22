import { describe, expect, it } from "vitest";
import { buildQuestionUrl } from "./whatsapp";

describe("lien WhatsApp de question produit", () => {
  it("cible le bon numéro et cite le produit", () => {
    const url = buildQuestionUrl({ name: "AI Box Android — Série Premium" });
    expect(url.startsWith("https://wa.me/212750463018?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("AI Box Android — Série Premium");
  });
});
