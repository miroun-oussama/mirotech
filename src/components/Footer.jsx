import { Link } from "react-router-dom";
import { SITE } from "../lib/format";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link className="brand brand-footer" to="/">
          <img src="/assets/mirotech-logo-transparent.png" alt="MIROTECH" className="brand-logo" />
        </Link>
        <p>
          Accessoires électroniques
          <br />& technologie automobile.
        </p>
        <button className="back-top" onClick={() => window.scrollTo({ top: 0 })}>
          RETOUR EN HAUT ↑
        </button>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MIROTECH. Tous droits réservés.</span>
        <span>TECHNOLOGIE • CONNECTIVITÉ • QUOTIDIEN</span>
        <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
          INSTAGRAM ↗
        </a>
      </div>
    </footer>
  );
}
