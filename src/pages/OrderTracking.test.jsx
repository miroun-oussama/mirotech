import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OrderTracking from "./OrderTracking";
import * as orders from "../lib/orders";

const renderPage = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/suivi-commande", state }]}>
      <OrderTracking />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const fill = (id, phone) => {
  fireEvent.change(screen.getByLabelText("Numéro de commande"), { target: { value: id } });
  fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: phone } });
  fireEvent.click(screen.getByRole("button", { name: "Voir le statut" }));
};

describe("suivi de commande", () => {
  it("préremplit le numéro reçu après la commande et le met en forme", () => {
    renderPage({ orderId: "MT-261122-0001" });
    expect(screen.getByLabelText("Numéro de commande")).toHaveValue("MT-261122-0001");
    fireEvent.change(screen.getByLabelText("Numéro de commande"), { target: { value: "mt 261122 0002" } });
    expect(screen.getByLabelText("Numéro de commande")).toHaveValue("MT-261122-0002");
  });

  it("affiche une erreur par champ sans appeler le serveur", () => {
    const lookup = vi.spyOn(orders, "trackOrder");
    renderPage();
    fill("MT-12", "123");
    expect(screen.getByText(/Format attendu/)).toBeInTheDocument();
    expect(screen.getByText(/numéro marocain valide/)).toBeInTheDocument();
    expect(screen.getByLabelText("Numéro de commande")).toHaveAttribute("aria-invalid", "true");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("montre la frise d'avancement pour une commande confirmée", async () => {
    vi.spyOn(orders, "trackOrder").mockResolvedValue({ status: "Confirmée" });
    renderPage();
    fill("MT-261122-0001", "06 12 34 56 78");
    expect(await screen.findByText("Confirmée")).toBeInTheDocument();
    expect(screen.getByText(/est confirmée/)).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[2]).not.toHaveClass("done");
  });

  it("affiche un message clair pour une commande annulée, sans frise", async () => {
    vi.spyOn(orders, "trackOrder").mockResolvedValue({ status: "Annulée" });
    renderPage();
    fill("MT-261122-0001", "0612345678");
    expect(await screen.findByText(/a été annulée/)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Avancement de la commande" })).not.toBeInTheDocument();
  });

  it("permet de suivre une autre commande", async () => {
    vi.spyOn(orders, "trackOrder").mockResolvedValue({ status: "Livrée" });
    renderPage();
    fill("MT-261122-0001", "0612345678");
    fireEvent.click(await screen.findByRole("button", { name: /Suivre une autre commande/ }));
    expect(screen.getByLabelText("Numéro de commande")).toHaveValue("");
  });

  it("affiche l'erreur du serveur (commande introuvable)", async () => {
    vi.spyOn(orders, "trackOrder").mockRejectedValue(new Error("Aucune commande trouvée avec ces informations."));
    renderPage();
    fill("MT-261122-0001", "0612345678");
    expect(await screen.findByRole("alert")).toHaveTextContent("Aucune commande trouvée");
    expect(screen.getByLabelText("Numéro de commande")).toBeInTheDocument();
  });
});
