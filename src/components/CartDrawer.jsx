import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import QtyStepper from "./QtyStepper";
import { useCart } from "../context/CartContext";
import { minPrice, products } from "../data/products";
import { useDialog } from "../lib/useDialog";
import { money } from "../lib/format";

export default function CartDrawer() {
  const { lines, count, total, cartOpen, closeCart, openCheckout, setQty, removeItem } = useCart();
  const ref = useRef(null);
  useDialog(cartOpen, closeCart, ref);
  const empty = lines.length === 0;

  return (
    <>
      <div className={`overlay${cartOpen ? " show" : ""}`} onClick={closeCart} aria-hidden="true" />
      <aside
        ref={ref}
        tabIndex={-1}
        className={`cart-drawer${cartOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cartTitle"
        inert={!cartOpen}
      >
        <div className="drawer-head">
          <div>
            <p className="eyebrow">VOTRE SÉLECTION</p>
            <h2 id="cartTitle">
              Mon panier <span>({count})</span>
            </h2>
          </div>
          <button className="icon-button" onClick={closeCart} aria-label="Fermer le panier">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {empty ? (
          <div className="cart-empty">
            <ShoppingBag size={40} aria-hidden="true" className="empty-icon" />
            <h3>Votre panier est vide</h3>
            <p>Ajoutez un accessoire pour commencer.</p>
            <ul className="cart-suggest" aria-label="Produits à découvrir">
              {products.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <Link to={`/produit/${p.id}`} onClick={closeCart}>
                    <img src={p.image} alt="" loading="lazy" style={p.fit ? { objectFit: p.fit } : undefined} />
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.variants.length > 1 ? "Dès " : ""}
                        {money(minPrice(p))}
                      </small>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map((l) => {
                const to = `/produit/${l.product.id}`;
                return (
                  <li className="cart-line" key={l.key}>
                    <Link to={to} onClick={closeCart} className="cart-line-img" tabIndex={-1} aria-hidden="true">
                      <img src={l.product.image} alt="" style={l.product.fit ? { objectFit: l.product.fit } : undefined} />
                    </Link>
                    <div className="cart-line-body">
                      <h4>
                        <Link to={to} onClick={closeCart}>
                          {l.product.name}
                        </Link>
                      </h4>
                      <p className="cart-line-variant">{l.variant.label}</p>
                      <p className="cart-line-unit">{money(l.variant.price)} l'unité</p>
                      <div className="cart-line-actions">
                        <QtyStepper value={l.qty} min={0} size="sm" label={l.product.name} onChange={(q) => setQty(l.key, q)} />
                        <button className="remove-item" onClick={() => removeItem(l.key)} aria-label={`Retirer ${l.product.name} du panier`}>
                          <Trash2 size={13} aria-hidden="true" /> Retirer
                        </button>
                      </div>
                    </div>
                    <strong className="cart-line-total">{money(l.lineTotal)}</strong>
                  </li>
                );
              })}
            </ul>

            <div className="cart-summary">
              <dl className="cart-totals">
                <div>
                  <dt>Sous-total</dt>
                  <dd>{money(total)}</dd>
                </div>
                <div>
                  <dt>Livraison</dt>
                  <dd className="muted">À confirmer</dd>
                </div>
              </dl>
              <ul className="cart-assure">
                <li>
                  <Banknote size={15} aria-hidden="true" /> Paiement à la livraison
                </li>
                <li>
                  <Truck size={15} aria-hidden="true" /> Frais confirmés selon votre destination
                </li>
              </ul>
              <button className="button button-primary checkout-open" onClick={openCheckout}>
                Commander · {money(total)} <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button className="text-link continue-link" onClick={closeCart}>
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
