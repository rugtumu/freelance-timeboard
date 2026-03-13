import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});
