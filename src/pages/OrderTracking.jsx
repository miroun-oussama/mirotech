import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Loader2, MessageCircle, PackageCheck, Search } from "lucide-react";
import { SITE } from "../lib/format";
import { trackOrder } from "../lib/orders";
import { usePageMeta } from "../lib/usePageMeta";
import { normalizeMoroccanPhone } from "../lib/validation";

const STATUS_TONES = new Map([
  ["Nouvelle", "new"],
  ["Confirmée", "confirmed"],
  ["Livrée", "delivered"],
  ["Annulée", "cancelled"],
]);

export default function OrderTracking() {
  usePageMeta({ title: "Suivre ma commande — MIROTECH", robots: "noindex, follow" });
  const { state } = useLocation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const orderId = String(form.get("orderId")).trim().toUpperCase();
    const phone = normalizeMoroccanPhone(form.get("phone"));
    if (!/^MT-\d{6}-\d{4}$/.test(orderId) || !phone) {
      setResult({ error: "Vérifiez le numéro de commande et le téléphone." });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { status } = await trackOrder(orderId, phone);
      setResult({ orderId, status });
    } catch (error) {
      setResult({ error: error.message === "Action inconnue." ? "Le suivi est momentanément indisponible." : error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section tracking-page" aria-labelledby="tracking-title">
      <Link className="tracking-back" to="/#contact"><ArrowLeft size={16} aria-hidden="true" /> Retour à Contact</Link>
      <div className="tracking-card">
        <div className="tracking-icon"><PackageCheck size={25} aria-hidden="true" /></div>
        <h1 id="tracking-title">Suivre ma commande</h1>
        <p className="tracking-intro">Retrouvez le statut de votre commande avec son numéro et le téléphone utilisé lors de l’achat.</p>
        <form className="tracking-form" onSubmit={handleSubmit} aria-busy={loading}>
          <label>
            Numéro de commande
            <input name="orderId" placeholder="MT-261122-0001" defaultValue={state?.orderId || ""} autoCapitalize="characters" spellCheck={false} required maxLength={14} disabled={loading} />
          </label>
          <label>
            Téléphone
            <input name="phone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" required maxLength={18} disabled={loading} />
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
            {loading ? "Recherche…" : "Voir le statut"}
          </button>
        </form>
        {result?.error && <p className="form-status form-error" role="alert">{result.error}</p>}
        {result?.status && (
          <div className="tracking-result" role="status">
            <div><small>Numéro de commande</small><strong>{result.orderId}</strong></div>
            <span className={`status status-${STATUS_TONES.get(result.status) ?? "other"}`}>{result.status}</span>
          </div>
        )}
        <div className="tracking-contact">
          <span>Besoin d’aide ?</span>
          <a href={"https://wa.me/" + SITE.whatsappNumber} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={16} aria-hidden="true" /> Écrire sur WhatsApp <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
