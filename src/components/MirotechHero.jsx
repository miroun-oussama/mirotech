import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BatteryCharging,
  CarFront,
  Headphones,
  Package,
  Radio,
  ShoppingBag,
} from "lucide-react";
import { CATEGORIES } from "../data/products";

const CATEGORY_ICONS = {
  auto: CarFront,
  recharge: BatteryCharging,
  telephone: Radio,
  gadgets: Package,
};

// Seuls des points déjà annoncés par MIROTECH : paiement à la livraison, commande, conseils.
const BENEFITS = [
  { icon: Banknote, title: "Paiement à la livraison", desc: "Réglez à la réception" },
  { icon: ShoppingBag, title: "Commande en ligne", desc: "Confirmée par MIROTECH" },
  { icon: Headphones, title: "Conseils & compatibilité", desc: "WhatsApp et Instagram" },
];

export default function MirotechHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#080d0d] text-white" id="accueil">
      {/* Lumières d'ambiance */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <picture>
          <source media="(max-width: 767px)" srcSet="/assets/hero-vagues-neon-mobile.webp" />
          <img
            src="/assets/hero-vagues-neon.webp"
            alt=""
            width="1672"
            height="941"
            className="h-full w-full object-cover object-[60%_center]"
          />
        </picture>
        {/* Voile sombre : garde le texte lisible à gauche, laisse respirer les vagues à droite */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,13,0.82)_0%,rgba(8,13,13,0.45)_45%,rgba(8,13,13,0.1)_100%)] max-md:bg-[#080d0d]/55" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#111315] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 pb-8 pt-6 sm:px-8 sm:pt-10 lg:px-12 lg:pt-24">
        <div className="grid items-center gap-5 sm:gap-8 lg:min-h-[580px] lg:grid-cols-[47%_53%] lg:gap-0">
          {/* Texte */}
          <div className="relative z-20 max-lg:[text-shadow:0_2px_16px_rgba(0,0,0,0.85)]">
            <div className="mb-6 inline-flex lg:mb-8 flex-wrap items-center gap-2 rounded-full border border-lime-400/40 bg-lime-400/5 px-4 py-2 text-xs font-medium text-white sm:text-sm">
              <CarFront size={17} className="text-lime-400" aria-hidden="true" />
              Accessoires Auto
              <span className="text-lime-400">•</span>
              Connectivité
              <span className="text-lime-400">•</span>
              Innovation
            </div>

            <h1 className="max-w-[660px] text-[clamp(2.8rem,5vw,5.4rem)] font-bold leading-[1.05] tracking-[-0.055em]">
              La technologie
              <br />
              qui <span className="text-[#c4f000]">simplifie</span>
              <br />
              vos journées.
            </h1>

            <p className="mt-5 max-w-[530px] lg:mt-7 text-base leading-7 text-[#aeb8b8] sm:text-lg">
              Transformez votre expérience de conduite avec nos AI Box Android, adaptateurs sans fil CarPlay &amp; Android
              Auto et accessoires de recharge.
            </p>

            {/* CTA */}
            <div className="mt-7 flex flex-wrap gap-3 sm:gap-4 lg:mt-9">
              <a
                href="#catalogue"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#c4f000] px-7 font-semibold text-black shadow-[0_0_35px_rgba(196,240,0,0.2)] transition duration-300 hover:-translate-y-1 hover:bg-[#d9ff3b] hover:shadow-[0_0_45px_rgba(196,240,0,0.35)]"
              >
                <ShoppingBag size={19} aria-hidden="true" />
                Découvrir la boutique
                <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </a>

              <Link
                to={{ pathname: "/", search: "?categorie=auto", hash: "#catalogue" }}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/5 px-7 font-medium backdrop-blur-md transition duration-300 hover:border-lime-400 hover:bg-white/10"
              >
                Explorer les produits auto
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>

            {/* Avantages */}
            <ul className="mt-9 grid max-w-[620px] grid-cols-1 gap-5 border-t border-white/10 pt-7 sm:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <Icon size={25} strokeWidth={1.7} className="shrink-0 text-[#c4f000]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-[#9ba6a6]">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Visuel */}
          <div className="pointer-events-none absolute inset-x-0 top-14 z-0 flex items-start justify-center opacity-55 sm:opacity-60 lg:pointer-events-auto lg:relative lg:top-auto lg:z-auto lg:min-h-[570px] lg:items-center lg:opacity-100">
            <div className="pointer-events-none absolute h-[75%] w-[75%] rounded-full border border-[#baff00]/30 shadow-[0_0_100px_rgba(186,255,0,0.12)]" />
            <div className="pointer-events-none absolute h-[65%] w-[65%] rounded-full bg-[#baff00]/10 blur-[85px]" />

            <img
              src="/assets/hero-kit-multimedia.webp"
              srcSet="/assets/hero-kit-multimedia-mobile.webp 900w, /assets/hero-kit-multimedia.webp 1672w"
              sizes="(min-width: 1024px) 50vw, 100vw"
              width="1672"
              height="941"
              alt="Kit multimédia automobile MIROTECH : écran CarPlay et Android Auto, adaptateurs sans fil et caméra embarquée"
              fetchPriority="high"
              className="relative z-10 h-auto w-[112%] max-w-none sm:w-[85%] lg:w-full lg:max-w-[800px] object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.7)] motion-safe:animate-hero-float"
            />

            <div className="absolute bottom-3 left-1/2 h-8 w-[65%] -translate-x-1/2 rounded-full bg-lime-400/20 blur-2xl" />
          </div>
        </div>

        {/* Catégories */}
        <nav
          id="categories"
          aria-label="Catégories de produits"
          className="relative z-20 mt-12 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-[#151d1d]/85 backdrop-blur-xl lg:mt-6 lg:grid-cols-4"
        >
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            return (
              <Link
                key={c.id}
                to={{ pathname: "/", search: `?categorie=${c.id}`, hash: "#catalogue" }}
                className="group flex min-h-24 items-center justify-center gap-3 border-b border-r border-white/10 px-4 text-sm transition-colors hover:bg-lime-400/10 sm:text-base lg:border-b-0"
              >
                <Icon
                  size={26}
                  strokeWidth={1.6}
                  aria-hidden="true"
                  className="shrink-0 text-[#c4f000] transition-transform duration-300 group-hover:scale-110"
                />
                <span className="font-medium transition-colors group-hover:text-lime-300">{c.name}</span>
                <ArrowUpRight
                  size={15}
                  aria-hidden="true"
                  className="hidden text-lime-400 opacity-0 transition-opacity group-hover:opacity-100 xl:block"
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
