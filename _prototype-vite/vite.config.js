import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dirname;

// Inlines shared partials: <!--@include nav--> → partials/nav.html
const includePartials = () => ({
  name: "include-partials",
  transformIndexHtml: {
    order: "pre",
    handler: (html) =>
      html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
        readFileSync(resolve(root, "partials", `${name}.html`), "utf8"),
      ),
  },
});

export default defineConfig({
  plugins: [includePartials()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        rtok: resolve(root, "rtok/index.html"),
        cox: resolve(root, "cox/index.html"),
        ketch: resolve(root, "ketch/index.html"),
      },
    },
  },
});
