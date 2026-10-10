import path from "node:path";
import fs from "node:fs/promises";
import type {
  RepositoryEvidenceBundle,
  EvidenceRecord,
  ManifestSummary,
  LanguageStat,
  ProjectCategory,
  StructuralFact,
} from "./types.js";
import { parserManager } from "../parsers/manager.js";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "target",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "env",
  "bin",
  "obj",
  ".gradle",
  ".idea",
  ".vscode",
  ".cache",
  ".turbo",
  "coverage",
]);

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".rb": "Ruby",
  ".php": "PHP",
  ".c": "C",
  ".cpp": "C++",
  ".h": "C/C++ Header",
  ".hpp": "C++ Header",
  ".cs": "C#",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".scala": "Scala",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".md": "Markdown",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".sql": "SQL",
  ".sh": "Shell",
  ".bash": "Shell",
};

export class UniversalEvidenceCollector {
  async collect(
    repoPath: string,
    meta: {
      repoUrl: string;
      commitSha: string;
      branch: string;
      owner: string;
      repo: string;
    }
  ): Promise<RepositoryEvidenceBundle> {
    const evidenceRecords: EvidenceRecord[] = [];
    let evidenceCounter = 1;
    const nextEvidenceId = () => `ev-${evidenceCounter++}`;

    // 1. Directory Traversal & Language Distribution
    const extensionCounts: Record<string, number> = {};
    const topLevelEntries: string[] = [];
    const allFilePaths: string[] = [];
    let totalFiles = 0;
    let totalDirectories = 0;
    let _totalSizeBytes = 0;

    try {
      const rootEntries = await fs.readdir(repoPath);
      for (const e of rootEntries) {
        if (!IGNORED_DIRS.has(e)) {
          topLevelEntries.push(e);
        }
      }
    } catch {
      // Ignore read errors
    }

    const traverse = async (currentDir: string, depth = 0): Promise<void> => {
      if (totalFiles >= 2000) return; // Safety bounding

      let entries: string[] = [];
      try {
        entries = await fs.readdir(currentDir);
      } catch {
        return;
      }

      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry)) continue;

        const fullPath = path.join(currentDir, entry);
        const relPath = path.relative(repoPath, fullPath).replace(/\\/g, "/");

        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            totalDirectories++;
            if (depth < 6) {
              await traverse(fullPath, depth + 1);
            }
          } else if (stat.isFile()) {
            totalFiles++;
            _totalSizeBytes += stat.size;
            allFilePaths.push(relPath);

            const ext = path.extname(entry).toLowerCase();
            const lang = LANGUAGE_EXTENSIONS[ext] || "Other";
            extensionCounts[lang] = (extensionCounts[lang] || 0) + 1;
          }
        } catch {
          // Ignore unreadable files
        }
      }
    };

    await traverse(repoPath);

    // Compute language stats
    const languages: LanguageStat[] = Object.entries(extensionCounts)
      .filter(([lang]) => lang !== "Other")
      .map(([language, count]) => ({
        language,
        fileCount: count,
        percentage: totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0,
      }))
      .sort((a, b) => b.fileCount - a.fileCount);

    // 2. Documentation Extraction
    const docFiles: string[] = [];
    let primaryDoc: { filePath: string; title: string; excerpt: string } | undefined;

    const candidateReadmeNames = [
      "README.md",
      "README",
      "readme.md",
      "Readme.md",
      "README.markdown",
      "README.rst",
    ];

    let readmePath: string | null = null;
    for (const name of candidateReadmeNames) {
      if (topLevelEntries.includes(name)) {
        readmePath = name;
        break;
      }
    }

    if (readmePath) {
      docFiles.push(readmePath);
      try {
        const fullReadmePath = path.join(repoPath, readmePath);
        const content = await fs.readFile(fullReadmePath, "utf-8");
        const lines = content.split("\n");

        let title = meta.repo;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("# ")) {
            title = trimmed.replace(/^#\s+/, "");
            break;
          }
        }

        const excerpt = lines.slice(0, 45).join("\n").substring(0, 2000);

        primaryDoc = {
          filePath: readmePath,
          title,
          excerpt,
        };

        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "documentation",
          filePath: readmePath,
          startLine: 1,
          endLine: Math.min(lines.length, 50),
          description: `Primary project README overview and introduction (${title})`,
          snippet: excerpt,
        });

        // Scan for additional major sections in README
        let currentSectionTitle = "";
        let currentSectionStart = 1;
        for (let i = 0; i < lines.length && i < 200; i++) {
          const line = lines[i]!.trim();
          if (line.startsWith("## ")) {
            if (currentSectionTitle) {
              const snippet = lines
                .slice(currentSectionStart - 1, i)
                .join("\n")
                .substring(0, 400);
              evidenceRecords.push({
                id: nextEvidenceId(),
                type: "documentation",
                filePath: readmePath,
                startLine: currentSectionStart,
                endLine: i,
                description: `README section: ${currentSectionTitle}`,
                snippet,
              });
            }
            currentSectionTitle = line.replace(/^##\s+/, "");
            currentSectionStart = i + 1;
          }
        }
      } catch {
        // Readme read error handled safely
      }
    }

    // Check for architecture/contributing docs
    const additionalDocNames = ["ARCHITECTURE.md", "CONTRIBUTING.md", "DOCS.md"];
    for (const docName of additionalDocNames) {
      if (topLevelEntries.includes(docName)) {
        docFiles.push(docName);
        try {
          const content = await fs.readFile(path.join(repoPath, docName), "utf-8");
          const lines = content.split("\n");
          evidenceRecords.push({
            id: nextEvidenceId(),
            type: "documentation",
            filePath: docName,
            startLine: 1,
            endLine: Math.min(lines.length, 30),
            description: `Project documentation: ${docName}`,
            snippet: lines.slice(0, 30).join("\n").substring(0, 500),
          });
        } catch {
          // Ignore read error
        }
      }
    }

    // 3. Multi-Ecosystem Manifests
    const manifests: ManifestSummary[] = [];

    // Node.js / TypeScript: package.json
    if (topLevelEntries.includes("package.json")) {
      try {
        const pkgRaw = await fs.readFile(path.join(repoPath, "package.json"), "utf-8");
        const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
        const deps = Object.keys((pkg["dependencies"] as Record<string, string>) || {});
        const devDeps = Object.keys((pkg["devDependencies"] as Record<string, string>) || {});
        const scripts = (pkg["scripts"] as Record<string, string>) || {};
        const lines = pkgRaw.split("\n");

        manifests.push({
          filePath: "package.json",
          ecosystem: "node",
          ...(typeof pkg["name"] === "string" ? { name: pkg["name"] } : {}),
          ...(typeof pkg["version"] === "string" ? { version: pkg["version"] } : {}),
          dependencies: deps,
          devDependencies: devDeps,
          scripts,
        });

        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "manifest",
          filePath: "package.json",
          startLine: 1,
          endLine: Math.min(lines.length, 50),
          description: `Node.js / JavaScript package manifest with ${deps.length} dependencies and ${Object.keys(scripts).length} scripts`,
          snippet: pkgRaw.substring(0, 800),
        });
      } catch {
        // Ignore package.json parse error
      }
    }

    // Python: pyproject.toml / requirements.txt / setup.py
    if (topLevelEntries.includes("pyproject.toml")) {
      try {
        const content = await fs.readFile(path.join(repoPath, "pyproject.toml"), "utf-8");
        const lines = content.split("\n");
        const deps: string[] = [];
        for (const line of lines) {
          if (line.includes("=") && !line.startsWith("#") && !line.startsWith("[")) {
            deps.push(line.split("=")[0]!.trim());
          }
        }
        manifests.push({
          filePath: "pyproject.toml",
          ecosystem: "python",
          dependencies: deps.slice(0, 20),
        });
        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "manifest",
          filePath: "pyproject.toml",
          startLine: 1,
          endLine: Math.min(lines.length, 40),
          description: "Python pyproject.toml project configuration and dependencies",
          snippet: content.substring(0, 800),
        });
      } catch {
        // Ignore read error
      }
    } else if (topLevelEntries.includes("requirements.txt")) {
      try {
        const content = await fs.readFile(path.join(repoPath, "requirements.txt"), "utf-8");
        const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
        const deps = lines.map((l) => l.split(/[=<>~]/)[0]!.trim());
        manifests.push({
          filePath: "requirements.txt",
          ecosystem: "python",
          dependencies: deps.slice(0, 20),
        });
        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "manifest",
          filePath: "requirements.txt",
          startLine: 1,
          endLine: Math.min(lines.length, 30),
          description: `Python dependencies manifest (${deps.length} packages)`,
          snippet: lines.slice(0, 20).join("\n"),
        });
      } catch {
        // Ignore read error
      }
    }

    // Rust: Cargo.toml
    if (topLevelEntries.includes("Cargo.toml")) {
      try {
        const content = await fs.readFile(path.join(repoPath, "Cargo.toml"), "utf-8");
        const lines = content.split("\n");
        manifests.push({
          filePath: "Cargo.toml",
          ecosystem: "rust",
          dependencies: lines
            .filter((l) => l.includes("=") && !l.startsWith("["))
            .map((l) => l.split("=")[0]!.trim())
            .slice(0, 20),
        });
        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "manifest",
          filePath: "Cargo.toml",
          startLine: 1,
          endLine: Math.min(lines.length, 40),
          description: "Rust Cargo.toml package and dependencies definition",
          snippet: content.substring(0, 800),
        });
      } catch {
        // Ignore read error
      }
    }

    // Go: go.mod
    if (topLevelEntries.includes("go.mod")) {
      try {
        const content = await fs.readFile(path.join(repoPath, "go.mod"), "utf-8");
        const lines = content.split("\n");
        manifests.push({
          filePath: "go.mod",
          ecosystem: "go",
          dependencies: lines
            .filter((l) => l.trim().startsWith("require") || l.includes(" v"))
            .slice(0, 20),
        });
        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "manifest",
          filePath: "go.mod",
          startLine: 1,
          endLine: Math.min(lines.length, 30),
          description: "Go module definition and dependency requirements",
          snippet: content.substring(0, 600),
        });
      } catch {
        // Ignore read error
      }
    }

    // 4. Entry Points Detection
    const entryPoints: string[] = [];
    const candidateEntrypoints = [
      "src/index.ts",
      "src/main.ts",
      "src/server.ts",
      "src/app.ts",
      "index.ts",
      "index.js",
      "src/index.js",
      "app/page.tsx",
      "main.py",
      "app.py",
      "src/main.py",
      "src/main.rs",
      "src/lib.rs",
      "main.go",
      "cmd/main.go",
    ];

    for (const ep of candidateEntrypoints) {
      if (allFilePaths.includes(ep)) {
        entryPoints.push(ep);
        try {
          const content = await fs.readFile(path.join(repoPath, ep), "utf-8");
          const lines = content.split("\n");
          evidenceRecords.push({
            id: nextEvidenceId(),
            type: "source",
            filePath: ep,
            startLine: 1,
            endLine: Math.min(lines.length, 25),
            description: `Primary application entrypoint: ${ep}`,
            snippet: lines.slice(0, 25).join("\n").substring(0, 500),
          });
        } catch {
          // Ignore read error
        }
      }
    }

    // 5. Tests Detection
    const testsFound: string[] = [];
    const testDirs = ["tests", "test", "__tests__", "spec"];
    for (const td of testDirs) {
      if (topLevelEntries.includes(td)) {
        testsFound.push(td);
      }
    }
    const sampleTestFiles = allFilePaths
      .filter((p) => p.includes(".test.") || p.includes(".spec.") || p.includes("test_"))
      .slice(0, 5);

    if (sampleTestFiles.length > 0) {
      const firstTest = sampleTestFiles[0]!;
      testsFound.push(firstTest);
      try {
        const content = await fs.readFile(path.join(repoPath, firstTest), "utf-8");
        const lines = content.split("\n");
        evidenceRecords.push({
          id: nextEvidenceId(),
          type: "test",
          filePath: firstTest,
          startLine: 1,
          endLine: Math.min(lines.length, 25),
          description: `Test suite file: ${firstTest}`,
          snippet: lines.slice(0, 25).join("\n").substring(0, 400),
        });
      } catch {
        // Ignore read error
      }
    }

    // 6. Specialized Parser Engine Integration (where supported)
    let parserCoverage: "specialized-ast-graph" | "universal-baseline" = "universal-baseline";
    try {
      const parseResult = await parserManager.parseRepository(repoPath);
      const frameworkEntities = parseResult.entities.filter((e) =>
        ["route", "controller", "service", "model", "component", "page"].includes(e.type)
      );
      if (frameworkEntities.length > 0) {
        parserCoverage = "specialized-ast-graph";
        // Sample up to 8 high-level routes, models, or components as evidence
        const importantEntities = frameworkEntities.slice(0, 8);

        for (const entity of importantEntities) {
          evidenceRecords.push({
            id: nextEvidenceId(),
            type: "parser_entity",
            filePath: entity.filePath,
            ...(typeof entity.location?.startLine === "number"
              ? { startLine: entity.location.startLine }
              : {}),
            ...(typeof entity.location?.endLine === "number"
              ? { endLine: entity.location.endLine }
              : {}),
            description: `Parsed ${entity.type}: '${entity.name}' in ${entity.filePath}`,
          });
        }
      }
    } catch {
      // Graceful fallback to universal baseline
      parserCoverage = "universal-baseline";
    }

    // 7. Determine Frameworks, Tools, and Project Classification
    const allDeps = manifests.flatMap((m) => m.dependencies).map((d) => d.toLowerCase());
    const allDevDeps = manifests
      .flatMap((m) => m.devDependencies || [])
      .map((d) => d.toLowerCase());
    const allDependenciesCombined = [...allDeps, ...allDevDeps];

    // Framework detection mapping
    const frameworkMap: Record<string, string> = {
      react: "React",
      next: "Next.js",
      vue: "Vue",
      svelte: "Svelte",
      angular: "Angular",
      express: "Express",
      fastify: "Fastify",
      nest: "NestJS",
      koa: "Koa",
      flask: "Flask",
      django: "Django",
      fastapi: "FastAPI",
      "actix-web": "Actix Web",
      axum: "Axum",
      "gin-gonic": "Gin",
      prisma: "Prisma ORM",
      "@prisma/client": "Prisma Client",
      mongoose: "Mongoose",
      typeorm: "TypeORM",
      torch: "PyTorch",
      pytorch: "PyTorch",
      tensorflow: "TensorFlow",
      pandas: "Pandas",
      numpy: "NumPy",
      "scikit-learn": "Scikit-Learn",
      click: "Click",
      typer: "Typer",
      clap: "Clap",
      commander: "Commander.js",
      yargs: "Yargs",
      tailwindcss: "TailwindCSS",
      vite: "Vite",
      tokio: "Tokio",
      anyhow: "Anyhow",
      serde: "Serde",
    };

    const detectedFrameworksSet = new Set<string>();
    const repoLower = meta.repo ? meta.repo.toLowerCase() : "";
    for (const [depKey, frameworkName] of Object.entries(frameworkMap)) {
      if (
        allDependenciesCombined.some((d) => d.includes(depKey)) ||
        repoLower === depKey ||
        manifests.some((m) => m.name?.toLowerCase().includes(depKey))
      ) {
        detectedFrameworksSet.add(frameworkName);
      }
    }
    const detectedFrameworks = Array.from(detectedFrameworksSet);

    // Tools detection
    const detectedToolsSet = new Set<string>();
    if (topLevelEntries.includes("Cargo.toml")) detectedToolsSet.add("Cargo");
    if (topLevelEntries.includes("package.json")) detectedToolsSet.add("Node.js / npm");
    if (topLevelEntries.includes("pyproject.toml") || topLevelEntries.includes("requirements.txt"))
      detectedToolsSet.add("Python / Pip");
    if (topLevelEntries.includes("go.mod")) detectedToolsSet.add("Go Modules");
    if (topLevelEntries.includes("Dockerfile") || topLevelEntries.includes("docker-compose.yml"))
      detectedToolsSet.add("Docker");
    if (testsFound.length > 0) detectedToolsSet.add("Automated Test Harness");
    const detectedTools = Array.from(detectedToolsSet);

    // Classify category
    let category: ProjectCategory = "universal";
    let confidence: "high" | "medium" | "inferred" = "inferred";
    let rationale = "General repository structure.";

    const hasWebFramework = detectedFrameworks.some((f) =>
      ["React", "Next.js", "Vue", "Svelte", "Angular"].includes(f)
    );
    const hasBackendFramework = detectedFrameworks.some((f) =>
      [
        "Express",
        "Fastify",
        "NestJS",
        "Koa",
        "Flask",
        "Django",
        "FastAPI",
        "Actix Web",
        "Axum",
        "Gin",
      ].includes(f)
    );
    const hasCliFramework = detectedFrameworks.some((f) =>
      ["Click", "Typer", "Clap", "Commander.js", "Yargs"].includes(f)
    );
    const hasMlFramework =
      detectedFrameworks.some((f) =>
        ["PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"].includes(f)
      ) || allFilePaths.some((p) => p.endsWith(".ipynb"));

    const hasRustBinary =
      topLevelEntries.includes("Cargo.toml") &&
      (allFilePaths.includes("src/main.rs") || allFilePaths.some((p) => p.startsWith("src/bin/")));
    const hasRustLibraryOnly =
      topLevelEntries.includes("Cargo.toml") &&
      allFilePaths.includes("src/lib.rs") &&
      !hasRustBinary;

    if (hasMlFramework) {
      category = "data-ml";
      confidence = "high";
      rationale = `Detected machine learning environment (${detectedFrameworks.filter((f) => ["PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"].includes(f)).join(", ") || "Jupyter notebooks/data models"}).`;
    } else if (hasWebFramework) {
      category = "web-application";
      confidence = "high";
      rationale = `Detected frontend UI frameworks and web application components (${detectedFrameworks.filter((f) => ["React", "Next.js", "Vue", "Svelte", "Angular"].includes(f)).join(", ")}).`;
    } else if (hasBackendFramework || parserCoverage === "specialized-ast-graph") {
      category = "backend-system";
      confidence = "high";
      rationale = `Detected server routes, API controllers, and backend services (${detectedFrameworks.filter((f) => ["Express", "Fastify", "NestJS", "Koa", "Flask", "Django", "FastAPI", "Prisma ORM"].includes(f)).join(", ") || "API endpoints"}).`;
    } else if (
      hasCliFramework ||
      hasRustBinary ||
      allFilePaths.some((p) => p.startsWith("bin/") || p.startsWith("cmd/"))
    ) {
      category = "cli-tool";
      confidence = "high";
      rationale = `Detected command-line execution entrypoints and CLI tooling (${detectedFrameworks.filter((f) => ["Click", "Typer", "Clap", "Commander.js", "Yargs"].includes(f)).join(", ") || (hasRustBinary ? "Cargo main.rs binary" : "bin directory")}).`;
    } else if (
      hasRustLibraryOnly ||
      entryPoints.some(
        (e) => e.includes("lib.rs") || e.endsWith("index.ts") || e.endsWith("__init__.py")
      )
    ) {
      category = "library-framework";
      confidence = "medium";
      rationale = `Detected public API exports and library module surfaces without standalone server or CLI entrypoints.`;
    } else {
      category = "universal";
      confidence = "inferred";
      rationale = `Ecosystem baseline derived from ${languages[0]?.language || "repository"} code files and directory layout.`;
    }

    const projectTypes: string[] = [category];
    if (hasWebFramework && !projectTypes.includes("web-application"))
      projectTypes.push("web-application");
    if (hasBackendFramework && !projectTypes.includes("backend-system"))
      projectTypes.push("backend-system");
    if (hasCliFramework && !projectTypes.includes("cli-tool")) projectTypes.push("cli-tool");

    // Extract high-signal structural facts tailored to project type
    const structuralFacts: StructuralFact[] = [];
    if (category === "web-application" || category === "backend-system") {
      structuralFacts.push({
        label: "Primary Architecture",
        value: category === "web-application" ? "Web Application" : "Backend API Service",
        ...(detectedFrameworks.length > 0
          ? { detail: detectedFrameworks.slice(0, 3).join(", ") }
          : { detail: "Modular Service" }),
      });
      structuralFacts.push({
        label: "Entrypoint Surface",
        value: entryPoints[0] || "Server Root",
        ...(entryPoints.length > 1
          ? { detail: `${entryPoints.length} detected entrypoints` }
          : { detail: "Main dispatch file" }),
      });
      structuralFacts.push({
        label: "Ecosystem Packages",
        value: `${manifests[0]?.dependencies.length || 0} Declared Dependencies`,
        ...(manifests[0]?.filePath ? { detail: manifests[0].filePath } : {}),
      });
      structuralFacts.push({
        label: "Quality & Testing",
        value: testsFound.length > 0 ? "Test Suite Configured" : "Universal Baseline",
        ...(testsFound[0] ? { detail: testsFound[0] } : { detail: "No test directory identified" }),
      });
    } else if (category === "cli-tool") {
      const cliFw = detectedFrameworks.find((f) =>
        ["Click", "Clap", "Commander.js", "Typer"].includes(f)
      );
      structuralFacts.push({
        label: "Execution Model",
        value: "Command-Line Tool",
        ...(cliFw
          ? { detail: cliFw }
          : hasRustBinary
            ? { detail: "Rust Binary Executable" }
            : { detail: "Script Dispatcher" }),
      });
      structuralFacts.push({
        label: "Binary Target",
        value: entryPoints[0] || "CLI Entrypoint",
        detail: "Main argument processor",
      });
      structuralFacts.push({
        label: "Tool Dependencies",
        value: `${manifests[0]?.dependencies.length || 0} External Crates/Packages`,
        ...(manifests[0]?.filePath ? { detail: manifests[0].filePath } : {}),
      });
      structuralFacts.push({
        label: "Verification",
        value:
          testsFound.length > 0 ? `${testsFound.length} Test Indicators` : "Manual / CLI Tests",
        ...(testsFound[0] ? { detail: testsFound[0] } : { detail: "CLI integration test" }),
      });
    } else if (category === "library-framework") {
      structuralFacts.push({
        label: "Package Role",
        value: "Reusable Library / SDK",
        detail: "Exposes public API for downstream consumption",
      });
      structuralFacts.push({
        label: "Public Interface",
        value: entryPoints[0] || "Root Module Exports",
        detail: "Primary export surface",
      });
      structuralFacts.push({
        label: "Package Boundaries",
        value: `${manifests[0]?.dependencies.length || 0} Dependencies`,
        ...(manifests[0]?.filePath
          ? { detail: manifests[0].filePath }
          : { detail: "Crate / Manifest" }),
      });
      structuralFacts.push({
        label: "Test Harness",
        value: testsFound.length > 0 ? "Automated Test Suite" : "Unit Tests",
        ...(testsFound[0] ? { detail: testsFound[0] } : { detail: "Specification coverage" }),
      });
    } else if (category === "data-ml") {
      const mlFws = detectedFrameworks.filter((f) =>
        ["PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"].includes(f)
      );
      structuralFacts.push({
        label: "Pipeline Category",
        value: "Data & ML System",
        ...(mlFws.length > 0 ? { detail: mlFws.join(", ") } : { detail: "Python Analytics" }),
      });
      structuralFacts.push({
        label: "Script / Notebook Surface",
        value: `${allFilePaths.filter((p) => p.endsWith(".ipynb") || p.endsWith(".py")).length} Python / Notebook Files`,
        ...(entryPoints[0] ? { detail: entryPoints[0] } : { detail: "Pipeline root" }),
      });
      structuralFacts.push({
        label: "Ecosystem Packages",
        value: `${manifests[0]?.dependencies.length || 0} ML Packages`,
        ...(manifests[0]?.filePath ? { detail: manifests[0].filePath } : {}),
      });
      structuralFacts.push({
        label: "Evaluation",
        value: testsFound.length > 0 ? "Test Suite Verified" : "Data Pipeline",
        ...(testsFound[0] ? { detail: testsFound[0] } : {}),
      });
    } else {
      structuralFacts.push({
        label: "Project Category",
        value: "Modular Architecture",
        detail: `${languages[0]?.language || "Codebase"} repository`,
      });
      structuralFacts.push({
        label: "Primary Entrypoint",
        value: entryPoints[0] || "Root Directory",
        detail: `${totalFiles} total files`,
      });
      structuralFacts.push({
        label: "Ecosystem",
        value: manifests[0]?.ecosystem
          ? `${manifests[0].ecosystem.toUpperCase()} Manifest`
          : "General",
        ...(manifests[0]?.filePath ? { detail: manifests[0].filePath } : {}),
      });
      structuralFacts.push({
        label: "Structure",
        value: `${topLevelEntries.length} Top-level Modules`,
        detail: `${totalDirectories} directories`,
      });
    }

    const classification = {
      category,
      confidence,
      rationale,
      detectedFrameworks,
      detectedTools,
      structuralFacts,
    };

    // Compact Directory Tree Summary (top 2-3 levels)
    const treeSummary: string[] = [];
    for (const top of topLevelEntries.slice(0, 15)) {
      const subEntries = allFilePaths
        .filter((p) => p.startsWith(`${top}/`))
        .map((p) => p.split("/")[1])
        .filter(Boolean);
      const uniqueSubs = Array.from(new Set(subEntries)).slice(0, 4);
      if (uniqueSubs.length > 0) {
        treeSummary.push(
          `${top}/ [${uniqueSubs.join(", ")}${uniqueSubs.length >= 4 ? ", ..." : ""}]`
        );
      } else {
        treeSummary.push(top);
      }
    }

    return {
      schemaVersion: "1.0.0",
      repoUrl: meta.repoUrl,
      owner: meta.owner,
      repo: meta.repo,
      commitSha: meta.commitSha,
      branch: meta.branch,
      analyzedAt: new Date().toISOString(),
      identity: {
        name: meta.repo,
        owner: meta.owner,
        ...(primaryDoc?.title ? { description: primaryDoc.title } : {}),
      },
      languages,
      projectTypes,
      manifests,
      entryPoints,
      structure: {
        totalFiles,
        totalDirectories,
        topLevelEntries: topLevelEntries.slice(0, 30),
        treeSummary,
      },
      documentation: {
        ...(primaryDoc ? { primaryDoc } : {}),
        docFiles,
      },
      testsFound,
      evidenceRecords,
      parserCoverage,
      classification,
    };
  }
}

export const universalEvidenceCollector = new UniversalEvidenceCollector();
