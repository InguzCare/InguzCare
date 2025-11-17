import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://www.inguzcare.co.uk",

  // Tell Astro that this site uses serverless output (required for API routes)
  output: "server",

  // Use Cloudflare adapter (required for Cloudflare Pages Functions)
  adapter: cloudflare(),

  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
