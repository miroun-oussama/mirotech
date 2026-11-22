import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
    globals: true,
    css: false,
    // Les tests ne doivent jamais dépendre de .env.local ni écrire dans le vrai Google Sheet.
    env: { VITE_ORDERS_API_URL: "" },
  },
});
