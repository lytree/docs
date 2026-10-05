# Repository Guidelines

A contributor guide for this Vue 3 + TSX documentation site, hosted at [doc.prideyang.top](https://doc.prideyang.top).
The content pipeline is **markdown-it** (same approach as VitePress); the site framework is a Vue 3 + TSX port of Fumadocs.

## Project Structure & Module Organization

- `content/docs/` — Markdown source. Each top-level category is a directory with an `index.md` and a `meta.json` (e.g. `dotnet/`, `java/`, `db/`, `middleware/`, `other/`).
- Root `content/docs/meta.json` lists the categories in `pages`; its `order` array is the authoritative display order for the sidebar and the category switcher. Names in `order` that don't match a category are ignored (with a build warning), and categories missing from `order` keep their `pages` order and are appended to the end — so a newly added category still shows up.
- A category directory's own `meta.json` controls the sidebar inside that category. Use `"root": true` to flag a category as a top-level tab. Supported syntax: `pages` list, inline folder overrides (`{ name: { title, icon, pages } }`), `---` / `---Label---` separators, `...` wildcard.
- `theme.tsx` — **component-level** customization: layout slots and shared components (browser only).
- `vite.config.ts` — **data-level** configuration, all passed to `fumadocsSource()` (read in Node).
- `plugins/` — `MarkdownIt.ts` (markdown pipeline), `Katex.ts` (math rules + browser render), `FileImport.ts` (`<<<` imports), `Source.ts` (content pipeline → `virtual:source`), `Docgen.ts`, `FenceMeta.ts`.
- `src/components/` — layout components (DocsLayout / Sidebar / Toc / SearchDialog / Banner / ApiDoc).
- `src/pages/` — route-level pages (Home / DocPage / NotFound / DebugTree).
- `src/lib/` — `Slots.ts` (slot registry), `Markdown.ts` (renders + enhances markdown-it output), `Config.ts` (runtime config access), `Seo.ts`, `Theme.ts`, `Source.ts`.
- `src/styles/` — `Global.scss` (tokens, shell chrome) and `Markdown.scss` (markdown-it output styling).
- `scripts/Prerender.mjs` — optional SSG via playwright.
- `public/assets/` — static assets, referenced from Markdown as `/assets/...`.

## Why data config and component config are separate

`fumadocsSource()` is read by `vite.config.ts` in Node. If it imported components, Vue would be pulled into Vite's config-execution environment. So:

- **Data** (nav, sidebar, tokens, copy) → `vite.config.ts`
- **Components** (slots, TSX) → `theme.tsx`

## Build, Test, and Development Commands

- `pnpm dev` — dev server with HMR.
- `pnpm build` — production build into `dist/`.
- `pnpm preview` — serve the production build.
- `pnpm prerender` — snapshot each route to static HTML (requires playwright + a browser).
- `pnpm build:full` — `pnpm build && pnpm prerender`.
- `pnpm typecheck` — `vue-tsc --noEmit`.

There is no automated test suite. Validate by running `pnpm dev` and visually inspecting the affected page.

## Content Authoring

Content is **plain Markdown**, not MDX. This matters: markdown-it treats `<` as inline HTML, so `List<String>`, `a < b`, and `Map<K,V>` are all safe. Under MDX they were parse errors.

Frontmatter (YAML): `title` (required), `description`, `icon`, `full` (wide page, hides sidebar + TOC), `date`, `lastmod`, plus layout overrides:

| Field | Type | Effect |
| --- | --- | --- |
| `aside` | `false \| 'left' \| 'right'` | outline position; `false` hides it |
| `outline` | `false \| [number, number]` | heading depths collected into the outline |
| `pageClass` | `string` | extra class on the layout root |
| `lastUpdated` | `false` | hide the "last updated" line |
| `head` | `array` | extra `<head>` tags (`{ tag, attrs }`) |

### Containers

```
::: tip 标题        → info / note / warning / danger / important / quote
::: details 标题    → collapsible
::: code-group      → tabbed code blocks; the fence `[filename]` becomes the tab label
::: raw             → passthrough
```

Nested containers are supported. Code fences accept `[filename]` / `title="..."`, `{1,3-5}` line highlight, `[!code focus]`, `[!code word:xxx]`, `[!code ++]` / `[!code --]`.

### File imports

A line containing only `<<< path` is replaced by a code fence with the file's contents. `@/` resolves to `content/docs/`; relative paths resolve from the document. The directive **must be on its own line**. Under MDX this could not work — `<<<` collided with JSX parsing.

## Coding Style & Naming Conventions

- TypeScript with `vue-jsx`; components in `src/` are TSX.
- SCSS Modules for component styles (`*.module.scss`); markdown output styles live in `src/styles/Markdown.scss` using plain global classes (`md-*`) because they are injected via `innerHTML`.
- 2-space indentation, double quotes for JSON, single quotes for TS/TSX strings.
- File names lowercase kebab-case; Vue components PascalCase; utility modules camelCase.
- No project-level linter. Match surrounding style.

## Commit & Pull Request Guidelines

- This submodule is its own git repo (`lytree/docs`); commits here do not affect the parent `lytree` repo.
- Branches: `main` is default; feature work uses `codex/<short-topic>` or topic branches.
- PRs should describe the doc or code change and list files added/modified under `content/docs/`. Screenshots are required when layout, sidebar order, or visual styling changes.

## Agent-Specific Notes

- Do not hand-edit `dist/` — it is generated.
- When adding a top-level docs category, update both `content/docs/meta.json` (both `pages` and `order`) and the category's own `meta.json` with `"root": true`, plus an `icon`.
- Site config (URL, title, edit-link, banner, nav, tokens, copy) lives in `vite.config.ts` under `fumadocsSource()`. Change `banner.id` to re-show the banner to everyone.
- Slots are registered in `theme.tsx` and consumed by `<Slot name="..." ctx={...} />` in the layout. Available names are listed in `README.md`.
- **markdown-it renderer rules must be synchronous.** Shiki's `codeToHtml` is async, so fences are highlighted ahead of time into a map (`MarkdownRenderer.render`) and the sync renderer only looks results up by token index.
- **remark plugin factories must return an attacher** (`() => transformer`), not the transformer itself — unified calls array entries as attachers, and passing a transformer directly makes it receive `undefined` for tree/file.
- `markdown-it-container` v4 changed `validate` to receive the info **string** (not an object), and its `render` is called for both nesting directions — return `''` to keep the default tag.
- The content pipeline is recreated on each dev start; editing Markdown or `meta.json` triggers HMR automatically.