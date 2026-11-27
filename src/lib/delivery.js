// Règles de livraison. Le serveur (google-apps-script/Code.gs) applique les MÊMES montants.

/** Livraison offerte quand le sous-total dépasse ce montant (en DH). */
export const FREE_DELIVERY_MIN = 300;
/** Frais en DH quand la livraison n'est pas offerte. */
export const DELIVERY_FEES = { casablanca: 20, autre: 40 };

export const FREE_DELIVERY_MESSAGE = `Livraison gratuite si la commande dépasse ${FREE_DELIVERY_MIN} DH`;
export const DELIVERY_RATES = `Casablanca : ${DELIVERY_FEES.casablanca} DH · autres villes : ${DELIVERY_FEES.autre} DH`;
export const DELIVERY_TERMS = `${FREE_DELIVERY_MESSAGE}. Sinon, ${DELIVERY_FEES.casablanca} DH à Casablanca et ${DELIVERY_FEES.autre} DH dans les autres villes.`;

export const isFreeDelivery = (subtotal) => subtotal > FREE_DELIVERY_MIN;

/** Frais de livraison en DH, ou null tant que la ville n'est pas choisie. */
export const deliveryFee = (subtotal, zone) => (isFreeDelivery(subtotal) ? 0 : (DELIVERY_FEES[zone] ?? null));
