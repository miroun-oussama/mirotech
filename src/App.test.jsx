import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import * as orders from "./lib/orders";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("boutique", () => {
  it("ouvre le suivi depuis Contact et affiche le statut de la commande", async () => {
    const lookup = vi.spyOn(orders, "trackOrder").mockResolvedValue({ status: "Livrée" });
    try {
      renderAt("/");
      fireEvent.click(screen.getByRole("link", { name: "Suivre ma commande" }));
      fireEvent.change(screen.getByLabelText("Numéro de commande"), { target: { value: "mt-261122-0001" } });
      fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: "+212 6 12 34 56 78" } });
      fireEvent.click(screen.getByRole("button", { name: "Voir le statut" }));
      expect(await screen.findByText("Livrée")).toBeInTheDocument();
      expect(lookup).toHaveBeenCalledWith("MT-261122-0001", "0612345678");
    } finally {
      lookup.mockRestore();
    }
  });

  it("affiche les 4 produits et filtre par catégorie", () => {
    renderAt("/");
    expect(screen.getAllByRole("heading", { level: 3 }).filter((h) => h.closest(".product-card"))).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Recharge" }));
    const cards = document.querySelectorAll(".product-card");
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByText(/Station de charge/)).toBeInTheDocument();
  });

  it("ajoute une variante au panier, met à jour le prix et persiste", () => {
    renderAt("/produit/ai-premium");
    fireEvent.click(screen.getByRole("button", { name: /4 Go RAM \/ 64 Go/ }));
    expect(screen.getAllByText("990 DH").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
    expect(JSON.parse(localStorage.getItem("mirotech-cart"))).toEqual([
      { key: "ai-premium-2", id: "ai-premium", variantIndex: 2, qty: 1 },
    ]);
    expect(document.querySelector(".cart-drawer")).toHaveClass("open");
    expect(document.querySelector(".cart-drawer")).not.toHaveAttribute("inert");
  });

  it("le panier est fermé (inert) par défaut et Échap le referme", () => {
    renderAt("/produit/carplay-2in1");
    const drawer = document.querySelector(".cart-drawer");
    expect(drawer).not.toHaveClass("open");
    expect(drawer).toHaveAttribute("inert");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
    expect(drawer).toHaveClass("open");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(drawer).not.toHaveClass("open");
  });

  it("le panier ouvre le formulaire de commande (sans WhatsApp) et garde les saisies après Échap", () => {
    renderAt("/produit/carplay-2in1");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
    fireEvent.click(within(document.querySelector(".cart-drawer")).getByRole("button", { name: /^Commander/ }));
    fireEvent.change(screen.getByLabelText("Nom ou prénom"), { target: { value: "Sara Alaoui" } });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir le panier/ }));
    fireEvent.click(within(document.querySelector(".cart-drawer")).getByRole("button", { name: /^Commander/ }));
    expect(screen.getByLabelText("Nom ou prénom")).toHaveValue("Sara Alaoui");
    expect(document.body.innerHTML).not.toMatch(/Envoyer la commande sur WhatsApp/);
  });

  it("ne plante pas avec un panier stocké obsolète", () => {
    localStorage.setItem("mirotech-cart", JSON.stringify([{ key: "x", id: "disparu", variantIndex: 0, qty: 1 }]));
    renderAt("/");
    expect(screen.getByRole("button", { name: /Ouvrir le panier \(0 article/ })).toBeInTheDocument();
  });

  it("affiche une page 404 pour un produit inconnu", () => {
    renderAt("/produit/inconnu");
    expect(screen.getByText(/n'existe pas/)).toBeInTheDocument();
  });
});

describe("panier et fiche produit (améliorations)", () => {
  it("la quantité choisie sur la fiche est ajoutée au panier", () => {
    renderAt("/produit/carplay-2in1");
    const product = document.querySelector(".product-detail");
    fireEvent.click(within(product).getByRole("button", { name: /Augmenter la quantité/ }));
    fireEvent.click(within(product).getByRole("button", { name: /Augmenter la quantité/ }));
    expect(within(product).getByText("657 DH")).toBeInTheDocument(); // 3 × 219
    fireEvent.click(within(product).getByRole("button", { name: /Ajouter au panier/ }));
    expect(JSON.parse(localStorage.getItem("mirotech-cart"))[0].qty).toBe(3);
    expect(within(document.querySelector(".cart-drawer")).getByText("Commander · 657 DH", { exact: false })).toBeInTheDocument();
  });

  it("le panier permet de changer la quantité et de retirer l'article, puis propose des produits", () => {
    renderAt("/produit/carplay-2in1");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
    const drawer = within(document.querySelector(".cart-drawer"));
    fireEvent.click(drawer.getByRole("button", { name: /Augmenter la quantité/ }));
    expect(drawer.getByText("438 DH", { selector: ".cart-line-total" })).toBeInTheDocument();
    fireEvent.click(drawer.getByRole("button", { name: /Retirer/ }));
    expect(drawer.getByText("Votre panier est vide")).toBeInTheDocument();
    expect(drawer.getByRole("list", { name: /Produits à découvrir/ })).toBeInTheDocument();
  });

  it("la photo s'agrandit dans une fenêtre et se ferme avec Échap", () => {
    renderAt("/produit/ai-premium");
    fireEvent.click(screen.getByRole("button", { name: "Agrandir la photo" }));
    expect(screen.getByRole("dialog", { name: /photo/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /photo/i })).not.toBeInTheDocument();
  });

  it("les informations de livraison et de retours sont repliables", () => {
    renderAt("/produit/ai-premium");
    expect(screen.getByText(/20 DH à Casablanca et 40 DH/)).toBeInTheDocument();
    expect(screen.getByText(/Retours & assistance/)).toBeInTheDocument();
  });
});

describe("accueil", () => {
  it("présente la commande en 3 étapes, la FAQ factuelle et les catégories du hero", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: /Commander en 3 étapes/ })).toBeInTheDocument();
    expect(screen.getByText("Comment se passe le paiement ?")).toBeInTheDocument();
    expect(screen.getByText(/paiement à la livraison \/ COD/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Catégories de produits" })).toBeInTheDocument();
    expect(screen.queryByText(/Explorer par/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBeGreaterThan(0);
  });
});

describe("adresse de l'administration", () => {
  it("/miro affiche la connexion et /admin n'existe plus", () => {
    const first = renderAt("/miro");
    expect(screen.getByRole("heading", { name: "Commandes" })).toBeInTheDocument();
    first.unmount();
    renderAt("/admin");
    expect(screen.getByText(/n'existe pas/)).toBeInTheDocument();
  });
});
