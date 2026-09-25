# Repository Guidelines

A contributor guide for this Vue 3 + TSX port of Fumadocs, hosted at [doc.prideyang.top](https://doc.prideyang.top).

## Project Structure & Module Organization

- `content/docs/` — MDX documentation source. Each top-level category is a directory with an `index.md` and a `meta.json` (e.g. `dotnet/`, `java/`, `db/`, `middleware/`, `other/`).
- Root `content/docs/meta.json` lists the order in which the root categories appear in the nav.
- A category directory's own `meta.json` controls the sidebar inside that category. Use `"root": true` to flag a category as a top-level tab. Supported syntax: `pages` list, inline folder overrides (`{ name: { title, icon, pages } }`), `---` / `---Label---` separators, `...` wildcard.
- `src/` — Vue 3 TSX application: routes (`src/Router.ts`), pages (`src/pages/`), layout (`src/components/DocsLayout.tsx`), MDX component mapping (`src/components/MdxComponents.tsx`), shared utilities (`src/lib/`).
- `plugins/Source.ts` — Vite plugin that scans `content/docs/`, parses `meta.json`, extracts frontmatter + TOC + search index, and exposes `virtual:source`.
- `scripts/Prerender.mjs` — Optional SSG: launches `vite preview`, walks `dist/routes.json` and snapshots each route with playwright.
- `public/` — Static assets (history images under `public/assets/`, favicon). Referenced from MDX as `/assets/...`.

## Build, Test, and Development Commands

- `pnpm dev` — Start the Vite dev server with HMR.
- `pnpm build` — Produce a production build in `dist/`.
- `pnpm preview` — Serve the production build locally.
- `pnpm prerender` — After `pnpm build`, snapshot each route to static HTML (requires playwright + a browser).
- `pnpm build:full` — `pnpm build && pnpm prerender`.
- `pnpm typecheck` — `vue-tsc --noEmit`.

There is no automated test suite. Validate by running `pnpm dev` and visually inspecting the affected page.

## Content Authoring

- Each MDX page uses YAML frontmatter: `title` (required), optional `description`, `icon`, `full` (boolean — hides sidebar and TOC for a wider page), `date`, `lastmod`.
- The category directory's `meta.json` controls sidebar order and title. Set `"root": true` on top-level category files so they show up as tabs.
- Root order is fixed by `content/docs/meta.json` `pages`; new top-level categories must be added there too.
- MDX supports: `<Callout>`, `<Cards>` / `<Card>`, `<Tabs>` / `<Tab>`, `<Accordion>` / `<AccordionItem>`, `<Steps>` / `<Step>`, `<pre>` (Shiki, with `title="..."` and `{n-m}` line highlight markers), GFM tables, KaTeX math (`$...$` / `$$...$$`).

## Coding Style & Naming Conventions

- TypeScript with `vue-jsx`; components in `src/` are written as TSX.
- SCSS Modules for component styles (`*.module.scss`), with UnoCSS utility classes inlined via `--at-apply:` rules.
- 2-space indentation, double quotes for JSON, single quotes for TS/TSX strings.
- File names use lowercase kebab-case; Vue components use PascalCase (`DocsLayout.tsx`); utility modules use camelCase (`Source.ts`, `Theme.ts`).
- No project-level linter is configured. Match the existing surrounding style.

## Commit & Pull Request Guidelines

- This submodule is its own git repo (`lytree/docs`); commits here do not affect the parent `lytree` repo and vice versa.
- Conventional Commits are welcome but not enforced. Prefer a short imperative subject in English or Chinese.
- Branches: `main` is the default; feature work uses `codex/<short-topic>` or topic branches.
- PRs should describe the doc or code change and list the files added/modified under `content/docs/`. Screenshots are required when layout, sidebar order, or visual styling changes.

## Agent-Specific Notes

- Do not hand-edit `dist/` — it is generated.
- When adding a new top-level docs category, update both `content/docs/meta.json` and the category's own `meta.json` with `"root": true`, plus an `icon`.
- Site config (URL, title, edit-link repo) lives in `vite.config.ts` under `fumadocsSource({ site, editLink })`.
- The content pipeline is recreated on every dev server start; editing MDX or `meta.json` triggers HMR automatically.
- Keep MDX changes localized; do not refactor unrelated category structures.
