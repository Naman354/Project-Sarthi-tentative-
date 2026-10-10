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

### A. Project Fingerprint — the hero experience

The first screen after analysis should feel like a visual identity for _this particular repository_, not a generic dashboard populated with different text. Make the existing Technical Overview / Ecosystem Facts content the starting point, but evolve it beyond a row of language percentages and technology badges.

The hero should prioritize useful, high-signal facts such as:

- Detected project type and its likely purpose (for example, application, library, CLI, data/ML project, game, infrastructure, or monorepo).
- Languages, core frameworks, runtimes, and important tools actually detected.
- The project's main building blocks, expressed in a visual arrangement appropriate to its type.
- A small number of meaningful structural facts, such as public packages/commands, major subsystems, routes/API surfaces, data/model pipeline stages, or deployment units—only when the evidence makes them reliable.
- A concise purpose statement and a route into the fuller project brief.

Do not promote arbitrary numbers just to fill the hero. Every displayed metric must be explainable and useful. Language distribution can be supporting metadata; it should not be mistaken for an understanding of architecture.

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

### C. Project Brief — important supporting context

Keep the project purpose, intended audience, and a short prioritized set of capabilities easy to find. However, the brief must not consume the visual hero or dominate the page as several large prose cards. Present it as concise, readable context adjacent to or immediately below the Project Fingerprint. Let users expand capability explanations when they want more detail.

### D. Guided exploration instead of scattered description cards

Organize the experience around a few meaningful visual and interaction choices rather than a long stack of disconnected cards. Users should be able to select a major system, capability, package, command, or pipeline stage and understand:

- What role it plays in this project.
- What it connects to or enables, when that connection is supported.
- Where to go next to understand the workflow.

The next step should change naturally with the selected project type and selected item. Avoid showing the same generic collection of cards on every repository simply because the frontend has those components available.

### E. Evidence is supporting infrastructure, not the main event

Evidence quality remains essential to correctness, but the default UI must not feel like an audit report or evidence browser. Keep the first impression focused on understanding the project. Show compact source attribution only where it builds trust, and make file paths, line excerpts, and detailed evidence available on demand through a selected component/capability or a dedicated explorer.

Distinguish among documented, implementation found, test found, test passed (only if actually run), inferred, and unresolved claims. Do not repeat conspicuous status tags on every visual element if a subtler treatment or details panel communicates the same thing. Never remove evidence validation from the analysis pipeline just to reduce its visibility in the UI.

### F. Progressive disclosure and visual hierarchy

Use this initial hierarchy as the default, adapting order when the project type makes another view more useful:

1. **Project Fingerprint:** project type, ecosystem, distinctive visual model, and a few meaningful facts.
2. **Purpose and capabilities:** what the project does and what it enables.
3. **Explore the system:** interact with the relevant map, package surface, command tree, pipeline, or other project-specific model.
4. **Technical details and source evidence:** expandable/on-demand detail for users who want to go deeper.
5. **Limitations and uncertainty:** visible and honest, but not needlessly noisy.

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

### Phase 3 — Project Fingerprint and adaptive visual exploration

**Goal:** Transform the repository overview from a uniform collection of descriptive cards into a visually distinctive, project-adaptive hero experience where different software types look and behave differently.

- **Hero Project Fingerprint:** Promote Ecosystem Facts and Technical Overview into the primary hero. Highlights detected category, confidence, framework badges, runtime tools, and 3-4 project-specific structural facts alongside concise purpose and capability quick-routes.
- **Project-Adaptive Visual Models:**
  - **Web Application & Backend Systems:** Multi-tier architectural topology (Client/Frontend ➔ Routing/API Layer ➔ Core Service Engine ➔ Data & Storage).
  - **Libraries & Frameworks:** Public contract hierarchy (Public API surface ➔ Internal Core Implementation ➔ Test & Build Configuration).
  - **CLI Tools:** Execution pipeline (Input / CLI Flags ➔ Command Dispatch ➔ Execution Engine ➔ Formatted Output).
  - **Data / ML Projects:** Processing and training flow (Data Ingestion ➔ Preprocessing & Features ➔ Model Training / Inference ➔ Output Artifacts).
  - **Universal Baseline:** Modular subsystem topology for general or unclassified repositories.
- **Interactive Contextual Detail Panel:** Selecting any component, subsystem, package, command, or pipeline stage displays its role, inbound/outbound connections, next-step exploration recommendations, and commit-pinned source links without triggering full-page context shifts.
- **De-emphasized Source Evidence:** Evidence tables and verbose file excerpts are removed from the first screen. Source grounding is delivered through contextual component drawers and a secondary audit tab, maintaining 100% auditability and commit-pinned permalinks without clutter.
- **Preserved Pipeline & Zero-Cost Safeguards:** Retains shallow-cloning, Groq `openai/gpt-oss-120b` zero-cost integration, deterministic fallback, strict schema validation, and commitment to never hallucinate metrics or connections.

**Exit condition:** Comparing materially different repositories (e.g., Express backend, Click CLI, Anyhow library) produces visibly distinct visual models and information hierarchies with interactive contextual explanations and unobtrusive evidence.

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
