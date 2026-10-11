# Project Sarthi — New Chat Handoff

**Last updated:** 11 October 2026  
**Purpose:** Carry forward the essential product, technical, UX, and implementation context into a new ChatGPT conversation.

## 1. How ChatGPT should work with me

- Act as a product/technical lead and thought partner while Antigravity implements the code.
- Evaluate my suggestions rather than agreeing automatically. Push back when a suggestion harms the product or adds complexity without value.
- Keep ordinary replies short and direct; don't waste tokens on generic checklists, repeated status narration, or things I've said I have manually checked.
- Don't force every task onto Antigravity. If something is better handled by me, say so directly.
- When writing Antigravity prompts, include enough implementation detail. Don't make prompts artificially brief.
- Don't assume Antigravity's reports mean the product is truly working: distinguish unit/mock tests, builds, live backend tests, and actual browser verification.
- UX usefulness is the priority. UI can be iterated over multiple passes; do not try to perfect every visual detail at once.

## 2. Product definition and goal

**Project Sarthi is an interactive workspace for understanding unfamiliar software repositories.** It should help a less-experienced developer get oriented in a codebase and make meaningful decisions without spending hours reading files first.

The core test: after a few minutes, can a user describe what the project does, identify its important parts, understand how they relate, and know where to explore next?

Target users understand basic programming concepts (APIs, dependencies, frameworks) but may not have experience with large or unfamiliar codebases. Do not dumb down technical depth; reduce the experience gap.

The product should not feel like an AI-generated report made of repetitive description cards, nor an expert-only graph visualizer. It should be an inviting, visually interesting way to explore a real codebase. Repo-derived information that users don't immediately see on GitHub or in a code editor—language distribution, counts, structure, package boundaries, module relationships, entrypoints, scripts, etc.—is an important source of value.

Support different repository types: applications, libraries/frameworks, CLI tools, data/ML projects, and other repositories. Don't force them into one generic architecture template or invent structural stages that aren't supported by the repository.

## 3. Current technical stack and project setup

- Git repository: `https://github.com/Naman354/Project-Sarthi-tentative-`
- Local path seen in Antigravity logs: `D:\Development\Project-Sarthi-tentative-`
- Monorepo using npm workspaces.
- Frontend: Next.js 16, React 19, TypeScript, in `apps/web`.
- Backend: Express 5, TypeScript, in `apps/api`.
- Database: PostgreSQL + Prisma (existing project/auth functionality may use it).
- Existing parser/graph/analysis infrastructure remains in place.
- Public repository analysis uses shallow GitHub clones, an evidence collector, a Project Brief generator, and caching.
- Frontend dev server has been run at `http://localhost:3000`; API at `http://localhost:5000`.
- Main roadmap document: `docs/PROJECT_SARTHI_REVISED_PRODUCT_PLAN.md`.

### Groq / secrets / costs

- Groq is used for AI interpretation. Current configured model was changed to `openai/gpt-oss-120b` after the previous model was deprecated.
- API key already exists locally in `apps/api/.env`. Do not ask me to paste it into ChatGPT or a prompt. Never print, reveal, commit, or overwrite the key.
- `.env.example` should contain placeholders only; real environment files must not be committed.
- Strict no-paid-usage requirement: use free-tier access only; do not enable billing or silently fall back to paid providers/models. Handle quota/rate limits with a clear deterministic fallback.
- Avoid unnecessary Groq calls during UI work; reuse cached results and fixtures.

## 4. Implemented foundation and verification history

The following have been reported as implemented. Treat them as the current baseline, but check the live code if a detail becomes relevant.

### Phase 1A: evidence foundation

- Source locations can flow from parser entities into graph nodes and persisted metadata.
- Entity identity was improved for file-scoped routes/components/pages/controllers/services/models/docs.
- Cross-plugin references connect relevant frontend/backend entities where supported.
- Test suite reported 75 passing at the end of that phase.

### Phase 2: public Project Brief MVP

- Anonymous exploration of public GitHub URLs.
- Evidence collector for documentation, file tree, languages, manifests, entrypoints, scripts, tests and available AST entities.
- Multi-ecosystem baseline for JavaScript/TypeScript, Python, Rust and Go, with deeper AST analysis concentrated in JS/TS and selected framework plugins.
- Groq brief generation with Zod validation, filtering of unverified evidence IDs, commit-pinned source links, caching and deterministic fallback.
- Security bounds: GitHub URL validation, shallow clone, size/time/file limits, temporary cleanup, and no execution of repository scripts.
- Brief UI included purpose, capabilities, conceptual map, guided exploration, technical overview and recent repositories.
- API tests later reported 116 passing (including 37 Phase 1A and 41 Phase 2 tests), with API build/lint and frontend lint/build passing.
- Live Groq tests reportedly worked on `expressjs/express`, `pallets/click`, and `dtolnay/anyhow`; rate-limit fallback was also exercised.

### Subsequent UX iterations

- Built adaptive visual model components for web/backend, CLI, library, data/ML and universal fallback.
- Added a technical overview with language distribution, files/directories/dependencies, ecosystem/toolchain details and tabs such as dependencies, entrypoints/scripts, directory structure and distinctive facts.
- Added a contextual module inspector, architectural map, capabilities, and repository history.
- A hydration issue in `RecentRepositoriesBar.tsx` was reportedly fixed using `useSyncExternalStore`.
- A later lint/build pass reportedly succeeded. One browser subagent could not start because Playwright's external CDN returned 404, so its browser-level verification did not complete. I have manually viewed the application and images and given UX feedback.

Important: successful lint/builds do not establish that the design is good or that browser interactions work. Avoid repeating security/secret-hygiene checklists unless a concrete problem appears; I have already manually checked a number of things and asked not to waste tokens on them.

## 5. What I disliked about earlier versions

- Abstract graphs that looked useful mainly to experts or AI agents.
- Similar cards and text descriptions repeated across different repository types.
- Generic AI-SaaS appearance, monotonous card grids, mechanical headings and excessive evidence-focused UI.
- Adaptive map variations that mostly changed labels while leaving the experience essentially the same.
- A Project Fingerprint hero that felt less interesting than the original Technical Overview's charts and repository facts.

Previous requests briefly asked to remove source-evidence UI, but the **latest redesign instruction explicitly says retain all existing features for now**. Do not remove source evidence, Repository Composition, tabs, navigation, or other features in the current styling iteration. Feature removals can be reconsidered later.

## 6. Current visual direction — latest and controlling

I chose the latest dark, immersive Codebase Map concept as the direction to implement. The reference image is available here in the current environment:

`/mnt/data/a_widescreen_dark_themed_ui_screenshot_of_a_softwa.png`

If the new chat cannot access that image, ask me to reattach it rather than guessing.

### Design feel

- Dark, immersive engineering workspace—more like a purpose-built code exploration tool than a generic dashboard.
- The central codebase map is the defining visual identity and should be the main visual attraction.
- Spatial, color-coded groups of modules with readable labels, meaningful connections, subtle grid/depth and understated selection highlighting.
- A contextual inspector on the right updates when a module is selected, showing available details such as role, files, imports/dependencies, exports/usages and metrics.
- Left sidebar for repository identity and exploration modes; slim top navigation with branding, global search and existing destinations.
- Key insights/request flow and other existing feature content remain available, organized without filling the page with identical cards.
- Use a restrained editorial/workbench approach. Map-first, not a conventional KPI-dashboard with a diagram in the middle.
- Logos/icons/thumbnails for detected tech stacks and tools where useful; prefer real/local assets or known icon packs over random stock thumbnails or fragile remote images. Avoid a wall of badges.
- Pie/donut chart for language distribution (not a bar graph), with sensible colors and a clear legend. Label the measurement accurately; file percentages are not code-size percentages.
- Avoid clutter; don't show too many metrics or descriptions in one place.
- Preserve responsive behavior; desktop is the main workbench, narrower screens should adapt sidebar/map/inspector appropriately.

### Palette from the latest Antigravity prompt

| Role                         | Hex       |
| ---------------------------- | --------- |
| Main background              | `#080F12` |
| Sidebar/navigation           | `#0B171A` |
| Main workspace               | `#0D1B1F` |
| Elevated panels              | `#122326` |
| Hover/selected surfaces      | `#193033` |
| Borders/dividers             | `#203538` |
| Main text                    | `#ECF3F2` |
| Secondary text               | `#9AA9AC` |
| Primary interaction          | `#0F8A83` |
| Teal highlight               | `#35D0C3` |
| Core/warm accent             | `#F28C45` |
| Routing/amber accent         | `#F4B04F` |
| Middleware/support blue      | `#4D9FD8` |
| View engine/utilities purple | `#9064D9` |
| Additional subsystem green   | `#55B879` |
| Neutral/unknown              | `#819196` |

Use color consistently for module families, map, legend and inspector. Teal for primary actions, other colors for semantic groups—not every unrelated UI element. Preserve contrast and don't rely on color alone.

## 7. Current feature-preservation requirement

The latest prompt given to Antigravity explicitly says to retain all existing features and functionality for now, including:

- Repository exploration/analysis flow.
- Technical Overview and its tabs, including Distinctive Structural Facts, Repository Composition, dependencies, directory structure, entrypoints/scripts and language distribution.
- Project description and capabilities.
- Architecture map and contextual module exploration.
- Dependencies, directory, entrypoints/scripts views.
- Request flow and insights.
- Documentation and any source-evidence UI still present.
- Projects/saved repositories/history and navigation.
- Authentication/account features.
- Groq integration, deterministic fallback, cache and security safeguards.

The latest redesign is primarily a frontend presentation/layout pass. Avoid a backend rewrite or new dependencies unless there is a specific, demonstrated need.

## 8. Latest Antigravity task already issued

I gave Antigravity a detailed prompt titled **“Project Sarthi — Dark Codebase Explorer Redesign.”** It asks it to:

1. Adopt the palette above and dark engineering-workbench style.
2. Implement a slim header, repository-oriented sidebar, large central Codebase Map, and right contextual inspector.
3. Keep existing insights and request-flow content available below/around the workbench without cluttering it.
4. Use a pie/donut chart for language distribution.
5. Add useful tech stack logos/icons where appropriate.
6. Preserve all functionality; do not remove features or rewrite the backend.
7. Verify lint/type/build and browser layout/interactions where possible, and update the roadmap.

**This is the current pending task.** At the time of this handoff, no implementation report following this latest prompt has been provided in this conversation yet. Continue from its result when I bring it; don't blindly issue the same prompt again.

## 9. How to evaluate the next implementation

Judge the work by whether it creates a substantially different experience, not merely a palette swap.

- Does the Codebase Map feel like the workspace itself rather than a diagram inside a dashboard?
- Is module selection useful and does the right inspector update naturally?
- Is the hierarchy clear and is information density controlled?
- Are colors semantic and consistent across the map and inspector?
- Is language distribution shown as a pie/donut chart?
- Are logos/icons recognizable and useful without clutter?
- Do repository-specific structures show up in the map without fabricated nodes/relationships?
- Are all existing features still accessible?
- Does the page work at desktop and smaller widths?

Prefer a focused, incremental review and specific changes over another broad redesign cycle. Don't claim browser verification unless it actually happened.

## 10. Immediate next step in the new chat

Ask me for Antigravity's output/result from the latest **Dark Codebase Explorer Redesign** prompt if I haven't included it. Review it against the direction above, identify only the meaningful gaps, and recommend the next small iteration. Do not restart product planning from scratch.
