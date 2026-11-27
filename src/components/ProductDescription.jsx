/** Description détaillée d'un produit : un bloc par langue (titre, texte, points forts, compatibilité). */
export default function ProductDescription({ blocks }) {
  return (
    <div className="product-description">
      {blocks.map((b) => (
        <section key={b.lang} lang={b.lang} dir={b.lang === "ar" ? "rtl" : "ltr"}>
          <h2>{b.title}</h2>
          <p>{b.text}</p>
          <ul>
            {b.points.map(([icon, label]) => (
              <li key={label}>
                <span aria-hidden="true">{icon}</span> {label}
              </li>
            ))}
          </ul>
          <p className="product-description-note">{b.note}</p>
        </section>
      ))}
    </div>
  );
}
