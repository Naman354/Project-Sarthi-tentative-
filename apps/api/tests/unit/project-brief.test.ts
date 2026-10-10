import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { universalEvidenceCollector } from "../../src/brief/evidence-collector.js";
import { GroqBriefService } from "../../src/brief/groq-brief.service.js";
import { projectBriefCache } from "../../src/brief/brief-cache.js";
import {
  exploreRepositoryInputSchema,
  projectBriefAiOutputSchema,
} from "../../src/brief/schemas.js";
import type { Groq } from "groq-sdk";

export async function runProjectBriefTests(): Promise<{
  name: string;
  passed: number;
  failed: number;
}> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`    PASS: ${testName}`);
      passed++;
    } else {
      console.error(`    FAIL: ${testName}`);
      failed++;
    }
  }

  console.log("\n  [Suite: Phase 2 Project Brief & Universal Evidence]");
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sarthi-brief-tests-"));

  try {
    // --------------------------------------------------------------------------
    // Scenario 1: Representative Multi-Language Local Fixtures
    // --------------------------------------------------------------------------
    console.log("   Scenario: Universal Evidence Extraction across Ecosystems");

    // 1A. TypeScript / Node Application Fixture
    const tsRepoDir = path.join(tempDir, "ts-app");
    await fs.mkdir(path.join(tsRepoDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(tsRepoDir, "package.json"),
      JSON.stringify({
        name: "test-ts-app",
        version: "1.0.0",
        dependencies: { express: "^4.18.2", dotenv: "^16.0.0" },
        scripts: { build: "tsc", start: "node dist/index.js" },
      })
    );
    await fs.writeFile(
      path.join(tsRepoDir, "README.md"),
      "# Test TS App\nA TypeScript HTTP service demonstrating Project Sarthi brief extraction.\n\n## Installation\nRun npm install.\n"
    );
    await fs.writeFile(
      path.join(tsRepoDir, "src", "index.ts"),
      'import express from "express";\nconst app = express();\napp.listen(3000);\n'
    );

    const tsBundle = await universalEvidenceCollector.collect(tsRepoDir, {
      repoUrl: "https://github.com/test-org/test-ts-app",
      commitSha: "c0ffee1",
      branch: "main",
      owner: "test-org",
      repo: "test-ts-app",
    });

    assert(tsBundle.languages.some((l) => l.language === "TypeScript"), "TS fixture: detects TypeScript as primary language");
    assert(tsBundle.manifests.some((m) => m.ecosystem === "node"), "TS fixture: parses Node.js manifest with dependencies");
    assert(tsBundle.entryPoints.includes("src/index.ts"), "TS fixture: detects src/index.ts as entry point");
    assert(tsBundle.evidenceRecords.length >= 3, "TS fixture: generates documentation, manifest, and source evidence records");

    // 1B. Python Project Fixture
    const pyRepoDir = path.join(tempDir, "py-project");
    await fs.mkdir(path.join(pyRepoDir, "tests"), { recursive: true });
    await fs.writeFile(
      path.join(pyRepoDir, "pyproject.toml"),
      '[project]\nname = "fastapi-demo"\nversion = "0.2.0"\ndependencies = ["fastapi", "uvicorn", "pydantic"]\n'
    );
    await fs.writeFile(
      path.join(pyRepoDir, "requirements.txt"),
      "fastapi==0.100.0\nuvicorn==0.23.0\npytest==7.4.0\n"
    );
    await fs.writeFile(
      path.join(pyRepoDir, "main.py"),
      'from fastapi import FastAPI\napp = FastAPI()\n\n@app.get("/")\ndef root():\n    return {"status": "ok"}\n'
    );
    await fs.writeFile(
      path.join(pyRepoDir, "tests", "test_main.py"),
      'def test_root():\n    assert True\n'
    );
    await fs.writeFile(
      path.join(pyRepoDir, "README.md"),
      "# FastAPI Demo\nHigh performance Python web service built with FastAPI.\n\n## Getting Started\nuvicorn main:app --reload\n"
    );

    const pyBundle = await universalEvidenceCollector.collect(pyRepoDir, {
      repoUrl: "https://github.com/py-org/fastapi-demo",
      commitSha: "py789ab",
      branch: "main",
      owner: "py-org",
      repo: "fastapi-demo",
    });

    assert(pyBundle.languages.some((l) => l.language === "Python"), "Python fixture: detects Python language");
    assert(pyBundle.manifests.some((m) => m.ecosystem === "python"), "Python fixture: extracts pyproject.toml & requirements.txt");
    assert(pyBundle.entryPoints.includes("main.py"), "Python fixture: detects main.py entrypoint");
    assert(pyBundle.testsFound.length > 0, "Python fixture: detects tests/ folder and test files");
    assert(pyBundle.parserCoverage === "universal-baseline", "Python fixture: sets universal-baseline coverage correctly");

    // 1C. Rust CLI / Library Fixture
    const rustRepoDir = path.join(tempDir, "rust-cli");
    await fs.mkdir(path.join(rustRepoDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(rustRepoDir, "Cargo.toml"),
      '[package]\nname = "ripgrep-clone"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nclap = "4.0"\nregex = "1.9"\n'
    );
    await fs.writeFile(
      path.join(rustRepoDir, "src", "main.rs"),
      'use clap::Parser;\nfn main() {\n    println!("Rust CLI ready");\n}\n'
    );
    await fs.writeFile(
      path.join(rustRepoDir, "README.md"),
      "# Ripgrep Clone\nFast command-line search utility written in Rust.\n"
    );

    const rustBundle = await universalEvidenceCollector.collect(rustRepoDir, {
      repoUrl: "https://github.com/rust-org/ripgrep-clone",
      commitSha: "rust1234",
      branch: "master",
      owner: "rust-org",
      repo: "ripgrep-clone",
    });

    assert(rustBundle.languages.some((l) => l.language === "Rust"), "Rust fixture: detects Rust language");
    assert(rustBundle.manifests.some((m) => m.ecosystem === "rust"), "Rust fixture: extracts Cargo.toml manifest");
    assert(rustBundle.entryPoints.includes("src/main.rs"), "Rust fixture: detects src/main.rs entry point");
    assert(rustBundle.projectTypes.includes("cli-tool"), "Rust fixture: infers cli-tool project type");

    // --------------------------------------------------------------------------
    // Scenario 2: Deterministic Fallback Brief Generation
    // --------------------------------------------------------------------------
    console.log("   Scenario: Deterministic Fallback Brief Generation (No API Key Required)");

    const briefService = new GroqBriefService();
    // Test deterministic brief for Rust CLI
    const fallbackBrief = briefService.generateDeterministicFallbackBrief(rustBundle);

    assert(fallbackBrief.generatedBy === "deterministic-fallback", "Fallback brief marks generatedBy as deterministic-fallback");
    assert(fallbackBrief.purpose.length > 0, "Fallback brief derives meaningful purpose from README/manifest");
    assert(fallbackBrief.capabilities.length >= 2, "Fallback brief discovers capabilities deterministically");
    assert(
      fallbackBrief.capabilities.every((c) => c.evidenceIds.length > 0),
      "Fallback brief capabilities contain evidence IDs"
    );
    assert(fallbackBrief.conceptualMap.areas.length >= 2, "Fallback brief defines conceptual areas");
    assert(fallbackBrief.guidedTour.length >= 2, "Fallback brief provides guided tour steps");
    assert(
      fallbackBrief.evidenceMap[fallbackBrief.capabilities[0]!.evidenceIds[0]!]?.url?.includes("github.com"),
      "Fallback brief evidence records contain commit-pinned GitHub permalinks"
    );

    // --------------------------------------------------------------------------
    // Scenario 3: Groq AI Integration with Mocked Client
    // --------------------------------------------------------------------------
    console.log("   Scenario: Groq Model Integration with Mock Client");

    // 3A: Valid Model Output
    const mockValidOutput = {
      purpose: "Fast command-line search utility implemented in Rust.",
      intendedAudience: "Developers who search text files from the terminal.",
      capabilities: [
        {
          id: "cap-1",
          name: "Regex Text Search",
          description: "Scans files matching regular expression patterns.",
          evidenceStatus: "implementation_found",
          evidenceIds: [rustBundle.evidenceRecords[0]!.id],
          primaryFiles: ["src/main.rs"],
        },
      ],
      conceptualMap: {
        areas: [
          {
            id: "area-1",
            name: "CLI Engine",
            role: "Parses arguments and performs pattern matching",
            evidenceIds: [rustBundle.evidenceRecords[0]!.id],
            associatedFiles: ["src/main.rs"],
          },
        ],
        relationships: [],
      },
      guidedTour: [
        {
          step: 1,
          title: "Entry Point",
          description: "Read src/main.rs to see the CLI setup.",
          targetFile: "src/main.rs",
        },
      ],
      limitationsAndGaps: ["Benchmark tests are not yet included."],
    };

    const mockGroqSuccess = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockValidOutput),
                },
              },
            ],
          }),
        },
      },
    } as unknown as Groq;

    // Use test instance with mocked client
    const testAiService = new GroqBriefService(mockGroqSuccess);
    const aiBrief = await testAiService.generateBrief(rustBundle, { forceRefresh: true });

    assert(aiBrief.generatedBy === "groq", "AI Brief generated successfully and marked as groq");
    assert(aiBrief.purpose === mockValidOutput.purpose, "AI Brief matches model output purpose");
    assert(aiBrief.capabilities.length === 1, "AI Brief contains validated capability");
    assert(
      aiBrief.capabilities[0]!.evidenceIds[0] === rustBundle.evidenceRecords[0]!.id,
      "AI Brief capability retains verified evidence ID"
    );

    // 3B: Hallucinated Evidence IDs are Safely Stripped
    const mockOutputWithHallucinatedIds = {
      ...mockValidOutput,
      capabilities: [
        {
          id: "cap-hallucinated",
          name: "Invented Feature",
          description: "Feature referencing fake evidence ID.",
          evidenceStatus: "inferred",
          evidenceIds: ["ev-fake-9999", rustBundle.evidenceRecords[0]!.id],
          primaryFiles: ["src/main.rs"],
        },
      ],
    };

    const mockGroqHallucinated = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockOutputWithHallucinatedIds),
                },
              },
            ],
          }),
        },
      },
    } as unknown as Groq;

    testAiService.setClient(mockGroqHallucinated);
    const hallucinationFilteredBrief = await testAiService.generateBrief(rustBundle, { forceRefresh: true });
    assert(
      !hallucinationFilteredBrief.capabilities[0]!.evidenceIds.includes("ev-fake-9999"),
      "Hallucinated evidence ID 'ev-fake-9999' was discarded by reference validator"
    );
    assert(
      hallucinationFilteredBrief.capabilities[0]!.evidenceIds.includes(rustBundle.evidenceRecords[0]!.id),
      "Legitimate evidence ID was preserved by reference validator"
    );

    // 3C: Provider 429 Rate-Limit Error Handling
    const mockGroqRateLimit = {
      chat: {
        completions: {
          create: async () => {
            throw new Error("429 Too Many Requests: Rate limit reached on free tier");
          },
        },
      },
    } as unknown as Groq;

    testAiService.setClient(mockGroqRateLimit);
    const rateLimitedBrief = await testAiService.generateBrief(rustBundle, { forceRefresh: true });
    assert(
      rateLimitedBrief.generatedBy === "deterministic-fallback",
      "Rate limit 429 safely degrades to deterministic brief"
    );
    assert(
      rateLimitedBrief.limitationsAndGaps.some((l) => l.includes("rate limit")),
      "User is honestly informed that rate limit triggered the fallback"
    );

    // --------------------------------------------------------------------------
    // Scenario 4: URL Security Validation
    // --------------------------------------------------------------------------
    console.log("   Scenario: Public Repository URL Security Validation");

    const validUrls = [
      "https://github.com/expressjs/express",
      "https://github.com/rust-lang/cargo.git",
      "https://github.com/facebook/react/",
    ];
    for (const url of validUrls) {
      const res = exploreRepositoryInputSchema.safeParse({ githubUrl: url });
      assert(res.success, `Accepts valid public URL: ${url}`);
    }

    const invalidUrls = [
      "http://github.com/owner/repo", // non-HTTPS
      "https://gitlab.com/owner/repo", // non-GitHub
      "https://attacker.com/owner/repo", // arbitrary host
      "https://user:password@github.com/owner/repo", // embedded credentials
      "not-even-a-url", // malformed
    ];
    for (const url of invalidUrls) {
      const res = exploreRepositoryInputSchema.safeParse({ githubUrl: url });
      assert(!res.success, `Rejects insecure/unsupported URL: ${url}`);
    }

    // --------------------------------------------------------------------------
    // Scenario 5: Caching Decisions
    // --------------------------------------------------------------------------
    console.log("   Scenario: Commit-Pinned Caching Decisions");

    const cacheKey = projectBriefCache.computeKey(
      rustBundle.repoUrl,
      rustBundle.commitSha,
      "openai/gpt-oss-120b"
    );
    assert(typeof cacheKey === "string" && cacheKey.length === 64, "Generates SHA-256 cache key");

    // Clear and set cache
    await projectBriefCache.clear();
    await projectBriefCache.set(
      rustBundle.repoUrl,
      rustBundle.commitSha,
      "openai/gpt-oss-120b",
      fallbackBrief
    );

    const cachedHit = await projectBriefCache.get(
      rustBundle.repoUrl,
      rustBundle.commitSha,
      "openai/gpt-oss-120b"
    );
    assert(cachedHit !== null, "Successfully retrieves cached brief");
    assert(cachedHit?.cached === true, "Cached brief indicates cached: true");
    assert(cachedHit?.commitSha === rustBundle.commitSha, "Cached brief matches analyzed commit SHA");

    // Clean up cache
    await projectBriefCache.clear();

    // --------------------------------------------------------------------------
    // Scenario 6: Strict Zod Schema Rejection of Invalid AI Output
    // --------------------------------------------------------------------------
    console.log("   Scenario: Zod Schema Rejection of Malformed AI Output");

    const malformedOutput = {
      // missing purpose
      capabilities: [], // empty capabilities
      conceptualMap: { areas: [] },
    };
    const schemaValidation = projectBriefAiOutputSchema.safeParse(malformedOutput);
    assert(!schemaValidation.success, "Rejects malformed AI output missing purpose and capabilities");

  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return { name: "Phase 2 Project Brief & Universal Evidence", passed, failed };
}
