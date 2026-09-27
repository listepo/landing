import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Contract: CONTENT_CONTRACT.md (and content/projects/README.md, which the sync owns).
// content/projects/README.md documents the folder and is not a project page.
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "6-digit hex, e.g. #5CE1FF");

const projects = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "./content/projects" }),
  schema: z.object({
    title: z.string().min(1),
    tagline: z.string().min(1).max(160),
    repo: z.string().url().startsWith("https://github.com/"),
    homepage: z.string().url().optional(),
    install: z.string().min(1),
    install_alternatives: z.array(z.string()).optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/, "semver without a leading v"),
    accent: hex,
    /** Optional second accent (e.g. rtok's coral). Falls back to the site theme table. */
    accent2: hex.optional(),
    /** Optional darker accent for light surfaces. Falls back to the site theme table. */
    accentLight: hex.optional(),
    /** PLACEHOLDER Pro price label, e.g. "$9 / mo". Falls back to PRO in src/lib/site.ts. */
    pro_price: z.string().max(24).optional(),
    /** Feature this tool on the marketplace home (first featured wins; else first by order). */
    featured: z.boolean().optional(),
    /** Sort order on the marketplace (ascending); unsorted tools follow alphabetically. */
    order: z.number().int().optional(),
  }),
});

export const collections = { projects };
