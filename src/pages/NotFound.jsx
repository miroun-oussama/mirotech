import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

export default function NotFound() {
  usePageMeta({ title: "Page introuvable — MIROTECH", robots: "noindex" });
  return (
    <div className="section not-found">
      <p className="eyebrow">ERREUR 404</p>
      <h1>
        Cette page <em>n'existe pas.</em>
      </h1>
      <p>Le produit ou la page demandée est introuvable. Retrouvez toute la sélection MIROTECH sur la boutique.</p>
      <Link className="button button-primary" to="/#catalogue">
        Retour à la boutique <span>↗</span>
      </Link>
    </div>
  );
}
