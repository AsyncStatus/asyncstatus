import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
  ],
  define: {
    "import.meta.env.VITE_API_URL": import.meta.env.VITE_API_URL,
    "import.meta.env.VITE_WEB_APP_URL": import.meta.env.VITE_WEB_APP_URL,
    "import.meta.env.VITE_MARKETING_APP_URL": import.meta.env
      .VITE_MARKETING_APP_URL,
    "import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL": import.meta.env
      .VITE_STRIPE_CUSTOMER_PORTAL,
  },
});
