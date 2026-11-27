const COLORS = ["#c4f000", "#d9ff3b", "#ffffff", "#25d366"];

/** Confettis après une commande réussie. Un échec ne doit jamais gêner la confirmation. */
export async function celebrate() {
  if (typeof window.CanvasRenderingContext2D === "undefined") return; // pas de canvas (tests, vieux navigateurs)
  try {
    // Chargé seulement à ce moment-là pour ne pas alourdir le site.
    const { default: confetti } = await import("canvas-confetti");
    // useWorker: false — la politique de sécurité (public/_headers) interdit les workers « blob: ».
    const fire = confetti.create(undefined, { resize: true, useWorker: false, disableForReducedMotion: true });
    fire({ particleCount: 140, spread: 85, startVelocity: 42, origin: { y: 0.65 }, colors: COLORS, zIndex: 100 });
  } catch {
    /* animation facultative */
  }
}
