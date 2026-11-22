import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider, useCart } from "../context/CartContext";
import CheckoutModal from "./CheckoutModal";

function Harness() {
  const { buyNow, count } = useCart();
  return (
    <>
      <button onClick={() => buyNow("carplay-2in1", 0)}>go</button>
      <output data-testid="count">{count}</output>
    </>
  );
}

const setup = (apiUrl = "https://script.example/exec") => {
  render(
    <MemoryRouter>
      <CartProvider>
        <Harness />
        <CheckoutModal apiUrl={apiUrl} />
      </CartProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("go"));
};

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fill = (overrides = {}) => {
  const v = { name: "Sara Alaoui", phone: "06 12 34 56 78", address: "Casablanca, Maarif, rue 3, immeuble 12", ...overrides };
  type("Nom ou prénom", v.name);
  type("Téléphone", v.phone);
  type("Ville et adresse", v.address);
};
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Commander" }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("formulaire Commander", () => {
  it("« Commander maintenant » ouvre directement le formulaire avec le récapitulatif", () => {
    setup();
    expect(screen.getByRole("dialog", { name: /Préparer votre commande/ })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /Récapitulatif/ })).toHaveTextContent("219 DH");
  });

  it("limite la saisie : caractères interdits retirés et longueurs plafonnées", () => {
    setup();
    type("Nom ou prénom", "Sara <b>12 Alaoui");
    expect(screen.getByLabelText("Nom ou prénom")).toHaveValue("Sara b Alaoui");
    type("Téléphone", "06abc12345678");
    expect(screen.getByLabelText("Téléphone")).toHaveValue("0612345678");
    type("Ville et adresse", "Casa <rue> n°5/B & co");
    expect(screen.getByLabelText("Ville et adresse")).toHaveValue("Casa <rue> n°5/B & co"); // aucune règle de caractères
    type("Ville et adresse", "x".repeat(500));
    expect(screen.getByLabelText("Ville et adresse").value).toHaveLength(150);
    expect(screen.getByLabelText("Ville et adresse")).toHaveAttribute("maxlength", "150");
  });

  it("affiche les erreurs par champ sans appeler le serveur", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setup();
    fill({ name: "", phone: "123", address: "" });
    submit();
    const alerts = screen.getAllByRole("alert").map((a) => a.textContent).join(" ");
    expect(alerts).toMatch(/nom ou votre prénom/i);
    expect(alerts).toMatch(/Numéro marocain invalide/);
    expect(alerts).toMatch(/ville et votre adresse/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie la commande SANS passer par WhatsApp, vide le panier et affiche « commande envoyée »", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, orderId: "MT-250101-0001" }) });
    const openMock = vi.spyOn(window, "open").mockImplementation(() => null);
    vi.stubGlobal("fetch", fetchMock);
    setup();
    fill();
    submit();
    expect(await screen.findByText("Votre commande a été envoyée !")).toBeInTheDocument();
    expect(screen.getByText("MT-250101-0001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Suivre ma commande" })).toHaveAttribute("href", "/suivi-commande");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.customer).toEqual({ name: "Sara Alaoui", phone: "0612345678", address: "Casablanca, Maarif, rue 3, immeuble 12" });
    expect(openMock).not.toHaveBeenCalled();
    expect(document.body.innerHTML).not.toContain("wa.me");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    openMock.mockRestore();
  });

  it("en cas d'échec : message clair, panier conservé, aucun lien WhatsApp", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false, error: "Serveur indisponible." }) }));
    setup();
    fill();
    submit();
    expect(await screen.findByText(/Serveur indisponible\./)).toBeInTheDocument();
    expect(screen.getByText(/n'a pas été envoyée/)).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("wa.me");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByLabelText("Nom ou prénom")).toHaveValue("Sara Alaoui");
  });

  it("si le serveur de commandes n'est pas configuré : dit la vérité, n'ouvre pas WhatsApp, ne prétend pas avoir envoyé", () => {
    const openMock = vi.spyOn(window, "open").mockImplementation(() => null);
    setup("");
    fill();
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(/pas encore activée/);
    expect(screen.queryByText("Votre commande a été envoyée !")).not.toBeInTheDocument();
    expect(openMock).not.toHaveBeenCalled();
    openMock.mockRestore();
  });
});
