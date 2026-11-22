import { useEffect } from "react";

function setHeadTag(selector, create, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

/** Met à jour titre, description, canonique et Open Graph pour la page affichée (sans doublons). */
export function usePageMeta({ title, description, canonical, robots }) {
  useEffect(() => {
    document.title = title;
    const meta = (attr, name, content) =>
      setHeadTag(`meta[${attr}="${name}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, name);
        return m;
      }, { content });

    if (description) {
      meta("name", "description", description);
      meta("property", "og:description", description);
    }
    meta("property", "og:title", title);
    if (canonical) {
      setHeadTag('link[rel="canonical"]', () => {
        const l = document.createElement("link");
        l.rel = "canonical";
        return l;
      }, { href: canonical });
      meta("property", "og:url", canonical);
    }
    if (!canonical) document.head.querySelector('link[rel="canonical"]')?.remove();
    // robots : on le retire quand la page doit être indexée.
    const existing = document.head.querySelector('meta[name="robots"]');
    if (robots) meta("name", "robots", robots);
    else existing?.remove();
  }, [title, description, canonical, robots]);
}
