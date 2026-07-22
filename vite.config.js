import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['oscarpdalton.com', 'www.oscarpdalton.com'],
  },
  plugins: [react()],
});
