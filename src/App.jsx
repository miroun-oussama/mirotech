import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import FloatingContact from "./components/FloatingContact";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { CartProvider } from "./context/CartContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import OrderTracking from "./pages/OrderTracking";

/** Gère le scroll à la navigation : ancre (#section) si présente, sinon haut de page. */
function ScrollManager() {
  const { pathname, hash, key, state } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    // Retour/avance du navigateur : on laisse le navigateur restaurer sa position.
    if (state?.noScroll || navType === "POP") return;
    if (hash) {
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* ancre mal encodée : on l'utilise telle quelle */
      }
      document.getElementById(id)?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key, state, navType]);
  return null;
}

export default function App() {
  return (
    <CartProvider>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <ScrollManager />
      <Header />
      <main id="contenu" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produit/:id" element={<ProductPage />} />
          <Route path="/suivi-commande" element={<OrderTracking />} />
          <Route path="/miro" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <FloatingContact />
      <CartDrawer />
      <CheckoutModal />
    </CartProvider>
  );
}
