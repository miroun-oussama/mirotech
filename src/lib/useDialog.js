import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let lockCount = 0;
function lockScroll() {
  lockCount += 1;
  document.body.classList.add("locked");
}
function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.classList.remove("locked");
}

/**
 * Comportement commun des fenêtres (panier, commande) :
 * verrouillage du scroll, fermeture avec Échap, focus piégé puis restauré.
 */
export function useDialog(open, onClose, containerRef) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;
    lockScroll();

    const focusables = () => [...(container?.querySelectorAll(FOCUSABLE) ?? [])];
    // Laisse la transition d'ouverture démarrer avant de déplacer le focus.
    const raf = requestAnimationFrame(() => (focusables()[0] ?? container)?.focus());

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) {
          e.preventDefault();
          container?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        // Focus perdu (ex. ligne supprimée) ou sorti de la fenêtre : on le ramène dedans.
        if (!container?.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, containerRef]);
}
