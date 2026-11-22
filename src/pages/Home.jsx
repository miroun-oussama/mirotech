import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronDown,
  ClipboardList,
  MessageCircle,
  Minimize2,
  MousePointerClick,
  PackageCheck,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";
import InstagramIcon from "../components/InstagramIcon";
import MirotechHero from "../components/MirotechHero";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import { CATEGORIES, products } from "../data/products";
import { SITE } from "../lib/format";
import { usePageMeta } from "../lib/usePageMeta";

const DESCRIPTION =
  "Découvrez la sélection MIROTECH : AI Box Android, adaptateurs CarPlay & Android Auto et solutions de recharge sans fil.";

const BENEFITS = [
  [Wifi, "Connectivité sans fil", "Retrouvez une expérience plus fluide avec les accessoires compatibles sans fil."],
  [Zap, "Recharge centralisée", "Des solutions multi-appareils pour organiser votre espace de recharge."],
  [Minimize2, "Formats compacts", "Des accessoires conçus pour s'intégrer facilement à votre environnement."],
  [Sparkles, "Usage simplifié", "Des fonctions pratiques et une sélection axée sur l'essentiel."],
];

// Déroulé réel de la commande sur ce site.
const STEPS = [
  [MousePointerClick, "Choisissez", "Sélectionnez votre produit, sa version et la quantité sur la fiche détaillée."],
  [ClipboardList, "Commandez", "Indiquez votre nom, votre téléphone et votre adresse : votre commande est transmise à MIROTECH."],
  [PackageCheck, "Recevez et payez", "MIROTECH vous contacte pour confirmer. Vous réglez à la livraison, à la réception."],
];

// Réponses reprises des informations déjà publiées par MIROTECH (fiches produit, livraison, paiement, retours).
const FAQ = [
  [
    "Comment passer commande ?",
    "Ouvrez la fiche du produit, choisissez la version et la quantité, puis cliquez sur « Commander maintenant ». Renseignez vos coordonnées : votre commande est envoyée à MIROTECH, qui vous contacte pour la confirmer.",
  ],
  ["Comment se passe le paiement ?", "Réglez votre commande à la réception (paiement à la livraison / COD)."],
  ["Quels sont les frais et délais de livraison ?", "Les frais et délais sont à confirmer selon la destination avant validation de la commande."],
  [
    "Mon véhicule est-il compatible ?",
    "Pour les AI Box Android, la compatibilité est annoncée pour les véhicules à partir de 2018 ; la présence d'un système CarPlay filaire d'origine et la compatibilité exacte du modèle doivent être vérifiées avant achat. L'adaptateur sans fil 2-en-1 nécessite un véhicule disposant déjà de CarPlay ou d'Android Auto filaire d'origine : il ne remplace pas un système absent. En cas de doute, posez la question à MIROTECH avant de commander.",
  ],
  ["Quelles sont les conditions de retour ?", "Contactez MIROTECH pour connaître les conditions applicables à votre achat."],
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function Home() {
  usePageMeta({ title: "MIROTECH — La technologie, simplement.", description: DESCRIPTION, canonical: `${SITE.url}/` });
  const [params, setParams] = useSearchParams();
  const active = CATEGORIES.find((c) => c.id === params.get("categorie")) ?? null;
  const list = active ? products.filter((p) => p.categories.includes(active.value)) : products;

  const pick = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set("categorie", id);
    else next.delete("categorie");
    setParams(next, { replace: true, state: { noScroll: true } });
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      <MirotechHero />

      <section className="section catalog-section" id="catalogue">
        <Reveal className="section-heading catalog-heading">
          <div>
            <p className="eyebrow">LA SÉLECTION MIROTECH</p>
            <h2>
              Nos essentiels <em>tech.</em>
            </h2>
          </div>
          <p>Des solutions simples et utiles, sélectionnées pour accompagner votre quotidien.</p>
        </Reveal>
        <div className="filters" role="group" aria-label="Filtrer les produits">
          <button className={`filter${active ? "" : " active"}`} aria-pressed={!active} onClick={() => pick(null)}>
            Tout voir <span>{String(products.length).padStart(2, "0")}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`filter${active?.id === c.id ? " active" : ""}`}
              aria-pressed={active?.id === c.id}
              onClick={() => pick(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="product-grid" aria-live="polite">
          {list.length ? (
            list.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.07}>
                <ProductCard product={p} />
              </Reveal>
            ))
          ) : (
            <p className="no-products">Aucun produit dans cette catégorie pour le moment.</p>
          )}
        </div>
      </section>

      <section className="section steps-section" id="comment-commander">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">SIMPLE ET RAPIDE</p>
            <h2>
              Commander en <em>3 étapes.</em>
            </h2>
          </div>
          <p>Pas de compte à créer : vous choisissez, vous commandez, vous payez à la réception.</p>
        </Reveal>
        <ol className="steps">
          {STEPS.map(([Icon, title, text], i) => (
            <Reveal as="li" key={title} delay={i * 0.1} className="step">
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="step-icon" aria-hidden="true">
                <Icon size={24} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="feature-band">
        <div className="feature-visual">
          <img src="/assets/chargeur-5-en-1-03.jpg" alt="Station de recharge sans fil multi-appareils" loading="lazy" />
          <span className="visual-tag">MIROTECH / DAILY TECH</span>
        </div>
        <Reveal className="feature-copy" y={16}>
          <p className="eyebrow">UN QUOTIDIEN PLUS FLUIDE</p>
          <h2>
            Moins de contraintes.
            <br />
            <em>Plus de possibilités.</em>
          </h2>
          <p>
            La bonne technologie n'a pas besoin d'être compliquée. Elle doit simplement trouver sa place dans votre vie :
            dans votre voiture, sur votre bureau ou à la maison.
          </p>
          <a href="#catalogue" className="text-link">
            Voir les produits <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </Reveal>
      </section>

      <section className="section benefits-section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">L'ESSENTIEL, BIEN PENSÉ</p>
            <h2>
              La tech à votre <em>rythme.</em>
            </h2>
          </div>
          <p>Des fonctions utiles, présentées clairement pour vous aider à choisir le bon accessoire.</p>
        </Reveal>
        <div className="benefit-grid">
          {BENEFITS.map(([Icon, title, text], i) => (
            <Reveal as="article" key={title} delay={i * 0.08}>
              <span className="benefit-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">QUESTIONS FRÉQUENTES</p>
            <h2>
              Avant de <em>commander.</em>
            </h2>
          </div>
          <p>Les réponses aux questions qui reviennent le plus souvent sur la commande, la livraison et la compatibilité.</p>
        </Reveal>
        <Reveal className="faq-list">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>
                {q} <ChevronDown size={18} aria-hidden="true" className="chev" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      <section className="contact-section" id="contact">
        <div>
          <p className="eyebrow">UNE QUESTION ?</p>
          <h2>
            On vous aide à
            <br />
            <em>faire le bon choix.</em>
          </h2>
        </div>
        <div className="contact-side">
          <p>
            Besoin de vérifier la compatibilité d'un produit ou d'obtenir plus d'informations ? Retrouvez MIROTECH sur
            WhatsApp ou Instagram.
          </p>
          <div className="contact-actions">
            <a className="button button-primary" href={`https://wa.me/${SITE.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> Écrire sur WhatsApp
            </a>
            <a className="button button-outline" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={16} /> Instagram
            </a>
            <Link className="button button-outline" to="/suivi-commande">
              <PackageCheck size={16} aria-hidden="true" /> Suivre ma commande
            </Link>
          </div>
          <span className="contact-handle">
            WhatsApp : {SITE.whatsappDisplay} · Instagram : {SITE.instagramHandle}
          </span>
        </div>
      </section>
    </>
  );
}
