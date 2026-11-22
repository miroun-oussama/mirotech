# MIROTECH — boutique React

Boutique d'accessoires automobiles et tech (AI Box Android, adaptateurs CarPlay / Android Auto, recharge sans fil).
Stack : React 19 · Vite · React Router · Motion (animations) · Lucide (icônes) · Embla (galerie tactile) · Tailwind v4 (utilitaires seuls, hero) · Vitest + Testing Library. Aucun backend : la commande est transmise par WhatsApp.

## Commandes
```bash
npm install        # installer les dépendances
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # build de production dans dist/
npm run preview    # prévisualiser le build
npm test           # tests unitaires et composants
```

## Structure
- `src/data/products.js` — catalogue (produits, variantes, prix, mentions de compatibilité, catégories). **Seul fichier à modifier pour changer un prix ou ajouter un produit** (ajouter aussi l'URL dans `public/sitemap.xml`).
- `src/lib/` — logique pure et testée : panier (`cart.js`), message WhatsApp (`whatsapp.js`), formats/constantes (`format.js`).
- `src/context/CartContext.jsx` — état du panier (persisté dans `localStorage`, synchronisé entre onglets).
- `src/pages/` — accueil, fiche produit (`/produit/:id`, galerie + choix de version), 404.
- `src/components/` — en-tête, pied de page, tiroir panier, formulaire de commande, carte produit.
- `src/styles.css` (design d’origine) + `src/extra.css` (accessibilité, page produit) + `src/redesign.css` (refonte visuelle) + `src/tailwind.css` (utilitaires Tailwind sans reset, utilisés par `MirotechHero.jsx`). Accent : vert néon `#c4f000`, aligné sur le logo.
- `google-apps-script/` — `Code.gs` (backend Google Sheets) et guide d'installation. Les prix y sont recalculés côté serveur : le bloc `CATALOGUE` doit rester identique à `products.js` (test automatique).
- `public/` — images, favicon, `robots.txt`, `sitemap.xml`, `_redirects`, `_headers` (en-têtes de sécurité Netlify/Cloudflare ; `vercel.json` pour Vercel : CSP limitée à Google Fonts et script.google.com).
- `legacy/` — ancienne version statique (HTML/JS/CSS), conservée pour référence.

## Fonctionnalités
- Filtres par catégorie (dans l'URL : `/?categorie=auto`), fiches produit avec galerie, panier avec quantités, sous-total, persistance.
- Commande : bouton **Commander maintenant** (fiche produit) ou **Commander** (panier) → formulaire avec récapitulatif → la commande est enregistrée dans un **Google Sheet** (paiement à la livraison, COD).
  Tant que `VITE_ORDERS_API_URL` n'est pas défini, le formulaire retombe sur l'envoi par WhatsApp (aucune panne).
- **Page admin** `/miro` protégée par mot de passe : liste, recherche, statuts et bouton WhatsApp vers le client. Configuration : `google-apps-script/INSTALLATION.md`.
- Accessibilité : lien d'évitement, focus visible, fenêtres avec Échap + focus piégé, panier fermé non focusable.
- SEO : titre/description/canonique par page, JSON-LD `Product`, sitemap, robots.txt.

## Déploiement — important
Les pages produit utilisent de vraies URLs (`/produit/...`). L'hébergeur doit renvoyer `index.html` pour toute URL inconnue (« SPA fallback »), sinon un rafraîchissement sur une fiche produit donne une 404 :
- Netlify / Cloudflare Pages : `public/_redirects` est déjà fourni.
- Vercel : `vercel.json` est déjà fourni.
- Autre hébergeur statique (nginx, Railway…) : configurer la règle équivalente (`try_files $uri /index.html`).

## À confirmer avant mise en ligne
- Frais et délais de livraison, retours et garantie.
- Compatibilité exacte de chaque modèle de voiture et des appareils de recharge.
- Pas de traitement automatique de commande, de stock ni de paiement en ligne : le client doit envoyer le message WhatsApp.
- Domaine canonique prévu : `https://mirotech.ma` (dans `src/lib/format.js`, `index.html`, `public/sitemap.xml`, `public/robots.txt`). À ajuster si différent.
- La vidéo hero demandée initialement n'a pas été générée ; l'image fournie sert de visuel hero.
