import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { technologyDetector } from "../../src/parsers/detector.js";
import { expressParserPlugin } from "../../src/parsers/plugins/express.plugin.js";
import { reactParserPlugin } from "../../src/parsers/plugins/react.plugin.js";
import { prismaParserPlugin } from "../../src/parsers/plugins/prisma.plugin.js";
import { markdownParserPlugin } from "../../src/parsers/plugins/markdown.plugin.js";
import { parserManager } from "../../src/parsers/manager.js";

export async function runParserTests(): Promise<{ name: string; passed: number; failed: number }> {
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

  console.log("\n  [Suite: AST Parser Engine]");
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sarthi-parser-test-"));

  try {
    // 1. Technology Detector Test
    console.log("   Scenario: Technology & Framework Detection");
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: {
          express: "^4.18.0",
          react: "^18.2.0",
          "@prisma/client": "^5.0.0",
        },
      })
    );
    await fs.mkdir(path.join(tempDir, "prisma"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "prisma", "schema.prisma"),
      'datasource db { provider = "postgresql" }'
    );

    const techDetection = await technologyDetector.detect(tempDir);
    assert(techDetection.technologies.includes("Express"), "Detects Express framework correctly");
    assert(techDetection.technologies.includes("React"), "Includes React in detected list");
    assert(techDetection.technologies.includes("Prisma"), "Includes Prisma in detected list");

    // 2. Express Parser Plugin Test
    console.log("   Scenario: Express Route & Controller AST Extraction");
    const expressRoutesDir = path.join(tempDir, "routes");
    await fs.mkdir(expressRoutesDir, { recursive: true });
    const routesFile = path.join(expressRoutesDir, "api.routes.ts");
    await fs.writeFile(
      routesFile,
      `
      import { Router } from "express";
      const router = Router();
      router.get("/users", userController.listUsers);
      router.post("/users", validateBody, userController.createUser);
      router.delete("/users/:id", userController.deleteUser);
      export default router;
      `
    );

    const expressFiles = await expressParserPlugin.collectFiles(tempDir);
    const expressResult = await expressParserPlugin.parse(tempDir, expressFiles);

    const routeEntities = expressResult.entities.filter((e) => e.type === "route");
    assert(routeEntities.length === 3, "Parses 3 Express route endpoints");
    assert(
      routeEntities.some((r) => r.name.includes("GET /users")),
      "Identifies GET /users endpoint"
    );
    assert(
      routeEntities.some((r) => r.name.includes("POST /users")),
      "Identifies POST /users endpoint"
    );
    assert(
      routeEntities.some((r) => r.name.includes("DELETE /users/:id")),
      "Identifies DELETE /users/:id endpoint"
    );

    // 3. React Parser Plugin Test
    console.log("   Scenario: React Components & Hooks AST Extraction");
    const componentsDir = path.join(tempDir, "components");
    await fs.mkdir(componentsDir, { recursive: true });
    const compFile = path.join(componentsDir, "UserProfile.tsx");
    await fs.writeFile(
      compFile,
      `
      import React, { useState, useEffect } from "react";
      export function UserProfile({ userId }: { userId: string }) {
        const [profile, setProfile] = useState(null);
        useEffect(() => {
          fetch("/users/" + userId);
        }, [userId]);
        return <div className="profile-card"><h1>Profile</h1></div>;
      }
      `
    );

    const reactFiles = await reactParserPlugin.collectFiles(tempDir);
    const reactResult = await reactParserPlugin.parse(tempDir, reactFiles);

    const compEntities = reactResult.entities.filter((e) => e.type === "component");
    assert(compEntities.length >= 1, "Parses UserProfile component");
    assert(compEntities[0]?.name === "UserProfile", "Component name is UserProfile");

    // 4. Prisma Parser Plugin Test
    console.log("   Scenario: Prisma Schema Models & Relations Extraction");
    const prismaFile = path.join(tempDir, "prisma", "schema.prisma");
    await fs.writeFile(
      prismaFile,
      `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }
      model User {
        id        String   @id @default(uuid())
        email     String   @unique
        posts     Post[]
      }
      model Post {
        id        String   @id @default(uuid())
        title     String
        authorId  String
        author    User     @relation(fields: [authorId], references: [id])
      }
      `
    );

    const prismaFiles = await prismaParserPlugin.collectFiles(tempDir);
    const prismaResult = await prismaParserPlugin.parse(tempDir, prismaFiles);

    const modelEntities = prismaResult.entities.filter((e) => e.type === "model");
    assert(modelEntities.length === 2, "Parses User and Post models");
    assert(
      modelEntities.some((m) => m.name === "User"),
      "Identifies User model"
    );
    assert(
      modelEntities.some((m) => m.name === "Post"),
      "Identifies Post model"
    );
    assert(prismaResult.relationships.length >= 1, "Extracts Post -> User relation");

    // 5. Markdown Parser Plugin Test
    console.log("   Scenario: Markdown Architecture Documentation Extraction");
    const docFile = path.join(tempDir, "README.md");
    await fs.writeFile(
      docFile,
      `
      # System Architecture
      This system provides authentication and data processing.
      ## Authentication Flow
      Users authenticate via JWT tokens.
      `
    );

    const mdFiles = await markdownParserPlugin.collectFiles(tempDir);
    const mdResult = await markdownParserPlugin.parse(tempDir, mdFiles);

    const docEntities = mdResult.entities.filter((e) => e.type === "doc");
    assert(docEntities.length >= 1, "Extracts Markdown documentation entities");

    // 6. Parser Manager Orchestration Test
    console.log("   Scenario: Parser Manager Multi-Framework Aggregation");
    const managerResult = await parserManager.parseRepository(tempDir);

    assert(
      managerResult.entities.length >= 6,
      "Parser manager aggregates entities from all plugins"
    );
    assert(
      managerResult.technologies.technologies.includes("Express"),
      "Manager retains detected Express framework"
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return { name: "AST Parser Engine", passed, failed };
}
