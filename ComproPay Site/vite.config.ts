import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

// EXPORT_BASE_PATH existe só para o export estático publicado no GitHub Pages,
// que mora numa subpasta. Sem a variável, o build é o normal, servido na raiz.
const exportBasePath = process.env.EXPORT_BASE_PATH

export default defineConfig({
  base: exportBasePath || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
