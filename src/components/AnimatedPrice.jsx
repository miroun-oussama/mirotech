import NumberFlow from "@number-flow/react";
import { money } from "../lib/format";

/** Prix dont les chiffres défilent quand il change ; texte simple si le navigateur ne sait pas animer. */
export default function AnimatedPrice({ value }) {
  if (typeof Element.prototype.animate !== "function") return money(value);
  return <NumberFlow value={value} locales="fr-FR" suffix=" DH" />;
}
