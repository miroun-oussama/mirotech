import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { categoryLabelFor, minPrice } from "../data/products";
import { money } from "../lib/format";

export default function ProductCard({ product: p }) {
  const to = `/produit/${p.id}`;
  return (
    <Link className="product-card" to={to} aria-label={p.name}>
      <div className="product-image">
        <img src={p.image} alt="" loading="lazy" style={p.fit ? { objectFit: p.fit } : undefined} />
        <span className="product-tag">{p.label}</span>
      </div>
      <div className="product-info">
        <span className="product-category">{categoryLabelFor(p)}</span>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <div className="product-bottom">
          <span className="product-price">
            {p.variants.length > 1 && <small>Dès </small>}
            {money(minPrice(p))}
          </span>
          <span className="add-button" aria-hidden="true">
            <Plus size={18} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
