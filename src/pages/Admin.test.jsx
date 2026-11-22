import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/orders", async (importOriginal) => ({
  ...(await importOriginal()),
  ordersEnabled: () => true,
  fetchOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

import { fetchOrders, updateOrderStatus } from "../lib/orders";
import Admin from "./Admin";

const ORDERS = [
  { row: 3, date: "2025-01-02 10:00:00", id: "MT-250102-0002", name: "Karim", phone: "0698765432", address: "Rabat, Agdal, rue 5", items: "Adaptateur × 1", total: 219, payment: "Paiement à la livraison", status: "Nouvelle" },
  { row: 2, date: "2025-01-01 09:00:00", id: "MT-250101-0001", name: "Sara", phone: "0612345678", address: "Casablanca, Maarif, rue 3", items: "AI Box × 2\nAdaptateur × 1", total: 1719, payment: "Paiement à la livraison", status: "Annulée" },
];

const login = (pw) => {
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: pw } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
};

beforeEach(() => {
  sessionStorage.clear();
  fetchOrders.mockReset();
  updateOrderStatus.mockReset();
});
afterEach(cleanup);

describe("page admin", () => {
  it("affiche une erreur et reste verrouillée avec un mauvais mot de passe", async () => {
    fetchOrders.mockRejectedValue(new Error("Mot de passe incorrect."));
    render(<MemoryRouter><Admin /></MemoryRouter>);
    login("faux");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mot de passe incorrect.");
    expect(screen.queryByText("Karim")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("mirotech-admin-token")).toBeNull();
  });

  it("liste les commandes, calcule le CA hors annulées et filtre par recherche", async () => {
    fetchOrders.mockResolvedValue({ orders: ORDERS, token: "tok-123", sheetUrl: "https://docs.google.com/spreadsheets/d/x" });
    render(<MemoryRouter><Admin /></MemoryRouter>);
    login("bon");
    expect(await screen.findByText("Karim")).toBeInTheDocument();
    expect(fetchOrders).toHaveBeenCalledWith({ password: "bon" });
    expect(screen.getByText("Sara")).toBeInTheDocument();
    // CA : 219 (la commande annulée de 1 719 DH n'est pas comptée)
    expect(screen.getByText("Chiffre d'affaires (hors annulées)").nextSibling).toHaveTextContent("219");

    fireEvent.change(screen.getByLabelText("Rechercher une commande"), { target: { value: "agdal" } });
    expect(screen.getByText("Karim")).toBeInTheDocument();
    expect(screen.queryByText("Sara")).not.toBeInTheDocument();

    const contact = screen.getByRole("link", { name: /Contacter/ });
    expect(contact.getAttribute("href")).toContain("wa.me/212698765432");
  });

  it("affiche le statut enregistré et conserve ce statut si Google Sheets refuse une modification", async () => {
    fetchOrders.mockResolvedValue({ orders: ORDERS, token: "tok-123" });
    updateOrderStatus
      .mockResolvedValueOnce({ status: "Livrée" })
      .mockRejectedValueOnce(new Error("Google Sheets est occupé. Réessayez."));
    render(<MemoryRouter><Admin /></MemoryRouter>);
    login("bon");

    const group = await screen.findByRole("group", { name: "Statut de la commande MT-250102-0002" });
    const delivered = within(group).getByRole("button", { name: "Livrée" });
    fireEvent.click(delivered);
    expect(updateOrderStatus).toHaveBeenCalledWith("tok-123", expect.objectContaining({ id: "MT-250102-0002", row: 3 }), "Livrée");
    await waitFor(() => expect(delivered).toHaveAttribute("aria-pressed", "true"));
    expect(delivered).toHaveClass("status-delivered");

    fireEvent.click(within(group).getByRole("button", { name: "Annulée" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Google Sheets est occupé.");
    expect(delivered).toHaveAttribute("aria-pressed", "true");
  });

  it("la déconnexion efface la session", async () => {
    fetchOrders.mockResolvedValue({ orders: ORDERS, token: "tok-123" });
    render(<MemoryRouter><Admin /></MemoryRouter>);
    login("bon");
    await screen.findByText("Karim");
    // seul le jeton est conservé, jamais le mot de passe
    expect(sessionStorage.getItem("mirotech-admin-token")).toBe("tok-123");
    expect(JSON.stringify(sessionStorage)).not.toContain("bon");
    fireEvent.click(screen.getByRole("button", { name: /Déconnexion/ }));
    await waitFor(() => expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument());
    expect(sessionStorage.getItem("mirotech-admin-token")).toBeNull();
  });

  it("reprend la session avec le jeton après un rechargement", async () => {
    sessionStorage.setItem("mirotech-admin-token", "tok-123");
    fetchOrders.mockResolvedValue({ orders: ORDERS, token: "tok-123" });
    render(<MemoryRouter><Admin /></MemoryRouter>);
    expect(await screen.findByText("Karim")).toBeInTheDocument();
    expect(fetchOrders).toHaveBeenCalledWith({ token: "tok-123" });
  });
});
