import { SITE } from "./format";

export const whatsappUrl = (message) =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;

/** Question de compatibilité (lien discret sur la fiche produit) — ne sert plus à commander. */
export const buildQuestionUrl = (product) =>
  whatsappUrl(
    `Bonjour MIROTECH, j'ai une question sur « ${product.name} » : pouvez-vous confirmer la compatibilité avec mon véhicule / mon appareil ?`,
  );
