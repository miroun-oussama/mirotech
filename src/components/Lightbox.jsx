import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useDialog } from "../lib/useDialog";

/** Photo en grand : Échap pour fermer, flèches du clavier pour naviguer. */
export default function Lightbox({ images, index, name, onIndex, onClose }) {
  const ref = useRef(null);
  useDialog(true, onClose, ref);
  const many = images.length > 1;
  const prev = () => onIndex((index - 1 + images.length) % images.length);
  const next = () => onIndex((index + 1) % images.length);

  useEffect(() => {
    if (!many) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [many, index, images.length, onIndex]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${name} — photo ${index + 1} sur ${images.length}`} ref={ref} tabIndex={-1} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="icon-button lightbox-close" onClick={onClose} aria-label="Fermer la photo">
        <X size={20} aria-hidden="true" />
      </button>
      {many && (
        <button className="gallery-arrow prev" onClick={prev} aria-label="Photo précédente">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
      )}
      <img src={images[index]} alt={`${name} — vue ${index + 1}`} />
      {many && (
        <button className="gallery-arrow next" onClick={next} aria-label="Photo suivante">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      )}
      {many && (
        <span className="gallery-count" aria-hidden="true">
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  );
}
