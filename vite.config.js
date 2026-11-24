import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { site } from "./src/config.js";

// Letterboxd's RSS feed doesn't allow cross-site requests from browsers,
// so the dev and preview servers fetch it and hand it to the page at
// /letterboxd.rss. Production runs `vite preview`, so this works there too.
const letterboxd = {
  "/letterboxd.rss": {
    target: "https://letterboxd.com",
    changeOrigin: true,
    rewrite: () => `/${site.letterboxd.username}/rss/`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  },
};

export default defineConfig({
  server: {
    proxy: letterboxd,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: ["oscarpdalton.com", "www.oscarpdalton.com"],
    proxy: letterboxd,
  },
  plugins: [react()],
});
