import { Minus, Plus } from "lucide-react";

/** Sélecteur de quantité (panier et fiche produit). `onChange` reçoit la nouvelle valeur. */
export default function QtyStepper({ value, onChange, min = 1, max = 99, label = "", size = "md" }) {
  const dec = () => onChange(value - 1);
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className={`stepper stepper-${size}`} role="group" aria-label={label ? `Quantité : ${label}` : "Quantité"}>
      <button type="button" onClick={dec} disabled={value <= min && min > 0} aria-label={`Diminuer la quantité${label ? ` de ${label}` : ""}`}>
        <Minus size={size === "sm" ? 13 : 15} aria-hidden="true" />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={inc} disabled={value >= max} aria-label={`Augmenter la quantité${label ? ` de ${label}` : ""}`}>
        <Plus size={size === "sm" ? 13 : 15} aria-hidden="true" />
      </button>
    </div>
  );
}
