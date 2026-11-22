import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import Lightbox from "./Lightbox";

/** Galerie swipeable (tactile) avec miniatures et flèches. */
export default function ProductGallery({ images, name, startIndex = 0, fit }) {
  const [viewportRef, embla] = useEmblaCarousel({ loop: images.length > 1, startIndex });
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!embla) return undefined;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => embla.off("select", onSelect);
  }, [embla]);

  const go = useCallback((i) => embla?.scrollTo(i), [embla]);
  const many = images.length > 1;

  return (
    <div className="product-gallery">
      <div className="gallery-main" role="group" aria-roledescription="carrousel" aria-label={`Photos de ${name}`}>
        <div className="embla" ref={viewportRef}>
          <div className="embla-track">
            {images.map((src, i) => (
              <div className="embla-slide" key={src} aria-label={`Photo ${i + 1} sur ${images.length}`}>
                <img src={src} alt={`${name} — vue ${i + 1}`} loading={i === startIndex ? "eager" : "lazy"} draggable="false" style={fit ? { objectFit: fit } : undefined} onClick={() => setZoom(true)} />
              </div>
            ))}
          </div>
        </div>
        <button className="gallery-zoom" onClick={() => setZoom(true)} aria-label="Agrandir la photo">
          <Maximize2 size={16} aria-hidden="true" />
        </button>
        {many && (
          <>
            <button className="gallery-arrow prev" onClick={() => embla?.scrollPrev()} aria-label="Photo précédente">
              <ChevronLeft size={20} />
            </button>
            <button className="gallery-arrow next" onClick={() => embla?.scrollNext()} aria-label="Photo suivante">
              <ChevronRight size={20} />
            </button>
            <span className="gallery-count" aria-hidden="true">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {many && (
        <div className="gallery-thumbs" role="group" aria-label="Miniatures">
          {images.map((src, i) => (
            <button
              key={src}
              className={i === index ? "active" : ""}
              onClick={() => go(i)}
              aria-label={`Afficher la photo ${i + 1}`}
              aria-pressed={i === index}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <Lightbox
          images={images}
          index={index}
          name={name}
          onIndex={(i) => {
            setIndex(i);
            embla?.scrollTo(i, true);
          }}
          onClose={() => setZoom(false)}
        />
      )}
    </div>
  );
}
