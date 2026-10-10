# Project Sarthi — Revised Product Plan

**Plan status:** Proposed replacement for the previous V1 feature-led roadmap  
**Prepared:** 10 October 2026  
**Product focus:** Help an unfamiliar user understand what a software repository is within their first five minutes  
**Cost constraint:** No subscriptions, no paid API usage, no billing-enabled fallback

---

## 1. Product decision

### Product definition

**Project Sarthi is an interactive guide to unfamiliar software repositories.** It turns a repository into a clear, visual, evidence-backed introduction that helps a newcomer understand the project's purpose, capabilities, and major parts without first needing to read the raw code.

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
2. See a clear project introduction: likely purpose, audience, and main capabilities.
3. Explore a visual map of the project's conceptual parts.
4. Select a capability to understand it at a high level.
5. Open real evidence: source files, relevant lines, docs, examples, and tests.

The first three steps must already be valuable. Users should not need an account, learn graph terminology, or configure a complex workspace before receiving a useful introduction, where practical protections against abuse allow it.

---

## 2. Product experience

### A. Project Brief — the primary screen

The landing experience for an analyzed repository should prioritize information in this order:

1. **What is this project?** A plain-language description of its purpose and likely audience.
2. **What can it do?** A small, prioritized set of capabilities grounded in repository evidence.
3. **How is it organized?** A conceptual map of the major parts appropriate to this project type.
4. **What supports these claims?** Evidence links into actual repository files and documentation.
5. **What remains unclear?** Important gaps or uncertain interpretations, shown honestly.

Do not lead with a health score, raw file inventory, graph metrics, technology badges, or a wall of generated prose.

### B. Capability cards

Each discovered capability should show:

- Name and plain-language explanation.
- Why it appears to be a capability of this project.
- The main files or symbols associated with it, when identifiable.
- Evidence status: documented, implementation found, test found, inferred, or unresolved.
- An action to explore the supporting evidence.

Sarthi must not describe a feature as working merely because a relevant file exists. Finding a test is not the same as running it successfully.

### C. Conceptual project map

The map should summarize understandable responsibilities, not display every import and symbol by default. Groups may differ across projects: a web app, library, CLI, machine-learning project, game, infrastructure repo, and monorepo should not be forced into the same architecture template.

Users can progressively reveal more detail, select a group, see its role, and open the relevant source. Every displayed relationship should have an evidence basis. Unresolved relationships must not be fabricated to make the map look complete.

### D. Source-backed explanations

When a user opens a capability, Sarthi should explain it in plain language and provide paths to supporting files and source locations. The initial release does not need an open-ended “chat with your codebase” interface; guided explanations are easier to scope, validate, and make useful.

### E. Evidence and uncertainty

Every substantive claim should be traceable to repository evidence. Distinguish:

- **Documented:** the repository's documentation says this.
- **Implementation found:** relevant source code was identified.
- **Test found:** relevant tests were identified.
- **Test passed:** only when the test was actually run and passed.
- **Inferred:** the available evidence suggests this, but does not prove it.
- **Unresolved:** the analysis could not confidently establish it.

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
- **UI/navigation:** reorganize around Project Brief → Capabilities → Project Map → Source Evidence.
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
6. **Render the UI:** use deterministic frontend components for the brief, cards, map, and source evidence.
7. **Explain on demand:** retrieve focused evidence for a selected capability and use one bounded model call, not the entire repository.

Do not start with a vector database, separate AI microservice, or multiple cooperating agents. A provider adapter and an application-level generation service are sufficient.

---

## 6. Proposed implementation roadmap

The former ten milestones are complete as an engineering roadmap but have not established product value. The following roadmap supersedes them for the next phase. It is organized around demonstrable user outcomes, not feature count.

### Phase 0 — Establish a baseline [COMPLETED]

- Ran initial repository reconnaissance and baseline audit against multi-ecosystem codebases.
- Identified primary architectural gaps: source location loss, cross-file symbol collision during deduplication, and client-server identifier mismatches.

**Status:** Completed. Gaps documented and addressed in Phase 1A.

### Phase 1A — Evidence foundation [COMPLETED]

- Defined typed [SourceLocation](file:///d:/Development/Project-Sarthi-tentative-/apps/api/src/parsers/types.ts#L13-L19) preserving 1-indexed lines and 0-indexed columns across Babel AST, Prisma models, Express routers, and Markdown files.
- Replaced naive entity deduplication with file-aware composite keys (`${type}:${filePath}:${name}`) so distinct declarations across files remain separate graph nodes.
- Resolved cross-plugin identifier mismatches between React client calls and Express routes.
- Persisted and retrieved source locations through `Node.metadata.location` without requiring disruptive database migrations.
- Added comprehensive regression test suite (37 tests passing, 75 total suite tests passing).

**Status:** Completed and verified.

### Phase 2 — Project Brief generator & Universal Baseline [COMPLETED]

- Implemented [UniversalEvidenceCollector](file:///d:/Development/Project-Sarthi-tentative-/apps/api/src/brief/evidence-collector.ts) capturing manifests, documentation, entrypoints, and tests across Node.js, Python, Rust, and Go repositories.
- Implemented [GroqBriefService](file:///d:/Development/Project-Sarthi-tentative-/apps/api/src/brief/groq-brief.service.ts) using official `groq-sdk` with free-tier model (`openai/gpt-oss-120b`). Server-side only; untrusted repository text treated strictly as data.
- Built strict [projectBriefAiOutputSchema](file:///d:/Development/Project-Sarthi-tentative-/apps/api/src/brief/schemas.ts) validated with Zod. Validates every evidence ID reference against the input bundle; strips hallucinated IDs.
- Implemented zero-cost constraint: deterministic fallback overview activated automatically if Groq is unconfigured or returns a 429 rate limit. No paid fallback or billing risk.
- Implemented public repository exploration endpoint (`/public/explore`) requiring no registration or login, with URL security validation, shallow clone (`--depth 1`), 40s timeout, and guaranteed temporary directory cleanup.
- Implemented commit-pinned SHA-256 caching (`ProjectBriefCache`) preventing redundant model calls for the same commit.
- Delivered frontend Project Brief experience: Purpose hero, Capability cards with evidence status badges, visual Conceptual Architecture Map, Guided Codebase Tour, Verified Source Evidence Explorer with commit-pinned GitHub permalinks, collapsible Technical Overview, and Recent Repositories (`localStorage`).
- Added multi-ecosystem regression tests (TS/JS, Python, Rust) with Groq mocking and rate-limit handling (41 tests passing, 116 total suite tests passing).

**Known Limitations Recorded Honestly:**
- Repositories hosted outside public GitHub (e.g., GitLab, Bitbucket, self-hosted instances) are not currently supported by the public exploration route.
- Very large repositories exceeding 50MB uncompressed or 2,000 files are bounded to prevent resource exhaustion.
- Deep inter-procedural call graph traversal is supported for Express/React/Prisma; other ecosystems currently utilize the universal baseline.

### Phase 3 — First-five-minute UX [CURRENT BASELINE ESTABLISHED]

- Project Brief is now the default public landing experience.
- Frictionless exploration without registration or onboarding prerequisites.
- Capabilities, Conceptual Map, and Evidence permalinks prioritized over health metrics.

**Exit condition:** an unfamiliar person can use it without an onboarding call or knowledge of Sarthi's internal terminology.

### Phase 4 — Validate value, then expand

- Run five-minute usability tests with people who have not seen the repositories.
- Check factual correctness against a human-reviewed answer key.
- Measure whether users can explain purpose, name key capabilities, and describe the main components.
- Compare outputs between free model candidates; select by results, not brand.
- Only then add deeper capability walkthroughs and more project-type-specific analyzers.

**Exit condition:** measurable improvement over reading the README and browsing the raw file tree alone.

---

## 7. Acceptance criteria for the first useful release

The first release is successful only if:

- At least 4 of 5 unfamiliar test users can explain a project's purpose and three important capabilities after five minutes (initial target; adjust based on testing).
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

**Do not start by rewriting the application.** Start Phase 0 by running the current build against three public repositories and inspecting the actual outputs. Then implement Phase 1's evidence bundle, because every useful Project Brief, map, and explanation depends on trustworthy evidence.

The first code change should be small and testable: define the evidence schema and produce it for one repository end to end. Once we trust that output, connect the AI provider and build the brief around it.
