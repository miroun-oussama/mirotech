import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { cartCount, cartLines, cartReducer, cartTotal, loadCart, persistCart } from "../lib/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    persistCart(cart);
  }, [cart]);

  // Synchronise plusieurs onglets ouverts sur la boutique.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "mirotech-cart") dispatch({ type: "replace", cart: loadCart() });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((id, variantIndex = 0, qty = 1) => {
    dispatch({ type: "add", id, variantIndex, qty });
    setCartOpen(true);
  }, []);

  // « Commander maintenant » : s'assure que l'article est au panier, puis ouvre directement le formulaire.
  const buyNow = useCallback((id, variantIndex = 0, qty = 1) => {
    dispatch({ type: "add", id, variantIndex, qty, ensure: true });
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      lines: cartLines(cart),
      count: cartCount(cart),
      total: cartTotal(cart),
      addItem,
      buyNow,
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      removeItem: (key) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      checkoutOpen,
      openCheckout: () => {
        setCartOpen(false);
        setCheckoutOpen(true);
      },
      closeCheckout: () => setCheckoutOpen(false),
    }),
    [cart, cartOpen, checkoutOpen, addItem, buyNow],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
