# Project Sarthi — Revised Product Plan

**Plan status:** Active roadmap, revised after the Phase 2 Project Brief implementation and first product review  
**Prepared:** 10 October 2026  
**Product focus:** A distinctive, project-adaptive visual overview that helps an unfamiliar user understand a repository within their first five minutes  
**Cost constraint:** No subscriptions, no paid API usage, no billing-enabled fallback

---

## 1. Product decision

### Product definition

**Project Sarthi is an interactive visual guide to unfamiliar software repositories.** It turns a repository into a distinctive project fingerprint: an at-a-glance view of its ecosystem, project type, major building blocks, and how those parts fit together. A clear project explanation remains important, while source evidence supports deeper exploration without dominating the initial experience.

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
2. Get a project fingerprint tailored to the repository: ecosystem, project type, main components, and a useful visual summary.
3. Understand the project's purpose and most important capabilities in concise supporting context.
4. Explore a project-specific visual model of how its important parts work together.
5. Open source evidence when curious or when they need to verify or investigate a claim.

The first three steps must already be valuable. Users should not need an account, learn graph terminology, or configure a complex workspace before receiving a useful introduction, where practical protections against abuse allow it.

---

## 2. Product experience

### A. Technical Overview — the dominant hero experience

The primary visual section at the top of the analyzed repository page is the **Technical Overview**. It acts as an interactive, data-rich exploration dashboard that gives developers an immediate, evidence-grounded technical understanding of the repository.

The hero prioritizes accurate, high-signal facts:

- **Language distribution visualization:** Multi-colored proportional bar with percentages and file counts, with the calculation method clearly labelled ("Distribution across N analyzed files").
- **Repository composition breakdown:** Clear proportional distribution of Source Code, Test Suites, Documentation, and Config & Build files.
- **Detected technology stack:** Primary language, detected frameworks (e.g., Express, Fastify, Click, Anyhow, React, Tokio), runtimes, and build tools.
- **Declared dependencies:** Clearly distinguishes declared production/runtime dependencies from development and build dependencies, with interactive filtering.
- **Entrypoints & build scripts:** Application entrypoints (e.g. `src/index.ts`, `src/lib.rs`, `main.py`) and declared build/execution scripts with commit-pinned links.
- **Directory and module topology:** Top-level module tree summary showing major architectural units.
- **Distinctive structural facts:** High-signal architectural facts tailored to this specific repository.

Every displayed metric is explainable, verifiable, and grounded in repository evidence without fabricated data.

### B. Project Description — separate, compact context

A separate, compact Project Description section is positioned immediately near the Technical Overview.

It explains:
- What the project does (concise purpose statement).
- Who it is intended for, when identifiable.
- Its most important capabilities in compact summary format.

Keep these explanations concise so they provide clear context to the Technical Overview without competing with it for visual dominance.

### C. Project-type-aware visual models

Different repository types must not collapse into the same set of cards with only their labels changed. First classify the repository using detected manifests, structure, entrypoints, docs, symbols, and other available signals. Then select and populate the most appropriate visual model. Classification is a hint with confidence/uncertainty, not a rigid exclusive label.

Examples of distinct visual models:

- **Web applications & backend systems:** a multi-tier system topology showing client ingress, API routing surface, domain services, and data persistence layers.
- **Libraries & frameworks:** a public contract and module hierarchy emphasizing the exported interface, internal engine, and testing/specification harness.
- **CLI tools:** a terminal execution pipeline tracing command invocations, flags, subcommand dispatch, operations engine, and formatted output streams.
- **Data/ML projects:** data sources, preprocessing steps, actual notebooks and model components, and evaluation—only where supported by the repository.
- **Universal baseline:** a modular architectural subsystem topology for general or unclassified repositories.

These are design directions, not hard-coded templates. Build visuals from the facts the analysis actually discovers without inventing architecture.

### D. Guided exploration instead of scattered description cards

Organize the experience around meaningful visual and interaction choices rather than long stacks of redundant text cards. Users can select any component, package, route, or pipeline stage and inspect its role, inbound/outbound architectural connections, and commit-pinned source links via an interactive contextual detail drawer.

### E. Evidence is supporting infrastructure, not the main event

Evidence quality remains essential to correctness, but the default UI must not feel like an audit report. Keep the first impression focused on understanding the project. Show compact source attribution where it builds trust, and make file paths, line excerpts, and detailed evidence available on demand through contextual drawers and a dedicated evidence explorer tab.

### F. Progressive disclosure and visual hierarchy

1. **Technical Overview:** dominant visual hero with language charts, file composition, declared dependencies, entrypoints, and structural facts.
2. **Project Description & Purpose:** concise purpose, audience, and key capability highlights.
3. **Explore the System:** interactive visual model (web/backend system map, library surface, CLI execution pipeline, data pipeline, or universal modular topology).
4. **Contextual Detail & Source Evidence:** on-demand detail drawer and secondary audit tab.
5. **Limitations and Gaps:** honest acknowledgment of unverified items or baseline coverage.

The aim is not to hide technical depth. It is to let users choose depth as they explore rather than forcing every detail into the initial screen.

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
- **UI/navigation:** move from a generic Project Brief/card stack to Project Fingerprint → concise purpose/capabilities → project-specific exploration → on-demand source evidence. Keep evidence validation, but reduce its visual dominance.
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
- Evidence IDs, line snippets, and status badges dominating the first screen.
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
6. **Render the UI:** build a project-type-aware Project Fingerprint and interactive visual model, with concise brief context and source evidence revealed contextually.
7. **Explain on demand:** retrieve focused evidence for a selected capability and use one bounded model call, not the entire repository.

Do not start with a vector database, separate AI microservice, or multiple cooperating agents. A provider adapter and an application-level generation service are sufficient.

---

## 6. Current status and next roadmap

The initial evidence foundation and Phase 2 Project Brief MVP have now been implemented. The reported validation includes 116 passing API tests, successful API/frontend builds and lint checks, and live Groq brief-generation tests on public JavaScript/TypeScript, Python, and Rust repositories. These checks establish that the pipeline can run; they do not prove that the interface gives users a distinctive or useful understanding of every project type.

The immediate task is a focused product/UX iteration, not another backend rebuild.

### Phase 3 & 3B — Restore the Technical Overview Hero and Adaptive Visual Exploration

**Goal:** Establish the Technical Overview as the dominant, data-rich visual hero at the top of the analyzed repository page, supported by a separate concise Project Description and genuine project-type visual models.

- **Hero Technical Overview Dashboard:** Dominant visual section at the top of the analyzed page. Highlights proportional language distribution (% of analyzed files), repository composition (source vs test vs doc vs config), declared production vs development dependencies, application entrypoints, build/execution scripts, and distinctive structural facts.
- **Separate Project Description:** Compact section near the Technical Overview providing project purpose, intended audience, and key capability highlights without competing for visual dominance.
- **Project-Adaptive Visual Models:**
  - **Web Application & Backend Systems:** Multi-tier architectural topology (Client Ingress ➔ API Routing Surface ➔ Domain Service Engine ➔ Data Persistence).
  - **Libraries & Frameworks:** Public contract & module hierarchy (Public API surface ➔ Internal Engine ➔ Test Harness & Build Specification).
  - **CLI Tools:** Terminal execution pipeline (Invocations & Flags ➔ Command Dispatcher ➔ Execution Engine ➔ Formatted Output).
  - **Data / ML Projects:** Grounded processing and training flow (Data Ingestion ➔ Feature Prep ➔ Modeling / Analytics ➔ Evaluation & Artifacts).
  - **Universal Baseline:** Modular subsystem topology for general or unclassified repositories.
- **Interactive Contextual Detail Panel:** Selecting any component displays its role, inbound/outbound connections, next-step recommendations, and commit-pinned source links.
- **De-emphasized Source Evidence:** 100% auditable source grounding delivered through contextual drawers and a secondary audit tab.
- **Preserved Pipeline & Zero-Cost Safeguards:** Retains shallow-cloning, Groq zero-cost integration, deterministic fallback, strict schema validation, and commitment to never hallucinate metrics or connections.

**Exit condition:** Comparing materially different repositories (`expressjs/express`, `pallets/click`, `dtolnay/anyhow`) produces an informative technical overview dashboard, a separate concise description, and visibly distinct visual models.

### Phase 4 — Validate usefulness, then deepen analysis

- Run five-minute usability checks with people who have not seen the chosen repositories.
- Ask users to identify the project type, explain its purpose, name important parts, and describe at least one supported relationship or workflow.
- Review where the visual representation is generic, confusing, or overconfident; refine those cases before adding more layouts.
- Check factual correctness against a human-reviewed answer key and confirm that visual claims/relationships remain evidence-grounded.
- Add deeper project-type-specific analysis only where user tests reveal a real comprehension gap and the repository signals justify it.
- Consider recurring value such as change awareness or saved exploration sessions later, after the first-time experience proves useful.

**Exit condition:** measurable user understanding improves over the current page and over reading the README/file tree alone. Expand feature scope only after this condition is met.

---

## 7. Acceptance criteria for the first useful release

The useful visual release is successful only if:

- At least 4 of 5 unfamiliar test users can identify the project type, explain the project's purpose, and name three important capabilities after five minutes (initial target; adjust based on testing).
- At least three materially different repository types produce noticeably different and appropriate visual hierarchies—not identical card layouts with changed labels.
- The visual overview emphasizes useful ecosystem/structure facts rather than arbitrary counts or decorative badges.
- Users can explore an important project component and understand its role and any supported relationships.
- Source evidence is available where useful, but detailed evidence does not dominate the default screen.
- Capability claims link to real source evidence or are explicitly labelled as documentation-derived/inferred.
- The system does not invent paths, symbols, tests, or relationships in the test benchmark.
- The same repository commit produces a cached brief until relevant inputs or prompt/schema/model versions change.
- Provider outages, rate limits, and invalid AI output do not crash repository viewing; the user sees a clear message and any valid deterministic information that remains available.
- No path enables paid usage, surprise billing, or a paid fallback.
- At least three different repository types receive an appropriate baseline explanation, even if deeper support differs.

---

## 8. Engineering and product constraints

- Keep the existing Next.js/TypeScript frontend, Express/TypeScript API, PostgreSQL, Prisma, and monorepo unless evidence proves the architecture blocks the product goal.
- Do not introduce another framework, vector database, graph database, workflow engine, or agent framework at the start.
- Keep analysis deterministic wherever possible; use AI for interpretation and explanation.
- Treat repository contents as untrusted input, including prompt-injection text.
- Avoid expensive repeated analysis through caching and bounded inputs.
- Prefer a single complete journey over many incomplete navigation sections.
- Never confuse a polished UI, successful build, passing unit tests, or generated graph with demonstrated user value.

---

## 9. Immediate next action

**Implement Phase 3: Project Fingerprint and adaptive visual exploration.** The data extraction, brief-generation pipeline, and evidence foundation already exist, so do not repeat the original Phase 0/1 setup or rebuild the analyzer by default.

Begin by inspecting the current output for three contrasting public repositories and mapping current fields to the proposed visual experience. Then implement the new hero and the smallest useful set of project-specific visual models. Add or change backend extraction only where a real data gap prevents a correct view. Validate the result in the running application and report which project types were actually exercised.
