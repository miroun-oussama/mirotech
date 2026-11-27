import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { FREE_DELIVERY_MESSAGE } from "../lib/delivery";

const NAV = [
  ["/#catalogue", "Boutique"],
  ["/#categories", "Catégories"],
  ["/#contact", "Contact"],
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart } = useCart();
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  // Sur l'accueil, les ancres gardent le filtre de catégorie actif.
  const anchor = (to) => ({ pathname: "/", search: pathname === "/" ? search : "", hash: to.slice(1) });

  return (
    <>
      <div className="announcement">{FREE_DELIVERY_MESSAGE}</div>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="MIROTECH, accueil" onClick={() => setMenuOpen(false)}>
          <img src="/assets/mirotech-logo-transparent.png" alt="MIROTECH" className="brand-logo" />
        </Link>
        <nav className={`main-nav${menuOpen ? " open" : ""}`} aria-label="Navigation principale">
          {NAV.map(([to, label]) => (
            <Link key={to} to={anchor(to)} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        <button className="cart-trigger" onClick={openCart} aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`}>
          <ShoppingBag size={19} aria-hidden="true" />
          <span>Panier</span>
          <b>{count}</b>
        </button>
        <button
          className="menu-toggle"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span></span>
          <span></span>
        </button>
      </header>
    </>
  );
}
