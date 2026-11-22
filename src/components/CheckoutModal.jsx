import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, ShoppingBag, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useDialog } from "../lib/useDialog";
import { money } from "../lib/format";
import { ORDERS_API_URL, newRequestId, ordersEnabled, submitOrder } from "../lib/orders";
import {
  LIMITS,
  normalizeMoroccanPhone,
  limitAddress,
  sanitizeName,
  sanitizePhone,
  validateOrderForm,
} from "../lib/validation";

const EMPTY = { name: "", phone: "", address: "" };
const SANITIZERS = { name: sanitizeName, phone: sanitizePhone, address: limitAddress };
const FIELD_ORDER = ["name", "phone", "address"];

export default function CheckoutModal({ apiUrl = ORDERS_API_URL }) {
  const { cart, lines, count, total, checkoutOpen, closeCheckout, clear } = useCart();
  const ref = useRef(null);
  const requestIdRef = useRef(newRequestId()); // reste identique tant que la commande n'a pas abouti
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [orderId, setOrderId] = useState("");
  const [honeypot, setHoneypot] = useState("");
  // Les saisies restent en mémoire tant que la page est ouverte, même si la fenêtre est fermée.
  const [values, setValues] = useState(EMPTY);

  const bind = (field) => ({
    id: `co-${field}`,
    name: field,
    value: values[field],
    disabled: status === "sending",
    maxLength: LIMITS[field],
    "aria-invalid": fieldErrors[field] ? "true" : undefined,
    "aria-describedby": fieldErrors[field] ? `co-${field}-err` : undefined,
    onChange: (e) => {
      const clean = SANITIZERS[field](e.target.value);
      setValues((v) => ({ ...v, [field]: clean }));
      if (fieldErrors[field]) setFieldErrors((f) => ({ ...f, [field]: undefined }));
    },
  });
  const fieldError = (field) =>
    fieldErrors[field] ? (
      <small className="field-error" id={`co-${field}-err`} role="alert">
        {fieldErrors[field]}
      </small>
    ) : null;

  const close = () => {
    if (status === "sending") return;
    if (status === "done") {
      setStatus("idle");
      setOrderId("");
    }
    setError("");
    setFieldErrors({});
    closeCheckout();
  };
  useDialog(checkoutOpen, close, ref);

  if (!checkoutOpen) return null;

  const viaApi = ordersEnabled(apiUrl);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    if (count === 0) return setError("Votre panier est vide.");

    const errors = validateOrderForm(values);
    setFieldErrors(errors);
    const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(`co-${firstInvalid}`)?.focus();
      return;
    }
    if (!viaApi) {
      return setError("La prise de commande en ligne n'est pas encore activée. Merci de réessayer bientôt.");
    }

    setStatus("sending");
    try {
      const customer = { ...values, phone: normalizeMoroccanPhone(values.phone) };
      const res = await submitOrder(cart, customer, { url: apiUrl, website: honeypot, requestId: requestIdRef.current });
      requestIdRef.current = newRequestId();
      setOrderId(res.orderId || "");
      setValues(EMPTY);
      clear();
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(`${err.message} Votre commande n'a pas été envoyée : vérifiez votre connexion puis réessayez.`);
    }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" ref={ref} tabIndex={-1}>
        <button className="icon-button modal-close" onClick={close} aria-label="Fermer">
          <X size={18} aria-hidden="true" />
        </button>

        {status === "done" ? (
          <div className="checkout-done" role="status">
            <CheckCircle2 size={48} aria-hidden="true" />
            <h2 id="checkoutTitle">Votre commande a été envoyée !</h2>
            {orderId && (
              <p className="order-id">
                N° de commande : <strong>{orderId}</strong>
              </p>
            )}
            <p className="checkout-note">
              Merci ! MIROTECH vous contactera très bientôt pour confirmer la disponibilité, la livraison et les frais. Le
              paiement se fait à la livraison.
            </p>
            {orderId && (
              <Link className="button button-outline" to="/suivi-commande" state={{ orderId }} onClick={close}>
                Suivre ma commande
              </Link>
            )}
            <button className="button button-primary" onClick={close}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">DERNIÈRE ÉTAPE</p>
            <h2 id="checkoutTitle">Préparer votre commande</h2>
            <p className="checkout-note">
              Renseignez vos coordonnées. Votre commande sera transmise à MIROTECH, qui vous contactera pour la confirmer. Le
              paiement se fait à la livraison.
            </p>

            {lines.length > 0 && (
              <ul className="checkout-summary" aria-label="Récapitulatif de la commande">
                {lines.map((l) => (
                  <li key={l.key}>
                    <span>
                      {l.product.name} <small>{l.variant.label} × {l.qty}</small>
                    </span>
                    <b>{money(l.lineTotal)}</b>
                  </li>
                ))}
                <li className="checkout-total">
                  <span>Sous-total</span>
                  <b>{money(total)}</b>
                </li>
              </ul>
            )}

            <form onSubmit={onSubmit} noValidate>
              <label htmlFor="co-name">Nom ou prénom</label>
              <input {...bind("name")} required autoComplete="name" placeholder="Ex. Sara" />
              {fieldError("name")}

              <label htmlFor="co-phone">Téléphone</label>
              <input {...bind("phone")} type="tel" required inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" />
              {fieldError("phone")}

              <label htmlFor="co-address">Ville et adresse</label>
              <textarea {...bind("address")} required autoComplete="street-address" placeholder="Ville, quartier, rue, n° d'immeuble, repère" />
              <small className="char-count" aria-hidden="true">
                {values.address.length}/{LIMITS.address}
              </small>
              {fieldError("address")}

              {/* Champ piège anti-robots : invisible pour les humains. */}
              <div className="hp-field" aria-hidden="true">
                <label>
                  Ne pas remplir
                  <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
              </div>

              <button className="button button-primary" type="submit" disabled={count === 0 || status === "sending"}>
                {status === "sending" ? (
                  <>
                    <Loader2 size={16} className="spin" aria-hidden="true" /> Envoi en cours…
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} aria-hidden="true" /> Commander
                  </>
                )}
              </button>
              {error && (
                <p className="form-status form-error" role="alert">
                  {error}
                </p>
              )}
              <p className="privacy-note">Vos coordonnées servent uniquement à traiter et livrer votre commande.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
