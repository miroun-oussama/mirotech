import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check, Loader2, PackageCheck, RotateCcw, Search, XCircle } from "lucide-react";
import { SITE } from "../lib/format";
import { trackOrder } from "../lib/orders";
import { usePageMeta } from "../lib/usePageMeta";
import { LIMITS, normalizeMoroccanPhone, sanitizePhone } from "../lib/validation";
import WhatsAppIcon from "../components/WhatsAppIcon";

const ORDER_ID_RE = /^MT-\d{6}-\d{4}$/;

const STEPS = ["Reçue", "Confirmation", "Livraison"];

// step = nombre d'étapes terminées (0 à 3). « Annulée » et les statuts inconnus n'avancent pas la frise.
const STATUS_INFO = new Map([
  ["Nouvelle", { tone: "new", step: 1, text: "Nous avons bien reçu votre commande. Nous vous appelons très vite pour la confirmer." }],
  ["Confirmée", { tone: "confirmed", step: 2, text: "Votre commande est confirmée. Elle est en cours de préparation avant la livraison." }],
  ["Livrée", { tone: "delivered", step: 3, text: "Votre commande a été livrée. Merci de votre confiance !" }],
  ["Annulée", { tone: "cancelled", step: 0, text: "Cette commande a été annulée. Une question ? Écrivez-nous, nous vous répondons rapidement." }],
]);
const FALLBACK_INFO = { tone: "other", step: 1, text: "Votre commande est en cours de traitement." };

/** Aide à la saisie : « mt 261122 0001 » → « MT-261122-0001 ». */
function formatOrderId(value) {
  const compact = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = compact.match(/^(MT)?(\d{0,6})(\d{0,4})/);
  if (!m || !compact.startsWith("MT")) return String(value).toUpperCase().slice(0, 14);
  return ["MT", m[2], m[3]].filter(Boolean).join("-");
}

export default function OrderTracking() {
  usePageMeta({ title: "Suivre ma commande — MIROTECH", robots: "noindex, follow" });
  const { state } = useLocation();
  const [orderId, setOrderId] = useState(() => formatOrderId(state?.orderId || ""));
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const orderRef = useRef(null);
  const phoneRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    const id = orderId.trim().toUpperCase();
    const normalized = normalizeMoroccanPhone(phone);
    const next = {};
    if (!ORDER_ID_RE.test(id)) next.orderId = "Format attendu : MT-261122-0001 (indiqué dans votre confirmation).";
    if (!normalized) next.phone = "Entrez un numéro marocain valide, ex. 06 12 34 56 78.";
    setErrors(next);
    setResult(null);
    if (next.orderId || next.phone) {
      (next.orderId ? orderRef : phoneRef).current?.focus();
      return;
    }

    setLoading(true);
    try {
      const { status } = await trackOrder(id, normalized);
      setResult({ orderId: id, status });
    } catch (error) {
      setResult({ error: error.message === "Action inconnue." ? "Le suivi est momentanément indisponible." : error.message });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setErrors({});
    setOrderId("");
    setPhone("");
    orderRef.current?.focus();
  }

  const info = result?.status ? STATUS_INFO.get(result.status) ?? FALLBACK_INFO : null;
  const helpText = result?.orderId ? `Bonjour, une question sur ma commande ${result.orderId}.` : "Bonjour, une question sur ma commande.";

  return (
    <section className="section tracking-page" aria-labelledby="tracking-title">
      <Link className="tracking-back" to="/#contact"><ArrowLeft size={16} aria-hidden="true" /> Retour à Contact</Link>
      <div className="tracking-card">
        <div className="tracking-icon"><PackageCheck size={25} aria-hidden="true" /></div>
        <h1 id="tracking-title">Suivre ma commande</h1>
        <p className="tracking-intro">Retrouvez le statut de votre commande avec son numéro et le téléphone utilisé lors de l’achat.</p>

        {!result?.status && (
          <form className="tracking-form" onSubmit={handleSubmit} aria-busy={loading} noValidate>
            <div className="tracking-field">
              <label htmlFor="tracking-orderId">Numéro de commande</label>
              <input
                id="tracking-orderId"
                ref={orderRef}
                name="orderId"
                value={orderId}
                onChange={(e) => setOrderId(formatOrderId(e.target.value))}
                placeholder="MT-261122-0001"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={14}
                disabled={loading}
                aria-invalid={Boolean(errors.orderId)}
                aria-describedby={errors.orderId ? "tracking-orderId-error" : undefined}
              />
              {errors.orderId && <span className="field-error" id="tracking-orderId-error">{errors.orderId}</span>}
            </div>
            <div className="tracking-field">
              <label htmlFor="tracking-phone">Téléphone</label>
              <input
                id="tracking-phone"
                ref={phoneRef}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                placeholder="06 12 34 56 78"
                maxLength={LIMITS.phone}
                disabled={loading}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "tracking-phone-error" : undefined}
              />
              {errors.phone && <span className="field-error" id="tracking-phone-error">{errors.phone}</span>}
            </div>
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
              {loading ? "Recherche…" : "Voir le statut"}
            </button>
          </form>
        )}

        {result?.error && <p className="form-status form-error" role="alert">{result.error}</p>}

        {info && (
          <div className="tracking-result" role="status">
            <div className="tracking-result-head">
              <div><small>Numéro de commande</small><strong>{result.orderId}</strong></div>
              <span className={`status status-${info.tone}`}>{result.status}</span>
            </div>
            {info.tone === "cancelled" ? (
              <p className="tracking-cancelled"><XCircle size={18} aria-hidden="true" /> {info.text}</p>
            ) : (
              <>
                <ol className="tracking-steps" aria-label="Avancement de la commande">
                  {STEPS.map((label, index) => {
                    const done = index < info.step;
                    const current = index === info.step - 1 && info.step < STEPS.length;
                    return (
                      <li key={label} className={done ? (current ? "done current" : "done") : ""} aria-current={current ? "step" : undefined}>
                        <span className="tracking-dot">{done ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ol>
                <p className="tracking-message">{info.text}</p>
              </>
            )}
            <button className="button button-outline tracking-again" type="button" onClick={reset}>
              <RotateCcw size={15} aria-hidden="true" /> Suivre une autre commande
            </button>
          </div>
        )}

        <div className="tracking-contact">
          <span>Besoin d’aide ?</span>
          <a href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(helpText)}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={16} /> Écrire sur WhatsApp <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
