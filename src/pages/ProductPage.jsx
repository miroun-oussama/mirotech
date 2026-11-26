import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Banknote, ChevronDown, LifeBuoy, MessageCircle, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductGallery from "../components/ProductGallery";
import QtyStepper from "../components/QtyStepper";
import NotFound from "./NotFound";
import { useCart } from "../context/CartContext";
import { categoryLabelFor, getProduct, products } from "../data/products";
import { SITE, money } from "../lib/format";
import { usePageMeta } from "../lib/usePageMeta";
import { buildQuestionUrl } from "../lib/whatsapp";

export default function ProductPage() {
  const { id } = useParams();
  const product = getProduct(id);
  // Remet la sélection à zéro quand on passe d'un produit à un autre.
  return product ? <ProductView key={product.id} product={product} /> : <NotFound />;
}

function ProductView({ product }) {
  const { addItem, buyNow } = useCart();
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const variant = product.variants[variantIndex];
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  useEffect(() => {
  if (typeof window.fbq !== "function") return;

  window.fbq("track", "ViewContent", {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    value: variant.price,
    currency: "MAD",
    contents: [
      {
        id: product.id,
        quantity: 1,
        item_price: variant.price,
      },
    ],
  });
}, [product.id, variantIndex]);
  usePageMeta({
    title: `${product.name} — MIROTECH`,
    description: product.description,
    canonical: `${SITE.url}/produit/${product.id}`,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.gallery.map((src) => `${SITE.url}${src}`),
    brand: { "@type": "Brand", name: SITE.name },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      name: v.label,
      price: v.price,
      priceCurrency: "MAD",
      url: `${SITE.url}/produit/${product.id}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <div className="section product-page">
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link> <span aria-hidden="true">/</span> <Link to="/#catalogue">Boutique</Link>{" "}
          <span aria-hidden="true">/</span> <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-layout">
          <ProductGallery images={product.gallery} name={product.name} fit={product.fit} startIndex={Math.max(0, product.gallery.indexOf(product.image))} />

          <div className="product-detail">
            <p className="eyebrow">{product.label}</p>
            <h1>{product.name}</h1>
            <p className="product-kind">{categoryLabelFor(product)}</p>
            <p className="product-lead">{product.description}</p>

            {product.variants.length > 1 ? (
              <fieldset className="variant-picker">
                <legend>Choisir une version</legend>
                <div>
                  {product.variants.map((v, i) => (
                    <button
                      key={v.label}
                      type="button"
                      className={`variant${i === variantIndex ? " active" : ""}`}
                      aria-pressed={i === variantIndex}
                      onClick={() => setVariantIndex(i)}
                    >
                      <span>{v.label}</span>
                      <b>{money(v.price)}</b>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="product-kind">Version : {variant.label}</p>
            )}

            <div className="price-row" aria-live="polite">
              <div className="modal-price">{money(variant.price * qty)}</div>
              {qty > 1 && (
                <span className="price-detail">
                  {qty} × {money(variant.price)}
                </span>
              )}
            </div>

            <div className="buy-row">
              <QtyStepper value={qty} min={1} max={99} label={product.name} onChange={setQty} />
              <button className="button button-primary product-buy" onClick={() => buyNow(product.id, variantIndex, qty)}>
                <ShoppingBag size={18} aria-hidden="true" /> Commander maintenant
              </button>
            </div>
            <button className="button button-outline product-add" onClick={() => addItem(product.id, variantIndex, qty)}>
              Ajouter au panier <Plus size={18} aria-hidden="true" />
            </button>

            <ul className="assurances">
              <li>
                <Banknote size={18} aria-hidden="true" /> Paiement à la livraison (COD)
              </li>
              <li>
                <ShoppingBag size={18} aria-hidden="true" /> Commande confirmée par MIROTECH
              </li>
              <li>
                <Truck size={18} aria-hidden="true" /> Frais et délais confirmés selon votre destination
              </li>
            </ul>

            <div className="compat-box">
              <strong>
                <ShieldCheck size={15} aria-hidden="true" /> Compatibilité
              </strong>
              <p>{product.compat}</p>
              <a className="inline-link compat-ask" href={buildQuestionUrl(product)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={13} aria-hidden="true" /> Un doute ? Posez la question sur WhatsApp
              </a>
            </div>

            <div className="info-accordion">
              <details>
                <summary>
                  <Truck size={16} aria-hidden="true" /> Livraison <ChevronDown size={16} aria-hidden="true" className="chev" />
                </summary>
                <p>Les frais et délais sont à confirmer selon la destination avant validation de la commande.</p>
              </details>
              <details>
                <summary>
                  <Banknote size={16} aria-hidden="true" /> Paiement à la livraison{" "}
                  <ChevronDown size={16} aria-hidden="true" className="chev" />
                </summary>
                <p>Réglez votre commande à la réception (paiement à la livraison / COD).</p>
              </details>
              <details>
                <summary>
                  <LifeBuoy size={16} aria-hidden="true" /> Retours &amp; assistance{" "}
                  <ChevronDown size={16} aria-hidden="true" className="chev" />
                </summary>
                <p>Contactez MIROTECH pour connaître les conditions applicables à votre achat.</p>
              </details>
            </div>
          </div>
        </div>

        <section aria-labelledby="related-products-title">
          <h2 className="related-title" id="related-products-title">
            Dans la même <em>sélection.</em>
          </h2>
          <div className="product-grid related-grid">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      </div>

      <div className="buy-bar" role="region" aria-label="Achat rapide">
        <div>
          <span>
            {variant.label}
            {qty > 1 ? ` × ${qty}` : ""}
          </span>
          <strong>{money(variant.price * qty)}</strong>
        </div>
        <button className="button button-primary" onClick={() => buyNow(product.id, variantIndex, qty)}>
          Commander <ShoppingBag size={16} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
