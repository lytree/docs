# Repository Guidelines

A contributor guide for this Fumadocs + React Router documentation site.

## Project Structure & Module Organization

- `content/docs/` — MDX documentation source. Each top-level category is a directory with an `index.md` and a `meta.json` (e.g. `dotnet/`, `java/`, `db/`, `middleware/`, `other/`).
- Subcategories live as nested folders (e.g. `content/docs/db/mysql/`, `content/docs/middleware/redis/`). List child pages explicitly in the parent `'s `meta.json` `pages` array.
- `app/` — React Router routes, layout (`app/lib/layout.shared.tsx`), MDX component mapping (`app/components/mdx.tsx`), and LLM helpers (`app/llms/`).
- `source.config.ts` — Fumadocs MDX config (remark-gfm, remark-math, rehype-katex).
- `.source/` — Generated client/server MDX collections. Do not edit by hand; regenerated on `postinstall` and `types:check`.
- `public/`, `react-router.config.ts`, `vite.config.ts`, `tsconfig.json` — Static assets and build/runtime configuration.

## Build, Test, and Development Commands

- `pnpm dev` — Start the local dev server (React Router + Fumadocs HMR).
- `pnpm build` — Produce a production build in `build/`.
- `pnpm start` — Serve the production build.
- `pnpm types:check` — Run `react-router typegen`, regenerate `.source/`, then run `tsc --noEmit`. Run this after editing routes or MDX config.
- `pnpm postinstall` — Runs automatically; regenerates MDX collections after dependency changes.

There is no automated test suite. Validate changes by running `pnpm dev` and visually inspecting the affected page.

## Content Authoring

- Each MDX page uses YAML frontmatter: `title` (required), optional `date`, `lastmod`, `category`. See `content/docs/db/mysql/index.md` for a minimal template; many pages use only `title`.
- The category directory's `meta.json` controls sidebar order and title. Set `"root": true` on top-level category files.
- New top-level categories must also be registered in `content/docs/meta.json` `pages` and in the nav links in `app/lib/layout.shared.tsx`.
- KaTeX math (`$...$` / `$$...$$`) and GFM tables are supported out of the box.

## Coding Style & Naming Conventions

- TypeScript with the configuration in `tsconfig.json`; React function components in `app/`.
- 2-space indentation, double quotes for strings in JSON config files.
- File names inside `content/docs/` use lowercase, kebab- or short English (`mysql`, `pgsql`, `redis`); MDX files inside subfolders are commonly numbered (`1.md`, `2.md`) for ordered chapters.
- Component files use PascalCase (`mdx.tsx`); utility modules use camelCase (`source.ts`, `shared.ts`).
- No project-level linter is configured. Match the existing surrounding style.

## Commit & Pull Request Guidelines

- Commit history is informal (mixed `chore: …`, `fix …`, `add …`, and Chinese descriptions). Prefer a short imperative subject in English or Chinese; Conventional Commits are welcome but not enforced.
- Branches: `main` is the default; `dev` exists for integration. Use `codex/<short-topic>` for agent-driven branches.
- PRs should describe the doc or code change, list the files added/modified under `content/docs/`, and include a screenshot when layout or sidebar ordering changes.

## Agent-Specific Notes

- Do not hand-edit `.source/` or `build/` — both are generated.
- When adding a new top-level docs category, update both `content/docs/meta.json` and `app/lib/layout.shared.tsx` nav links, then run `pnpm types:check`.
- Keep MDX changes localized; do not refactor unrelated category structures.
