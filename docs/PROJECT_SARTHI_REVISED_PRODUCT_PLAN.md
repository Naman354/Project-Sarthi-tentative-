# Project Sarthi — Revised Product Plan

**Plan status:** Active roadmap, revised after the Phase 2 Project Brief implementation and first product review  
**Prepared:** 10 October 2026  
**Product focus:** A distinctive, project-adaptive visual overview that helps an unfamiliar user understand a repository within their first five minutes  
**Cost constraint:** No subscriptions, no paid API usage, no billing-enabled fallback

---

## 1. Product decision

### Product definition

**Project Sarthi is an interactive visual guide to unfamiliar software repositories.** It turns a repository into an informative, distinctive overview of its ecosystem, structure, project type, and important capabilities. The interface should make useful repository facts inviting to explore, while keeping the project purpose clear and using internal evidence grounding to protect accuracy. Source-evidence inspection is not part of the user-facing experience in the current direction.

Sarthi is for more than developers working on their own projects. Primary scenarios include:

- Discovering an unfamiliar open-source repository.
- Understanding a project before deciding whether to contribute to it.
- Evaluating a student, hackathon, or task submission against stated requirements.
- Exploring a repository for learning or research.

### North-star question

> After five minutes in Sarthi, can someone unfamiliar with the repository explain what it does, name its most important capabilities, and describe how its main parts fit together?

The product should be judged by the accuracy and usefulness of that understanding—not by the number of graph nodes, metrics, screens, or AI features it generates.

### First-time user journey

1. Paste a public repository URL.
2. See a compelling Technical Overview with useful ecosystem facts and **Distinctive Structural Facts** selected by default.
3. Quickly understand the project's purpose and concrete capabilities in a separate, easy-to-find section.
4. Explore the project's structure and select meaningful parts to understand what they do and how they relate.
5. Leave with a clearer mental model of what the repository contains and what makes it distinctive.

The first three steps must already be valuable. Users should not need an account, learn graph terminology, or configure a complex workspace before receiving a useful introduction, where practical protections against abuse allow it.

---

## 2. Product experience

### A. Technical Overview — the hero experience

The Technical Overview is the primary visual hero. Preserve the inviting, data-rich direction of the earlier overview rather than replacing it with a generic identity card. It should combine visualized ecosystem facts with a handful of useful structural observations, without becoming a grid of interchangeable statistic cards.

Within the hero's tabs, **Distinctive Structural Facts must be the leftmost tab and selected by default**. It must contain useful, repository-specific information—not placeholders or generic architecture labels. Depending on the evidence available, these facts may include entrypoints, public exports or commands, workspace/package boundaries, notable subsystems, scripts, build tools, or testing setup.

Other useful hero content may include:

- Language distribution, with a clear explanation of what the percentages measure.
- Meaningful file counts and detected languages, frameworks, runtimes, and important tools.
- Dependency counts and structural metrics whose meaning is clear and whose calculation is reliable.
- A project-type-appropriate visual summary when it explains something that metrics alone cannot.

Remove the **Repository Composition** section/tab entirely. Do not recreate it under a different name. Keep individual metrics that genuinely help a user understand a repository, but place them where they make sense within the Technical Overview.

Do not promote arbitrary numbers just to fill the hero. Never confuse file-count percentages with code-size percentages, or declared dependencies with dependencies proven to be used at runtime. If a fact cannot be reliably collected or explained, omit it.

### B. Project-type-aware visual models

Different repository types must not collapse into the same set of cards with only their labels changed. First classify the repository using detected manifests, structure, entrypoints, docs, symbols, and other available signals. Then select and populate the most appropriate visual model. Classification is a hint with confidence/uncertainty, not a rigid exclusive label.

Examples of distinct visual models:

- **Web/application:** a system map showing major client, API, service, data, and external-service areas, where actually detected.
- **Library/framework:** public API or package surface, core modules, and a usage/extension path.
- **CLI/tool:** command tree and the path from input/arguments through processing to output.
- **Data/ML:** data sources, preparation steps, model/training or inference stages, and outputs—only where supported by the repository.
- **Infrastructure/DevOps:** deployment units, environments, configuration, and pipeline stages.
- **Game/simulation:** runtime loop and major gameplay/simulation systems or asset groups, where identifiable.
- **Monorepo:** workspace/package topology and important connections between packages.

These are design directions, not hard-coded assumptions. Use a distinct visual grammar and hierarchy when it helps comprehension, but do not invent behavior or relationships to make a diagram look complete. If classification is uncertain or deeper analysis is unsupported, use a clear universal project fingerprint rather than forcing an inappropriate specialist layout.

Start with a small set of reusable visual primitives and a handful of strong project-type layouts. Do not build a large plugin/layout framework in this iteration.

### C. Project description and capabilities — clear supporting context

Show the project description in its own prominent, easy-to-find section near the Technical Overview. Keep the existing concise writing style, but make sure this section is not mistaken for a caption or buried below multiple panels.

Rewrite capabilities so they describe concrete, project-specific jobs, behaviors, or value. Labels such as “routing,” “core engine,” or “data layer” are not useful capabilities on their own. Explain what a user or developer can actually accomplish with the project, what it enables, or what distinct behavior it implements. Prefer a few meaningful capabilities over a fixed number of vague ones. Keep the descriptions concise and clearly differentiated.

### D. Guided exploration instead of scattered description cards

Organize the experience around a few meaningful visual and interaction choices rather than a long stack of disconnected cards. Users should be able to select a major system, capability, package, command, or pipeline stage and understand:

- What role it plays in this project.
- What it connects to or enables, when that connection is supported.
- Where to go next to understand the workflow.

The next step should change naturally with the selected project type and selected item. Avoid showing the same generic collection of cards on every repository simply because the frontend has those components available.

### E. Evidence remains internal to the current UX direction

Evidence quality remains essential to correctness, but **source evidence must not appear in the user-facing interface in this iteration**. Remove evidence tables, source snippets, evidence tabs, source-evidence badges, and evidence-specific UI labels. Do not surface line-pinned source links as a replacement for those elements.

Keep the backend's evidence bundle, claim validation, and other internal grounding mechanisms so the product continues to avoid unsupported claims. This is a UX decision, not a request to remove the accuracy safeguards or rewrite the analysis pipeline. Uncertainty should be communicated in natural language only when it materially affects a user's understanding; avoid exposing internal evidence terminology.

### F. Progressive disclosure and site-wide navigation

Use this as a starting hierarchy, then make informed UX decisions from the actual code and rendered experience:

1. **Technical Overview:** an inviting visual hero, with Distinctive Structural Facts first and selected by default.
2. **Project description:** clearly visible context explaining what the project does.
3. **Meaningful capabilities and exploration:** help users discover what the project enables and understand its important parts.
4. **Additional technical details:** reveal when useful, without repeating facts or turning every detail into a card.

Review every major heading, label, tab, and navigation destination. Replace mechanical/internal wording with language that tells users what they will get or be able to do. Audit the Projects and Overview tabs: make their purposes clear and distinct, or combine/remove them if they currently lead to redundant or low-value experiences. Do not keep a navigation item merely because the route or component already exists.

The aim is not to remove technical depth. It is to arrange information so users can understand the project naturally, then choose where to explore further.

---

## 3. Scope: keep, change, defer, remove from the primary experience

### Keep and reuse if reliable

- Repository URL validation and fetching/cloning of public repositories.
- Repository inventory, manifests, README and documentation parsing.
- Existing TypeScript, Express, Prisma/PostgreSQL monorepo foundations.
- Parsers that produce verified symbols, source locations, and relationships.
- Graph storage/versioning where it supports the conceptual map and evidence links.
- Search/navigation components where they help users explore the project.
- Authentication and saved-project functionality for users who want to return later.

Existing functionality is not automatically retained just because it exists. It must be tested for correctness and contribute to the new user journey.

### Rework

- **Parser/graph outputs:** fix entity identity, path/line accuracy, relationship resolution, and unsupported cases before using the results to make explanatory claims.
- **Insight generation:** replace generic scores and weak heuristics with useful, source-backed statements. Prioritize what helps a newcomer understand the project.
- **Resume Session:** treat as a later returning-user feature, not the main first-time experience.
- **UI/navigation:** center the experience on Technical Overview → prominent project description → concrete capabilities and project-specific exploration. Remove source-evidence UI entirely while preserving internal evidence validation.
- **Tests:** add end-to-end repository fixtures that check the user-visible findings, not only that individual parser functions return some entities.

### Defer

- General-purpose AI chat over a repository.
- Embeddings and a vector database until evidence retrieval cannot be handled adequately by deterministic search and relationships.
- Plugin systems and a large set of framework-specific analyzers before the universal baseline is useful.
- Resume-session intelligence, Git change summaries, advanced dependency analysis, and technical health diagnostics.
- Multi-agent AI orchestration, fine-tuning, custom model training, and a separate model server.

### Remove from the default first-time experience

- Health scores as the hero content.
- Large, unfiltered node-edge graphs as the first screen.
- A generic language-percentage/technology-badge strip presented as if it were a meaningful project overview.
- Repeated generic cards that make different repositories feel interchangeable.
- All source-evidence UI, including evidence tabs/tables, line snippets, source-evidence links, and evidence-status badges.
- Decorative metrics whose meaning or reliability is unclear.
- Claims such as “AI-synthesized” unless the current flow genuinely uses AI and the label benefits the user.
- Any generated claim or connection that cannot be traced to evidence.

Do not delete existing code immediately. First remove it from the critical path, then decide whether to reuse, repair, or delete it after the new journey is validated.

---

## 4. Cross-domain understanding strategy

Sarthi should have a useful baseline for a wide range of repositories, and deeper support where the code and tooling make it possible.

### Universal repository inventory

Collect, where present:

- README and documentation files.
- Languages and file distribution.
- Package/build/dependency manifests.
- Entrypoints, scripts, public exports, command definitions, configuration.
- Tests and examples.
- Key assets, schemas, data files, and deployment configuration.
- Git metadata and a fixed commit SHA.

### Project-type hints

Classify projects using a combination of deterministic clues and AI-assisted interpretation. Categories are hints, not mutually exclusive labels. Examples include applications, libraries/frameworks, CLIs, data/ML projects, games/simulations, infrastructure repositories, and monorepos.

### Progressive depth

- **Baseline:** explain purpose, structure, manifests, docs, and entry points using the universal inventory.
- **Specialized:** extract deeper relationships with a parser for a known language/framework or project type.
- **Behavioral:** show detailed flows only where the evidence supports them.

An unsupported language must not make the whole product useless. Sarthi should deliver the baseline, label limitations, and avoid pretending to understand execution flow where it has no reliable analysis.

---

## 5. AI plan and no-cost policy

### AI's responsibility

AI turns extracted facts into a newcomer-friendly interpretation. It should not be the source of truth for file paths, symbol existence, dependency relationships, test status, or runtime behavior.

Use AI for:

1. Interpreting the repository's likely purpose and audience.
2. Proposing a prioritized set of candidate capabilities.
3. Grouping related components into understandable conceptual areas.
4. Writing plain-language explanations and a short guided introduction.
5. Explaining a selected capability from a focused set of relevant evidence.

Do not initially use AI for autonomous code execution, modifying the repository, broad security verdicts, invented architectural connections, or an unconstrained agent workflow.

### Provider decision

**Do not use OpenAI API as the initial provider.** Its API is priced by usage, which conflicts with the project's no-bill constraint. A ChatGPT subscription is separate from API usage and should not be assumed to include API credits.

For the prototype, use a small provider interface and evaluate these candidates against the same public-repository test set:

- **Groq free API — first candidate:** the documented free plan has per-model rate/token limits, and Groq says inference inputs/outputs are not retained by default, although temporary logging can occur for reliability or abuse investigations. Candidate models and free limits can change. This is a promising first implementation under the no-cost and data-minimization constraints, not a guarantee of unlimited service.
- **Gemini Developer API free tier — quality comparison only on public code:** Google currently lists free access for selected models, but its terms for unpaid use say prompts and responses may be used to improve products and may be reviewed by people. Do not send private, sensitive, or confidential code through the unpaid tier.
- **Ollama/local models — optional later path:** no inference API fee, but users need to install and run models locally, and latency/model quality depend on their hardware. This is not an acceptable requirement for a frictionless first-time user.
- **OpenRouter free models — optional experiment:** convenient access to multiple free model variants, but request quotas and the set of free models/providers can change. Do not make Sarthi dependent on it without evaluation.

Official references checked 10 October 2026:

- OpenAI API pricing: https://platform.openai.com/pricing/
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API unpaid-service data terms: https://ai.google.dev/gemini-api/terms
- Groq rate limits: https://console.groq.com/docs/rate-limits
- Groq data handling: https://console.groq.com/docs/your-data
- OpenRouter free plan: https://openrouter.ai/pricing/
- Ollama quickstart: https://github.com/ollama/ollama/blob/main/docs/quickstart.mdx

No vendor is permanently “best.” Pick the provider based on tested explanation quality, factual grounding, latency, free limits, and data terms. Recheck these terms before deployment.

### Hard zero-billing rules

- Do not add a payment method, enable cloud billing, or configure a paid API fallback.
- Store the provider key only on the server, in environment variables.
- Configure a single selected free provider via environment variables; keep an adapter interface so changing providers is inexpensive.
- Handle provider quota exhaustion with an honest, useful message and any deterministic information already available. Never silently switch to a paid provider.
- Cache results by repository commit SHA, provider/model ID, prompt version, and schema version.
- Put conservative per-IP/session rate limits on analysis, protect against repeated cache-busting, and cap the amount of code sent per analysis.
- Do not promise free, unlimited, or permanent hosted AI to all users. Provider free plans and quotas can change, and a shared API key creates a finite resource.
- First release supports public repositories only. Before sending source excerpts to an external model, disclose that AI processing occurs. Never send secrets, `.env` files, credentials, private keys, dependency directories, binaries, or unrelated large files.

### AI pipeline

1. **Pin repository snapshot:** record URL and commit SHA.
2. **Build evidence bundle:** deterministic inventory plus selected docs, manifests, entrypoints, exports, tests, and relevant source excerpts. Apply secret/size filters.
3. **Generate structured brief:** send bounded evidence with instructions that repository text is untrusted data. Require every capability/claim to reference evidence IDs.
4. **Validate output:** use Zod/schema validation, ensure every evidence ID exists, ensure paths/lines belong to the pinned snapshot, discard invalid references, and mark uncertainty. Schema-valid output is not necessarily factually correct.
5. **Persist and cache:** save the brief and evidence snapshot so revisiting the same commit does not trigger more model calls.
6. **Render the UI:** lead with Technical Overview and Distinctive Structural Facts, followed by a prominent project description, concrete capabilities, and project-specific exploration. Keep evidence validation internal; do not render source-evidence UI in the current UX direction.
7. **Explain on demand:** retrieve focused evidence for a selected capability and use one bounded model call, not the entire repository.

Do not start with a vector database, separate AI microservice, or multiple cooperating agents. A provider adapter and an application-level generation service are sufficient.

---

## 6. Current status and next roadmap

The initial evidence foundation and Phase 2 Project Brief MVP have now been implemented. The reported validation includes 116 passing API tests, successful API/frontend builds and lint checks, and live Groq brief-generation tests on public JavaScript/TypeScript, Python, and Rust repositories. These checks establish that the pipeline can run; they do not prove that the interface gives users a distinctive or useful understanding of every project type.

The immediate task is a focused product/UX iteration, not another backend rebuild.

### Phase 3 — UX reset: make repository exploration useful and distinctive

**Goal:** move beyond a generic collection of cards and make Sarthi feel like an engaging, project-aware way to explore unfamiliar software. UX comes first; detailed visual styling can evolve over multiple iterations.

- Keep the Technical Overview / ecosystem dashboard as the main visual hero. Do not replace it with a generic project-identity card.
- In the hero's tab row, put **Distinctive Structural Facts** first and select it by default. Populate it with informative facts that are specific to the analyzed repository, such as entrypoints, public API or command surfaces, package/workspace boundaries, important project modules, available scripts, and testing setup. Show only facts supported by the collected data; avoid placeholders, arbitrary metrics, and generic statements.
- Remove the **Repository Composition** section/tab from the user-facing experience. Retain useful technical overview elements—such as language distribution and clearly defined file/dependency metrics—where they add value, but do not recreate Repository Composition under another name.
- Give the project description its own prominent, clearly discoverable section. Keep the concise wording, but do not let it disappear beneath the hero or become a minor caption.
- Remove source-evidence UI from the user-facing product: no evidence table/tab, source snippets, evidence-status badges, or evidence-oriented section. Keep internal evidence grounding and validation in the backend so the application continues to avoid unsupported claims. Do not delete working evidence infrastructure just to remove its visual presentation.
- Redesign the core capabilities experience so each item explains a concrete, project-specific job, behavior, or value—not vague labels such as generic “core engine,” “routing,” or “data layer” without context. Make the capabilities clearly distinguishable from one another. Prefer a small number of high-value capabilities over filling a fixed quota with weak ones.
- Audit the entire application experience, not only the hero. Rework information hierarchy, page flow, headings, labels, empty states, and navigation. Replace internal/mechanical wording (for example, “Newcomer Tour Guide” or “Technical Overview & Repository Intelligence”) with natural, user-friendly language. Choose final wording based on what the section helps a person do.
- Address the **Projects** and **Overview** tabs. Determine the user purpose each one serves. Make them genuinely useful and distinct, or remove/combine redundant navigation where appropriate. Do not preserve tabs that lead to empty, repetitive, or low-value screens merely because they already exist.
- Break the repetitive card pattern. Use whatever mix of charts, grouped facts, distinctive layouts, diagrams, progressive disclosure, lists, panels, and interactions best helps users understand the actual repository. Do not force every section into an identical title-description-card structure.
- Choose a fresh, coherent color palette that differs meaningfully from the current one. You have freedom over the palette and detailed UI decisions. Prioritize readable contrast, semantic consistency, and visual hierarchy; do not spend this iteration polishing every decorative detail.
- Keep project-type-aware representations where they add real explanatory value, but do not assume that changing labels or slightly rearranging a generic diagram counts as adaptation. Different project types should foreground different useful information, and all displayed facts must be grounded in the analyzed repository.
- Inspect the current API payload and reuse it wherever possible. Change extraction or contracts only when a demonstrated information gap blocks an accurate and useful experience. Preserve the working analysis pipeline, Groq integration, deterministic fallback, caching, security controls, and responsiveness.

**Exit condition:** the first screen makes the technical overview inviting and informative; the project purpose is easy to find; capabilities communicate real project value; source-evidence UI no longer dominates or appears in the interface; navigation has clear purposes; and the whole experience no longer feels like the same generic set of text cards applied to every repository.

### Phase 4 — Validate usefulness, then deepen analysis

- Run five-minute usability checks with people who have not seen the chosen repositories.
- Ask users to identify the project type, explain its purpose, name important parts, and describe at least one supported relationship or workflow.
- Review where the visual representation is generic, confusing, or overconfident; refine those cases before adding more layouts.
- Check factual correctness against a human-reviewed answer key and confirm that visual claims/relationships remain evidence-grounded.
- Add deeper project-type-specific analysis only where user tests reveal a real comprehension gap and the repository signals justify it.
- Consider recurring value such as change awareness or saved exploration sessions later, after the first-time experience proves useful.

**Exit condition:** measurable user understanding improves over the current page and over reading the README/file tree alone. Expand feature scope only after this condition is met.

---

## 7. Acceptance criteria for the next useful release

- The Technical Overview is the primary visual hero; **Distinctive Structural Facts** is its leftmost and default tab, populated with meaningful repository-specific information.
- The standalone Repository Composition UI is removed.
- The project description is a separate, easy-to-find section with concise purpose, audience (when known), and explanation.
- All source-evidence UI is removed from the frontend, while internal validation remains available to prevent unsupported claims.
- Core capabilities describe concrete, distinguishable things the project does or enables rather than vague architectural labels.
- Headings and navigation use natural, user-friendly language rather than internal or mechanical terminology.
- Projects and Overview are useful, clearly differentiated destinations, or redundant/low-value navigation has been removed or combined.
- The visual language varies across the site; the page is not simply a repeated sequence of interchangeable cards.
- The color palette differs from the current palette and maintains accessible contrast.
- Repository-specific metrics are clearly defined and computed from actual collected data. The interface does not invent facts or force a metric to display when information is unavailable.
- Existing repository exploration, model generation/fallback, caching, and security safeguards continue working.
- Validation includes at least three different repository types. Automated checks are reported separately from browser-level visual verification.

## 8. Engineering and product constraints

- Keep the existing Next.js/TypeScript frontend, Express/TypeScript API, PostgreSQL, Prisma, and monorepo unless evidence proves the architecture blocks the product goal.
- Do not introduce another framework, vector database, graph database, workflow engine, or agent framework at the start.
- Keep analysis deterministic wherever possible; use AI for interpretation and explanation.
- Treat repository contents as untrusted input, including prompt-injection text.
- Avoid expensive repeated analysis through caching and bounded inputs.
- Prefer a single complete journey over many incomplete navigation sections.
- Never confuse a polished UI, successful build, passing unit tests, or generated graph with demonstrated user value.

---

## 9. Implemented Design Direction — Dark Codebase Explorer Workbench (October 2026)

**Design status:** Implemented in frontend workbench  
**Visual reference:** Dark Codebase Map concept (`docs/a_widescreen_dark_themed_ui_screenshot_of_a_softwa.png`)

### Implemented Architecture & UI System:

1. **Dark Engineering-Workbench Aesthetic**:
   - Primary palette: Graphite base (`#080F12`), Navigation/Sidebar (`#0B171A`), Workspace (`#0D1B1F`), Elevated surfaces (`#122326`), Borders (`#203538`), Primary Teal interactions (`#0F8A83`), and Bright Teal accents (`#35D0C3`).
   - Semantic module category accents: Core/Warm (`#F28C45`), Routing/Amber (`#F4B04F`), Middleware (`#4D9FD8`), View Engine/UI (`#55B879`), Utilities (`#9064D9`), and Support/Other (`#819196`).
   - Subtle depth, canvas grid textures, and restrained lighting rather than superficial gradients or neon glow.

2. **Flagship 3-Pane Workbench (`CodebaseMapWorkbench.tsx`)**:
   - **Left Sidebar**: Repository identity, quick navigation across workbench sections, and multi-dimensional view filters (`By Feature`, `By Directory`, `By Layer`, `By Dependency`).
   - **Center Spatial Codebase Map**: Interactive isometric 2.5D module islands representing architecture clusters, module blocks with active highlighting, animated glowing connection traces, zoom/3D tilt controls, and minimap.
   - **Right Contextual Inspector**: Instant inspector displaying file breadcrumbs, role details, 4-metric statistics (Lines, Functions, Imports, Exports), tabbed views (Overview, Files, Connections, Used By), key responsibilities checklist, and direct GitHub source permalinks.
   - **Key Insights Row**: 4 grounded architectural pattern cards (Central Core Module, Widely Connected, Stable Architecture, Common Extension Point).

3. **Language Distribution Donut Chart (`LanguageDonutChart.tsx`)**:
   - Replaced horizontal stacked bar with an interactive SVG Donut Chart.
   - 100% accounted file-count measurement explicitly distinguishing file counts from disk size/SLOC.
   - Center callout with total verified file count and hover-reactive language stats.
   - Structured legend grid with exact file counts, percentages, and color swatches.

4. **Recognizable Technology Stack & Toolchain Branding (`TechIcons.tsx`)**:
   - Clean, lightweight SVG logos for recognized ecosystems, frameworks, runtimes, and tools (Node.js, Express, React, Next.js, Python, Flask, FastAPI, Rust, Go, Docker, Tailwind, Prisma, Git, etc.).

5. **Functional Continuity**:
   - Preserved all existing capabilities: public repository exploration, Technical Overview with all 4 tabs (Distinctive Facts, Dependencies, Entrypoints & Scripts, Directory Structure), project purpose, concrete capabilities, newcomer guided tour, and deterministic fallback.

---

## 10. Unified Explorer Experience & Visual Refinement (October 2026)

**Status:** Completed & Deployed  
**Goal:** Transform the redesigned components into a single, cohesive, information-rich repository exploration experience with the Codebase Map as its defining visual centerpiece.

### Delivered Enhancements:

1. **Unified Explorer Hero with Integrated Modes**:
   - **Compact Context Header**: Features repository identity with direct GitHub permalinks, concise repository-specific purpose statement, ecosystem/project type badge with confidence level, restrained metrics row (Files, Dirs, Deps), and recognizable tech stack logos (`TechLogo`).
   - **Integrated Explorer Mode Switcher**: Seamless view switcher between `Codebase Map` (default) and `Technical Overview`. Switching modes updates the workbench canvas without scrolling away or fragmenting the page.
   - **Embedded Technical Overview**: Directly integrates `TechnicalOverviewHero` into the workbench without duplicating headers, featuring the 100% accounted language donut chart, stack logos strip, and 4 specification tabs (Distinctive Structural Facts, Dependencies, Entrypoints & Scripts, Directory Structure).

2. **Refined Codebase Map Mode**:
   - Truthful, dynamic relationship connections: Replaced arbitrary static SVG curves with live connection highlighting (`→ Target` and `← Caller` indicators) when modules are selected.
   - Auto-fit cluster islands sized to content, eliminating oversized empty containers.
   - Interactive controls: multi-dimensional perspectives (`By Feature`, `By Directory`, `By Layer`), zoom (+, -, reset, 3D isometric toggle), search filter, minimap, and instant inspector updates.

3. **Editorial Capabilities Index (`CapabilityIndex.tsx`)**:
   - Replaced generic card grids with an editorial capability index grouped by functional domains (Routing & Dispatch, Middleware & Extensibility, Rendering & Views, Data & Storage, CLI, Core Lifecycle).
   - "Inspect in Map →" direct navigation: Capabilities that map to known conceptual areas allow users to explore that part of the codebase directly in the map hero with synchronized module selection and smooth scrolling.

4. **Connected Reading Timeline (`GuidedReadingTimeline.tsx`)**:
   - Sequential reading progression with numbered step badges, purpose pills, emphasized target file indicators, and direct GitHub source permalinks.

5. **Disciplined Deep Architectural Topology**:
   - Project-type correctness: Removed fictitious "Client Ingress" when frontend areas are absent.
   - Library-specific architecture (`LibraryVisualModel`): Foregrounded public API surface, middleware pipeline, internal core engine, and test harness without arbitrary array slicing.
   - Web system architecture (`WebSystemVisualModel`): Disciplined request flow with truthful layers only.

6. **Consolidated Visual System & Information Hierarchy**:
   - 100% audit of legacy surfaces to the centralized dark teal palette (`#080F12`, `#0B171A`, `#0D1B1F`, `#122326`, `#193033`, `#203538`, `#ECF3F2`, `#9AA9AC`, `#0F8A83`, `#35D0C3`).
   - Established strict page hierarchy: (1) Status bar + Unified Explorer Hero, (2) Capabilities Index, (3) Guided Reading Timeline, (4) Deep Architectural Topology, (5) Gaps & Limitations.

---

## 11. Product Cohesion, Architecture Health & Visual Hierarchy (October 2026)

**Status:** Completed & Validated  
**Goal:** Establish clear page hierarchy, default the hero to Technical Overview, restore a mathematically honest Architecture Health feature, elevate typography and icon sizing, and redesign the Projects section to unify with the dark workbench system.

### Delivered Enhancements:

1. **Unambiguous Page Hierarchy**:
   - **Level 1 — Unified Repository Hero**: Defaults to `Technical Overview` with `Codebase Map` available as a seamless alternate view inside the same hero container.
   - **Level 2 — What This Project Is About (`ProjectDescriptionSection.tsx`)**: Prominent editorial layout highlighting purpose statement (`text-xl sm:text-2xl`), intended audience badge, category rationale, and top distinctive capabilities with "Inspect in Codebase Map" links.
   - **Level 3 — Where to Start Reading Code (`GuidedReadingTimeline.tsx`)**: Directional progression guide with numbered step pills (`Step 1 of N`), enlarged file/directory icons, monospace paths, and direct GitHub permalinks.
   - **Level 4 — Architecture Health Assessment (`ArchitectureHealthSection.tsx`)**: Restored architectural health feature using verified codebase analysis data.
   - **Level 5 — Repository Capabilities Index (`CapabilityIndex.tsx`)**: Domain-grouped capability matrix with evidence grounding badges.
   - **Level 6 — Deep Architectural Topology (`AdaptiveVisualModel.tsx`)**: Disciplined, type-aware structural visualization.
   - **Level 7 — Evidence Grounding & Known Gaps (`GapsLimitationsSection.tsx`)**: Transparent accounting of unverified capabilities and analysis boundaries.

2. **Technical Overview as Default Hero View**:
   - Defaulted `explorerMode` to `"overview"` in `CodebaseMapWorkbench.tsx`.
   - Placed "Technical Overview" first in top toolbar view switcher.
   - Selected "Distinctive Structural Facts" by default within the overview tab set.
   - Brightened `LanguageDonutChart` color palette (`#388BFD`, `#F7B955`, `#00E5FF`, `#FF7A45`, `#A855F7`) with enlarged center callout, legible file counts, and verified file-count measurement disclaimer.
   - Seamless toggling between Technical Overview and Codebase Map preserving active repository context and inspector state.

3. **Restored Transparent Architecture Health Assessment**:
   - Evaluates 5 grounded signals using actual repository analysis evidence:
     - **Documentation Coverage**: Doc files count relative to repository scale + verified capabilities.
     - **Dependency Complexity**: Inter-module connection degree & external package burden.
     - **Module Balance & Size**: File distribution variance & god-module dominance detection.
     - **Circular Dependencies**: Graph cycle detection across conceptual relationships using DFS traversal.
     - **Architecture Connectivity**: Orphan subsystem detection.
   - Defensible status vocabulary (`Healthy`, `Needs Attention`, `Insufficient Data`) rather than arbitrary 100% scores.
   - Expandable "Architectural Findings Breakdown" panel detailing specific findings and linking directly to topology exploration.

4. **Typography & Icon Upgrades**:
   - Scaled up typography across headers, body, metadata, and controls for high legibility against dark surfaces.
   - Standardized icon sizing by role (`w-5 h-5` for section headings, `w-4 h-4` for action controls and steps).

5. **Surface Contrast & Card Distinction**:
   - Added centralized surface hierarchy tokens in `globals.css` (`--bg-workspace`, `--bg-elevated`, `--bg-surface`, `--bg-card`, `--bg-card-hover`).
   - Replaced noisy borders with disciplined contrast, elevation, and restrained semantic accents.

6. **Redesigned Projects Hub & Shared Application Shell**:
   - Rebuilt `/projects` into a unified Workspace Hub featuring "Saved Projects" and "Recently Explored" tabs.
   - Integrated search filtering, clean empty states, and guest user support.
   - Redesigned `ProjectCard` with language icons, status pills, in-place deletion confirmation, and direct "Open in Explorer" (`/?repo=...`) action.
   - Added query param support (`/?repo=...`) in `app/page.tsx` for seamless navigation between Projects and Explore.
   - Upgraded `Navbar.tsx` height (`h-14`), branding typography, and active indicator treatments.
