// Catalogue MIROTECH — prix, variantes et mentions de compatibilité communiqués par la boutique.
// Ne pas ajouter de produit, de stock ou d'avis sans validation de MIROTECH.

const COMPAT_AI_BOX =
  "Compatibilité annoncée pour les véhicules à partir de 2018. La présence d'un système CarPlay filaire d'origine et la compatibilité exacte du modèle doivent être vérifiées avant achat.";

export const CATEGORIES = [
  { id: "auto", image: "/assets/categories/auto.webp", value: "Car Accessories", label: "Auto", name: "Technologie automobile", caption: "AI BOX • CARPLAY", className: "category-car" },
  { id: "recharge", image: "/assets/categories/recharge.webp", value: "Charging & Power", label: "Recharge", name: "Recharge & énergie", caption: "SANS FIL • MULTI-APPAREILS", className: "category-power" },
  { id: "telephone", image: "/assets/categories/telephone.webp", value: "Phone Accessories", label: "Téléphone", name: "Accessoires connectés", caption: "PRATIQUE • COMPACT", className: "category-phone" },
  { id: "gadgets", image: "/assets/categories/gadgets.webp", value: "Gadgets", label: "Gadgets", name: "Objets intelligents", caption: "SÉLECTION MIROTECH", className: "category-gadgets" },
];

export const products = [
  {
    id: "ai-premium",
    name: "AI Box Android — Série Premium",
    categories: ["Car Accessories"],
    label: "AI BOX ANDROID",
    description:
      "Boîtier multimédia Android pour voiture. Choisissez la configuration mémoire adaptée à votre usage.",
    image: "/assets/ai-box-premium-02.jpg",
    gallery: ["/assets/ai-box-premium-01.jpg", "/assets/ai-box-premium-02.jpg"],
    variants: [
      { label: "2 Go RAM / 16 Go", price: 650 },
      { label: "2 Go RAM / 32 Go", price: 750 },
      { label: "4 Go RAM / 64 Go", price: 990 },
    ],
    compat: COMPAT_AI_BOX,
  },
  {
    id: "ai-standard",
    name: "AI Box Android — Série Standard",
    categories: ["Car Accessories"],
    label: "AI BOX ANDROID",
    description:
      "Boîtier Android pour enrichir le système multimédia compatible de votre véhicule.",
    image: "/assets/ai-box-standard-03.jpg",
    gallery: [
      "/assets/ai-box-standard-01.jpg",
      "/assets/ai-box-standard-02.jpg",
      "/assets/ai-box-standard-03.jpg",
    ],
    variants: [
      { label: "2 Go RAM / 16 Go", price: 550 },
      { label: "2 Go RAM / 32 Go", price: 690 },
    ],
    compat: COMPAT_AI_BOX,
  },
  {
    id: "charger-5in1",
    name: "Station de charge sans fil 5-en-1",
    categories: ["Charging & Power", "Phone Accessories", "Gadgets"],
    label: "CHARGE & POWER",
    description:
      "Une station multi-appareils avec affichage horaire et zones de recharge sans fil. Vérifiez les appareils compatibles et les conditions de charge.",
    image: "/assets/chargeur-5-en-1-02.jpg",
    gallery: [
      "/assets/chargeur-5-en-1-01.jpg",
      "/assets/chargeur-5-en-1-02.jpg",
      "/assets/chargeur-5-en-1-03.jpg",
    ],
    variants: [{ label: "Station 5-en-1", price: 385 }],
    compat:
      "Compatibilité de charge à confirmer selon le modèle de téléphone, de montre et les accessoires utilisés.",
  },
  {
    id: "carplay-2in1",
    name: "Adaptateur sans fil CarPlay & Android Auto 2-en-1",
    categories: ["Car Accessories"],
    label: "CARPLAY • ANDROID AUTO",
    // Résumé court : cartes produit et référencement. Le texte complet est dans « details ».
    description: "Transformez votre CarPlay ou Android Auto filaire en connexion sans fil.",
    details: [
      {
        lang: "fr",
        title: "Adaptateur CarPlay & Android Auto sans fil",
        text: "Transformez votre CarPlay ou Android Auto filaire en connexion sans fil. Branchez simplement l'adaptateur sur le port USB de votre voiture et profitez de vos applications préférées sans câble : GPS, musique, appels et bien plus encore.",
        points: [
          ["📱", "Connexion sans fil"],
          ["🔄", "Connexion automatique"],
          ["🔌", "Installation Plug & Play"],
          ["🚗", "Plus de confort au quotidien"],
        ],
        note: "Compatible uniquement avec les véhicules équipés d'origine de CarPlay ou Android Auto filaire.",
      },
      {
        lang: "ar",
        title: "🇲🇦 محول CarPlay و Android Auto لاسلكي",
        text: "حوّل CarPlay أو Android Auto ديال سيارتك من الاتصال بالكابل إلى الاتصال اللاسلكي. غير ربط المحول بمنفذ USB ديال السيارة واستمتع بالتطبيقات المفضلة عندك بلا كابل: GPS، الموسيقى، المكالمات والمزيد.",
        points: [
          ["📱", "اتصال لاسلكي"],
          ["🔄", "اتصال تلقائي"],
          ["🔌", "تركيب سهل Plug & Play"],
          ["🚗", "راحة أكثر فالسياقة"],
        ],
        note: "متوافق فقط مع السيارات اللي فيها CarPlay أو Android Auto بالكابل من الأصل.",
      },
    ],
    image: "/assets/adaptateur-carplay-01.jpg",
    fit: "contain", // visuel type affiche : ne pas rogner le titre
    gallery: [
      "/assets/adaptateur-carplay-01.jpg",
      "/assets/adaptateur-carplay-03.jpg",
      "/assets/adaptateur-carplay-04.jpg",
      "/assets/adaptateur-carplay-05.jpg",
      "/assets/adaptateur-carplay-02.jpg",
      "/assets/adaptateur-carplay-06.jpg",
    ],
    variants: [{ label: "Adaptateur 2-en-1", price: 219 }],
    compat:
      "Nécessite un véhicule disposant déjà de CarPlay filaire ou Android Auto filaire d'origine. Ne remplace pas un système absent.",
  },
];

export const getProduct = (id) => products.find((p) => p.id === id);

export const minPrice = (product) => Math.min(...product.variants.map((v) => v.price));

export const categoryLabelFor = (product) =>
  product.categories.includes("Car Accessories") ? "Technologie automobile" : "Recharge & accessoires";
