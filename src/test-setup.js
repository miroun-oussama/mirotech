import "@testing-library/jest-dom/vitest";

window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// jsdom n'implémente pas ces API (animations, carrousel).
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= StubObserver;
globalThis.IntersectionObserver ??= StubObserver;
