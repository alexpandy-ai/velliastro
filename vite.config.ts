import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/bharat/chart": {
        target: "https://bharatephemeris.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/bharat\/chart/, "/api/v1/bharat/chart"),
      },
    },
  },
});
