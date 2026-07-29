# Markview Chrome Extension - Implementation Plan

**Date:** 2026-03-31
**Status:** Draft - Revised (Architect Review Round 1)
**Complexity:** MEDIUM-HIGH
**Scope:** ~18-22 new files in `/extension` folder, ~5-line modification to `src/app/api/upload/route.ts` for CORS

---

## RALPLAN-DR Summary

### Principles (5)
1. **Maximize reuse** - Copy and adapt existing components rather than rewriting; keep extension components as close to web originals as possible
2. **Client-side only** - All rendering happens in the extension; server calls only for the Share feature
3. **Offline-first** - Extension must work without network (except Share); no CDN dependencies at runtime
4. **Monorepo isolation** - Extension lives in `/extension` with its own build pipeline; does not affect existing Next.js app (except the minimal CORS addition to the upload API)
5. **Narrow side panel UX** - All UI decisions optimized for 400-500px width; Edit/View tabs (not split view)

### Decision Drivers (Top 3)
1. **Build tooling choice** - Must bundle React + all markdown libs into a Chrome extension with minimal config; **risk: CRXJS v2 targets Vite 4 but Tailwind CSS 4 requires Vite 5+** (mitigated by Step 0 spike)
2. **Component sharing strategy** - How to reuse `src/components/*` without coupling extension build to Next.js
3. **Mermaid CSP compliance** - Mermaid.js uses `eval()`/`Function()` internally which Manifest V3 CSP blocks; **requires sandboxed iframe approach**

### Option A: Vite + CRXJS beta / vite-plugin-web-extension (Recommended)
- **Pros:** First-class Chrome extension support, HMR during dev, handles manifest generation, tree-shaking for bundle size, native TypeScript/React support
- **Cons:** CRXJS beta may have rough edges with Vite 5; fallback to `vite-plugin-web-extension` adds minor config overhead
- **Mitigation:** Step 0 spike validates the exact plugin + Vite 5 + Tailwind 4 combination before any real work begins
- **Bundle size estimate:** ~800KB-1.2MB (React + react-markdown + remark/rehype + highlight.js subset)

### Option B: Webpack + custom config
- **Pros:** Battle-tested for Chrome extensions, many community examples, fine-grained control
- **Cons:** Significantly more boilerplate config, slower builds, no HMR for side panels, manual manifest handling
- **Bundle size estimate:** Similar, but harder to tree-shake

### Option C: esbuild bare
- **Pros:** Fastest builds, minimal config
- **Cons:** No CSS/Tailwind plugin ecosystem, manual chunk splitting, poor DX for development

**Decision: Option A (Vite + CRXJS beta or vite-plugin-web-extension)** - Best DX-to-complexity ratio. Step 0 spike determines which Vite plugin works. Tailwind CSS 4 works natively with Vite via `@tailwindcss/vite`.

**Why alternatives were not chosen:**
- Webpack (B): Too much boilerplate for the scope; slower iteration
- esbuild (C): Lacks Tailwind/CSS module support needed to reuse existing styles

---

## Context

The Markview web app (`markview.kr`) renders markdown with GFM, code highlighting, KaTeX, and Mermaid support. This plan creates a Chrome extension that reuses those rendering components in a side panel, letting users paste/edit markdown and get instant Markview-quality previews without visiting the website.

### Existing Assets to Reuse (copy into extension, adapt)
| Source File | Reuse Level | Adaptation Needed |
|---|---|---|
| `src/components/MarkdownRenderer.tsx` | 9/10 | Remove `"use client"` directive |
| `src/components/MermaidBlock.tsx` | 5/10 | **Major:** Replace direct Mermaid calls with postMessage to sandboxed iframe |
| `src/components/ThemeToggle.tsx` | 7/10 | Replace `localStorage` with `chrome.storage.local` |
| `src/components/ExportButton.tsx` | 6/10 | Use `chrome.downloads` API; embed CSS inline instead of CDN links |
| `src/app/globals.css` | 9/10 | Copy prose/theme/print styles; keep `@import "tailwindcss"` (processed by `@tailwindcss/vite`) |
| `public/markview_text_icon.svg` | 10/10 | Copy as extension asset |
| `public/markview_text_icon_dark.svg` | 10/10 | Copy as extension asset |
| `src/components/TableOfContents.tsx` | Excluded | Side panel too narrow (400-500px) for TOC sidebar; may reconsider for V2 |

### New Code to Build
- Extension manifest (`manifest.json` - Manifest V3)
- Side panel HTML shell + React entry point
- `ExtensionApp.tsx` - Main container with Edit/View tabs
- `ShareToMarkview.tsx` - Upload markdown to markview.kr API, copy URL
- `mermaid-sandbox.html` - Sandboxed iframe for Mermaid rendering (CSP workaround)
- `highlightLanguages.ts` - Curated subset of highlight.js languages
- Vite build config with CRXJS/vite-plugin-web-extension
- Extension-specific `tsconfig.json` and `package.json`

---

## Work Objectives

Build a fully functional Chrome extension side panel that:
1. Accepts markdown input (paste or file open) and renders it with Markview styling
2. Provides Edit/View tab toggle suitable for 400-500px side panel width
3. Supports Share (upload to markview.kr), HTML export, and PDF print
4. Renders GFM, code highlighting, KaTeX (lazy), Mermaid (via sandboxed iframe, lazy) identically to the web app
5. Follows browser theme with manual dark/light toggle via `chrome.storage.local`
6. Works fully offline except for the Share feature

---

## Guardrails

### Must Have
- Manifest V3 compliance (no Manifest V2 APIs)
- Side panel API (`chrome.sidePanel`) as the primary UI surface
- All rendering libraries bundled (no CDN runtime dependencies)
- KaTeX and Mermaid loaded lazily to keep initial load fast
- Mermaid rendered in a sandboxed iframe to avoid CSP violations from `eval()`/`Function()`
- Dark mode follows `prefers-color-scheme` on first load, then respects user toggle stored in `chrome.storage.local`
- Share button posts to existing `POST /api/upload` endpoint on markview.kr
- CORS headers added to `src/app/api/upload/route.ts` to allow `chrome-extension://` origins
- Highlight.js limited to ~15 common languages to keep bundle size under budget

### Must NOT Have
- No content script injection into web pages (side panel only)
- No background service worker beyond what the side panel API requires
- No split editor view (side panel is too narrow)
- No server-side rendering or Next.js dependency in extension build

---

## Task Flow

```
Step 0: Build Spike  --> Step 1: Scaffold        --> Step 2: Core UI
  (validate Vite 5 +      (project structure,         (ExtensionApp with
   CRXJS beta or            manifest, full build        Edit/View tabs,
   vite-plugin-web-ext      pipeline with proven        textarea input,
   + Tailwind 4 +           plugin choice)              file open button)
   React 19)
        |                        |                            |
        v                        v                            v
                          Step 3: Port Components      --> Step 4: Features
                            (MarkdownRenderer,              (Share upload + CORS,
                             MermaidBlock via                 HTML export,
                             sandboxed iframe,               PDF print,
                             highlight.js subset)            theme persistence)
                                     |
                                     v
                               Step 5: Polish & Package
                                 (icons, store listing assets,
                                  final bundle optimization,
                                  test on Chrome)
```

---

## Detailed TODOs

### Step 0: Build Pipeline Spike
**Goal:** Validate that the chosen Vite plugin works with Vite 5 + Tailwind CSS 4 + React 19 in a Chrome extension context.

**Actions:**
1. Create a minimal `extension-spike/` directory (temporary, deleted after validation)
2. Install `@crxjs/vite-plugin@beta` with Vite 5, `@tailwindcss/vite`, React 19, and TypeScript
3. Create a bare manifest.json (side_panel permission only), one HTML file, one React component with a Tailwind class
4. Build and load as unpacked extension in Chrome
5. **If CRXJS beta fails:** repeat with `vite-plugin-web-extension` (actively maintained, Vite 5/6 compatible)
6. Record the working plugin + exact version pins in a spike report

**Acceptance Criteria:**
- [ ] Empty extension loads in Chrome without errors using the chosen Vite plugin + Vite 5
- [ ] A React component renders in the side panel
- [ ] Tailwind CSS classes (e.g., `bg-blue-500 text-white p-4`) apply correctly
- [ ] Exact dependency versions are pinned and documented for use in Step 1
- [ ] Spike directory is deleted; only the version pins carry forward

### Step 1: Project Scaffold and Build Pipeline
**Goal:** Extension project compiles and loads in Chrome as an empty side panel using the validated build tooling from Step 0.

**Files to create:**
- `extension/package.json` - Dependencies with pinned versions from Step 0: react, react-dom, react-markdown, remark-gfm, remark-math, rehype-highlight, rehype-katex, rehype-sanitize, mermaid, katex, highlight.js, tailwindcss, vite, [chosen vite plugin], @tailwindcss/vite (`highlight.js` and `katex` are explicit direct dependencies needed for CSS bundling and language subset registration)
- `extension/vite.config.ts` - Chosen plugin config, Tailwind CSS 4 via `@tailwindcss/vite`, React plugin, output to `extension/dist`
- `extension/tsconfig.json` - Strict mode, JSX react-jsx, paths alias `@ext/*` for extension src
- `extension/manifest.json` - Manifest V3: `side_panel.default_path`, `permissions: ["sidePanel", "storage", "downloads"]`, `action` (toolbar icon opens side panel), `sandbox.pages: ["src/mermaid-sandbox.html"]`; include a minimal `background.ts` service worker to call `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`
- `extension/src/sidepanel.html` - Minimal HTML shell with `<div id="root">` and script tag
- `extension/src/main.tsx` - React 19 `createRoot` entry point, renders placeholder
- `extension/src/styles/globals.css` - Copy from `src/app/globals.css` with `@import "tailwindcss"` retained (processed by `@tailwindcss/vite`), plus prose/theme/print styles

**Acceptance Criteria:**
- [ ] `cd extension && npm install && npm run build` produces `dist/` with valid Chrome extension
- [ ] Loading `dist/` as unpacked extension in `chrome://extensions` succeeds without errors
- [ ] Clicking the extension icon opens a side panel with placeholder content
- [ ] Tailwind CSS classes render correctly in the side panel

### Step 2: Core UI Shell (ExtensionApp with Edit/View Tabs)
**Goal:** Users can type/paste markdown in Edit tab and see raw text; View tab shows placeholder.

**Files to create:**
- `extension/src/components/ExtensionApp.tsx` - Main container: header (logo, tab toggle, action buttons), Edit tab (textarea), View tab (placeholder). State: `content: string`, `mode: "edit" | "view"`, `title: string` (derived from first H1 or "Untitled")
- `extension/src/components/FileOpenButton.tsx` - Button that opens file picker for `.md` files, reads content via `FileReader`, sets parent state

**Key UX decisions:**
- Tab toggle styled identically to `SplitEditor.tsx` lines 83-97 (rounded pill toggle)
- Textarea uses same font/style as `SplitEditor.tsx` lines 153-161
- Header height ~50px (compact for side panel vs 66px on web)
- File open button in header or as empty-state CTA

**Acceptance Criteria:**
- [ ] Edit tab shows a full-height textarea; typing updates internal state
- [ ] View tab shows "No content" placeholder when empty
- [ ] Tab toggle visually matches the web app's pill-style toggle
- [ ] File open button reads `.md` files and populates the editor
- [ ] Content persists when switching between Edit and View tabs

### Step 3: Port Rendering Components
**Goal:** View tab renders markdown identically to markview.kr, including Mermaid via sandboxed iframe.

**Files to create (copy and adapt):**
- `extension/src/components/MarkdownRenderer.tsx` - Copy from `src/components/MarkdownRenderer.tsx`, remove `"use client"` directive, import curated highlight.js language subset, **update the `code` component's Mermaid branch to use the extension's iframe-based `MermaidBlock` (same `chart: string` prop but internally uses postMessage), and strip unused Mermaid SVG tags from `customSchema` (dead code in extension since Mermaid SVG is injected via dangerouslySetInnerHTML outside the sanitizer)**
- `extension/src/components/MermaidBlock.tsx` - **Rewritten** (not a direct copy): renders a placeholder container, uses `postMessage` to send Mermaid diagram code to the sandboxed iframe, receives rendered SVG back via `message` event, injects SVG into the container
- `extension/src/mermaid-sandbox.html` - Sandboxed HTML page that loads Mermaid.js, listens for `postMessage` with diagram code, calls `mermaid.render()`, sends SVG string back to parent via `postMessage`. Declared in manifest.json under `sandbox.pages`
- `extension/src/lib/highlightLanguages.ts` - Registers ~15 common languages with highlight.js: javascript, typescript, python, java, c, cpp, css, html, xml, bash, shell, json, sql, go, rust, ruby, php. Exports the configured `hljs` instance
- `extension/src/styles/katex.css` - Bundle KaTeX CSS locally (from `node_modules/katex/dist/katex.min.css`)
  - **Note:** KaTeX font files (`.woff2`) must also be bundled — copy from `node_modules/katex/dist/fonts/` into the extension's public assets or configure Vite to include them automatically.
- `extension/src/styles/highlight.css` - Bundle highlight.js GitHub theme locally (from `node_modules/highlight.js/styles/github.css`)

**Mermaid sandbox architecture:**
```
Side Panel (main world)              Sandboxed iframe
┌──────────────────────┐            ┌──────────────────────┐
│ MermaidBlock.tsx      │            │ mermaid-sandbox.html  │
│                      │  postMsg   │                      │
│  sends diagram code ─┼───────────>│  mermaid.render()    │
│                      │            │                      │
│  receives SVG <──────┼────────────┼─ sends SVG back      │
│  injects into DOM    │  postMsg   │                      │
└──────────────────────┘            └──────────────────────┘
```

**Mermaid sandbox protocol:**
- Message format: `{ type: 'render', code: string, theme: 'dark'|'light' }` → `{ type: 'svg', svg: string }` | `{ type: 'error', message: string }`
- Validate `event.origin` in both directions for security
- Timeout: 5 seconds; show error placeholder if no response
- Theme: pass current theme via postMessage (iframe cannot read parent's `data-theme` attribute)

**Integration:**
- Import `MarkdownRenderer` in `ExtensionApp.tsx` View tab
- Import KaTeX and highlight.js CSS in `globals.css` or `main.tsx`
- `MarkdownRenderer` uses `highlightLanguages.ts` for the `rehype-highlight` configuration
- `MermaidBlock` renders via iframe sandbox; no direct Mermaid import in the main extension context

**Acceptance Criteria:**
- [ ] GFM tables, task lists, strikethrough render correctly
- [ ] Code blocks have syntax highlighting for the 15+ registered languages
- [ ] LaTeX math renders via KaTeX (both inline `$...$` and display `$$...$$`)
- [ ] Mermaid diagrams render via sandboxed iframe (test with a flowchart code block)
- [ ] **No CSP violations in Chrome DevTools console** (critical: Mermaid runs only inside sandbox)
- [ ] Prose styling (typography, spacing, colors) matches markview.kr
- [ ] Highlight.js bundle is under 200KB (language subset only)

### Step 4: Features (Share, Export, Theme, CORS)
**Goal:** All user-facing features work, including cross-origin Share from extension to markview.kr.

**Files to create/modify:**
- `extension/src/components/ThemeToggle.tsx` - Copy from `src/components/ThemeToggle.tsx`, replace `localStorage.getItem/setItem` with `chrome.storage.local.get/set`, add `prefers-color-scheme` media query listener for initial theme
- `extension/src/components/ExportButton.tsx` - Copy from `src/components/ExportButton.tsx`, modify `exportHTML()` to embed KaTeX CSS and highlight.js CSS inline (no CDN links), modify `downloadFile()` to use `chrome.downloads.download()` API for cleaner UX
- `extension/src/components/ShareButton.tsx` - New component: POST content as FormData to `https://markview.kr/api/upload`, receive `{ slug }`, construct URL `https://markview.kr/v/{slug}`, copy to clipboard, show success toast (Note: this is NOT a copy of the existing `src/components/ShareButton.tsx` which only copies URLs to clipboard; the extension's ShareButton has entirely different semantics — it uploads content to the server)
- **`src/app/api/upload/route.ts`** (existing web app file) - Add CORS headers: new `OPTIONS` handler returning `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`; add same headers to `POST` response. This is a ~10-line addition to support `chrome-extension://` origins

**CORS addition to upload route:**
```typescript
// New: OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      // TODO: Before Chrome Web Store publish, restrict to chrome-extension://<EXTENSION_ID>
      // Using "*" during development only
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Existing POST handler: add CORS headers to all responses
// headers: { "Access-Control-Allow-Origin": "*" }
```

**Theme logic:**
```
On extension load:
  1. Check chrome.storage.local for saved theme preference
  2. If none, read window.matchMedia("(prefers-color-scheme: dark)")
  3. Apply data-theme attribute to document
  4. Listen for matchMedia changes (follow browser if no manual override)
On toggle:
  1. Flip theme, save to chrome.storage.local
  2. Apply data-theme attribute
```

**Acceptance Criteria:**
- [ ] Theme toggle switches dark/light and persists across side panel open/close
- [ ] On first install, theme follows browser preference
- [ ] Share button uploads content to markview.kr and copies URL to clipboard
- [ ] Share button shows loading state during upload and error state on failure
- [ ] **CORS preflight (OPTIONS) returns correct headers on markview.kr**
- [ ] **Share works from `chrome-extension://` origin without CORS errors**
- [ ] HTML export downloads a self-contained HTML file (no external dependencies)
- [ ] PDF export triggers `window.print()` with proper print styles
- [ ] Export dropdown closes when clicking outside (same behavior as web app)
- [ ] Share button is disabled or shows 'offline' indicator when network is unavailable (`navigator.onLine`)

### Step 5: Polish, Icons, and Production Build
**Goal:** Extension is ready for Chrome Web Store submission.

**Files to create/modify:**
- `extension/public/icons/` - Extension icons: 16x16, 32x32, 48x48, 128x128 (derived from `public/markview_icon.png`)
- `extension/public/markview_text_icon.svg` - Copy from `public/markview_text_icon.svg`
- `extension/public/markview_text_icon_dark.svg` - Copy from `public/markview_text_icon_dark.svg`
- `extension/vite.config.ts` - Add production optimizations: minification, chunk splitting (separate vendor chunk for react-markdown + rehype + remark), lazy chunks for mermaid-sandbox and katex
- Update root `.gitignore` to add `extension/dist/`

**Bundle optimization targets:**
- Initial load chunk: < 500KB (React + core UI)
- Markdown rendering chunk: < 400KB (react-markdown + remark + rehype + highlight.js language subset)
- Lazy chunks: KaTeX (~300KB), Mermaid sandbox (~800KB, loaded in iframe on first use)

**Acceptance Criteria:**
- [ ] Extension loads in under 500ms on mid-range hardware
- [ ] All icons display correctly in Chrome toolbar, extensions page, and side panel header
- [ ] `npm run build` produces a `dist/` folder ready for Chrome Web Store upload
- [ ] No console errors or warnings in production build
- [ ] Full end-to-end test: paste markdown with GFM + code + math + mermaid, switch themes, share, export HTML, export PDF
- [ ] Extension works offline (all features except Share)

---

## Target File Structure

```
extension/
  package.json
  vite.config.ts
  tsconfig.json
  manifest.json
  public/
    icons/
      icon-16.png
      icon-32.png
      icon-48.png
      icon-128.png
    markview_text_icon.svg
    markview_text_icon_dark.svg
  src/
    main.tsx
    sidepanel.html
    mermaid-sandbox.html       # Sandboxed page for Mermaid rendering (CSP-safe)
    styles/
      globals.css              # Adapted from src/app/globals.css (keeps @import "tailwindcss")
      katex.css                # Bundled from node_modules
      highlight.css            # Bundled from node_modules
    lib/
      highlightLanguages.ts    # Curated ~15 language subset for highlight.js
    components/
      ExtensionApp.tsx         # Main container (NEW)
      FileOpenButton.tsx       # File picker (NEW)
      MarkdownRenderer.tsx     # Copied + adapted (uses highlight subset)
      MermaidBlock.tsx          # REWRITTEN (postMessage to sandbox iframe)
      ThemeToggle.tsx           # Copied + adapted (chrome.storage)
      ExportButton.tsx          # Copied + adapted (chrome.downloads, inline CSS)
      ShareButton.tsx           # NEW (upload to markview.kr)
  dist/                        # Build output (gitignored)

src/app/api/upload/route.ts    # MODIFIED: +OPTIONS handler, +CORS headers (~10 lines)
```

---

## Success Criteria

1. Extension installs from unpacked `dist/` folder and opens a functional side panel
2. Pasting markdown with GFM, code blocks, LaTeX, and Mermaid renders identically to markview.kr
3. Edit/View tab toggle works smoothly within 400-500px side panel width
4. Share produces a working markview.kr URL (CORS verified from extension origin)
5. HTML export produces a self-contained file; PDF triggers print dialog
6. Theme follows browser on first load, respects manual toggle, persists choice
7. Extension works fully offline (except Share)
8. Production bundle under 2MB total (with lazy loading, initial chunk under 500KB)
9. Zero CSP violations - Mermaid runs exclusively in sandboxed iframe
10. Build pipeline validated via Step 0 spike before committing to tooling choice

---

## ADR: Architecture Decision Record

**Decision:** Build Chrome extension as isolated Vite project in `/extension` with copied (not shared/symlinked) components, Mermaid in sandboxed iframe, and a minimal CORS addition to the web app upload API.

**Drivers:**
1. Extension must not depend on Next.js build pipeline
2. Components need minor adaptations (no `"use client"`, `chrome.storage` instead of `localStorage`)
3. Monorepo isolation prevents extension changes from breaking the web app
4. Mermaid.js uses `eval()`/`Function()` which Manifest V3 CSP prohibits in the main extension context
5. Chrome extension origin (`chrome-extension://`) is blocked by same-origin policy on the upload API

**Alternatives Considered:**
- **Shared component library (extracted to `/packages/ui`):** Proper but over-engineered for 5-6 components; adds workspace config complexity, versioning overhead, and blocks the extension on a refactor of the web app
- **Symlinked source files:** Fragile across OS (Windows), confuses TypeScript path resolution, makes independent adaptation impossible
- **Direct Mermaid import (no sandbox):** Impossible under Manifest V3 CSP; `eval()` and `Function()` are blocked with no way to relax the policy
- **Proxy server for CORS:** Over-engineered; adding 10 lines to the existing endpoint is simpler and more maintainable

**Why Chosen:** Copying ~6 small files (< 200 lines each) is simpler than restructuring the monorepo. The sandboxed iframe for Mermaid is the only viable approach under Manifest V3 CSP. The CORS change to the upload route is minimal (~10 lines) and enables the Share feature without an intermediary.

**Consequences:**
- Duplicated code for 5-6 components (acceptable given small size and stability)
- Bug fixes in web components must be manually ported to extension (low frequency expected)
- `MermaidBlock.tsx` in the extension diverges significantly from the web version (postMessage architecture vs direct calls)
- **The web app upload API now accepts cross-origin requests** - this is acceptable because the endpoint is public-facing and idempotent (creates documents, no auth required)
- Build tooling depends on Step 0 spike outcome; if CRXJS beta fails, `vite-plugin-web-extension` is the fallback

**Follow-ups:**
- If a third surface (e.g., VS Code extension) is added, reconsider extracting a shared package
- Monitor component drift between web and extension; if > 3 patches need dual-porting, extract shared lib
- Consider restricting CORS `Access-Control-Allow-Origin` to specific extension ID once published to Chrome Web Store

---

## Changelog

| Date | Revision | Reason |
|---|---|---|
| 2026-03-31 | Initial draft | Created from planning interview |
| 2026-03-31 | Architect Review R1 | Addressed 3 blocking issues and 2 recommended improvements |
| 2026-03-31 | Critic Review R1 | Applied improvements: MarkdownRenderer adaptation clarity, CORS security, missing deps, KaTeX fonts, Mermaid sandbox protocol, ToC exclusion, ShareButton clarification, offline Share UX, background service worker |

### Blocking Issues Addressed:
1. **Mermaid CSP Violation** - Added `mermaid-sandbox.html` sandboxed iframe approach. `MermaidBlock.tsx` rewritten to use `postMessage` instead of direct Mermaid calls. Added sandbox architecture diagram in Step 3. Updated manifest to declare `sandbox.pages`.
2. **CORS on Upload API** - Relaxed the "no modifications to existing src/" guardrail. Added sub-task in Step 4 to add `OPTIONS` handler and `Access-Control-Allow-Origin` headers to `src/app/api/upload/route.ts`. Updated guardrails, ADR consequences, and file structure.
3. **CRXJS + Vite 5 + Tailwind 4 Compatibility** - Added Step 0 (Build Pipeline Spike) to validate `@crxjs/vite-plugin@beta` with Vite 5 + Tailwind 4 + React 19, with `vite-plugin-web-extension` as documented fallback. Updated RALPLAN-DR to acknowledge the build tooling risk. Updated Task Flow diagram.

### Recommended Improvements Addressed:
4. **Highlight.js Language Subset** - Added `extension/src/lib/highlightLanguages.ts` registering ~15 common languages. Added to file structure, Step 3 files, and acceptance criteria (bundle under 200KB for highlight subset).
5. **Tailwind CSS @theme Processing** - Corrected: `@import "tailwindcss"` is now **retained** in the extension's `globals.css` (processed by `@tailwindcss/vite`), not removed. Updated the assets-to-reuse table and Step 1 description.
