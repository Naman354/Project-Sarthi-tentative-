import path from "node:path";
import fs from "node:fs/promises";
import prisma from "../src/config/prisma.js";
import { technologyDetector } from "../src/parsers/detector.js";
import { expressParserPlugin } from "../src/parsers/plugins/express.plugin.js";
import { reactParserPlugin } from "../src/parsers/plugins/react.plugin.js";
import { prismaParserPlugin } from "../src/parsers/plugins/prisma.plugin.js";
import { markdownParserPlugin } from "../src/parsers/plugins/markdown.plugin.js";
import { parserManager } from "../src/parsers/manager.js";
import app from "../src/app.js";
import type { Server } from "node:http";

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  console.log("=== Milestone 5: Parser Engine Verification Suite ===");

  const server: Server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const fixtureDir = path.resolve(process.cwd(), "temp", "test-fixtures-m5");
  await fs.mkdir(fixtureDir, { recursive: true });

  const timestamp = Date.now();
  const testUserEmail = `parser_tester_${timestamp}@example.com`;
  const password = "Password123!";
  let token = "";
  let projectId = "";

  try {
    // -------------------------------------------------------------
    // Test 1: Express Parser Plugin & Route-Based Module Detection
    // -------------------------------------------------------------
    console.log("\n1. Test Express Parser & Route-Based Modules");
    const expressDir = path.join(fixtureDir, "express-app");
    await fs.mkdir(path.join(expressDir, "routes"), { recursive: true });

    await fs.writeFile(
      path.join(expressDir, "routes", "auth.routes.ts"),
      `
      import { Router } from "express";
      const router = Router();
      router.post("/auth/login", authenticate, authController.login);
      router.post("/auth/register", authController.register);
      router.get("/auth/me", authController.getProfile);
      export default router;
      `
    );

    await fs.writeFile(
      path.join(expressDir, "routes", "project.routes.ts"),
      `
      import { Router } from "express";
      const router = Router();
      router.get("/projects", projectController.list);
      router.get("/projects/:id", projectController.getById);
      router.delete("/projects/:id", projectController.delete);
      export default router;
      `
    );

    const expressFiles = await expressParserPlugin.collectFiles(expressDir);
    assert(expressFiles.length === 2, "Express plugin collected 2 route files");

    const expressResult = await expressParserPlugin.parse(expressDir, expressFiles);
    assert(expressResult.entities.length > 0, "Express parser extracted entities");

    // Route-based module checks (Chapter 4 Section 11)
    const authModule = expressResult.entities.find((e) => e.id === "module:auth");
    const projectModule = expressResult.entities.find((e) => e.id === "module:projects");
    assert(authModule !== undefined, "Route-based module 'auth' identified");
    assert(projectModule !== undefined, "Route-based module 'projects' identified");

    // Route entity checks
    const loginRoute = expressResult.entities.find((e) => e.id === "route:POST:/auth/login");
    const listProjectsRoute = expressResult.entities.find((e) => e.id === "route:GET:/projects");
    assert(loginRoute !== undefined, "Route POST /auth/login extracted");
    assert(listProjectsRoute !== undefined, "Route GET /projects extracted");

    // Relationship checks
    const authContainsLogin = expressResult.relationships.some(
      (r) =>
        r.sourceId === "module:auth" &&
        r.targetId === "route:POST:/auth/login" &&
        r.type === "contains"
    );
    assert(authContainsLogin, "Module 'auth' contains 'POST /auth/login' relationship verified");

    const routeHandledBy = expressResult.relationships.some(
      (r) => r.sourceId === "route:POST:/auth/login" && r.type === "handled_by"
    );
    assert(routeHandledBy, "Route handled_by controller relationship verified");

    // -------------------------------------------------------------
    // Test 2: React & Next.js Parser Plugin
    // -------------------------------------------------------------
    console.log("\n2. Test React & Next.js Parser Plugin");
    const reactDir = path.join(fixtureDir, "react-app");
    await fs.mkdir(path.join(reactDir, "app", "dashboard"), { recursive: true });
    await fs.mkdir(path.join(reactDir, "components"), { recursive: true });

    await fs.writeFile(
      path.join(reactDir, "app", "dashboard", "page.tsx"),
      `
      import React from "react";
      import { ProjectList } from "../../components/ProjectList";
      export default function DashboardPage() {
        return <div><ProjectList /></div>;
      }
      `
    );

    await fs.writeFile(
      path.join(reactDir, "components", "ProjectList.tsx"),
      `
      import React, { useEffect } from "react";
      export function ProjectList() {
        useEffect(() => {
          fetch("/api/projects");
        }, []);
        return <div>List</div>;
      }
      `
    );

    const reactFiles = await reactParserPlugin.collectFiles(reactDir);
    assert(reactFiles.length === 2, "React plugin collected page and component files");

    const reactResult = await reactParserPlugin.parse(reactDir, reactFiles);
    const dashboardPage = reactResult.entities.find((e) => e.type === "page");
    const projectListComponent = reactResult.entities.find((e) => e.id === "component:ProjectList");

    assert(dashboardPage !== undefined, "Next.js page entity detected");
    assert(projectListComponent !== undefined, "React component entity 'ProjectList' detected");

    // -------------------------------------------------------------
    // Test 3: Prisma Parser Plugin
    // -------------------------------------------------------------
    console.log("\n3. Test Prisma Schema Parser Plugin");
    const prismaDir = path.join(fixtureDir, "prisma-app");
    await fs.mkdir(path.join(prismaDir, "prisma"), { recursive: true });

    await fs.writeFile(
      path.join(prismaDir, "prisma", "schema.prisma"),
      `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }
      model Customer {
        id        String   @id @default(uuid())
        email     String   @unique
        orders    Order[]
        @@map("customers")
      }
      model Order {
        id          String   @id @default(uuid())
        customerId  String
        customer    Customer @relation(fields: [customerId], references: [id])
        totalAmount Float
      }
      `
    );

    const prismaFiles = await prismaParserPlugin.collectFiles(prismaDir);
    assert(prismaFiles.length === 1, "Prisma plugin collected schema.prisma");

    const prismaResult = await prismaParserPlugin.parse(prismaDir, prismaFiles);
    const customerModel = prismaResult.entities.find((e) => e.id === "model:Customer");
    const orderModel = prismaResult.entities.find((e) => e.id === "model:Order");

    assert(customerModel !== undefined, "Model 'Customer' extracted");
    assert(orderModel !== undefined, "Model 'Order' extracted");
    assert(
      customerModel?.metadata["tableName"] === "customers",
      "Custom @@map table name captured"
    );

    const customerOrderRelation = prismaResult.relationships.some(
      (r) => r.sourceId === "model:Order" && r.targetId === "model:Customer" && r.type === "queries"
    );
    assert(customerOrderRelation, "Model relation Order -> Customer captured");

    // -------------------------------------------------------------
    // Test 4: Markdown Documentation Parser Plugin
    // -------------------------------------------------------------
    console.log("\n4. Test Markdown Documentation Parser Plugin");
    const docsDir = path.join(fixtureDir, "docs-app");
    await fs.mkdir(docsDir, { recursive: true });

    await fs.writeFile(
      path.join(docsDir, "README.md"),
      `
      # Sarthi Architecture Guide
      Welcome to the documentation.
      ## Overview
      This is the system overview.
      ## Modules
      Details about authentication and projects.
      `
    );

    const docFiles = await markdownParserPlugin.collectFiles(docsDir);
    assert(docFiles.length === 1, "Markdown plugin collected README.md");

    const docResult = await markdownParserPlugin.parse(docsDir, docFiles);
    const readmeDoc = docResult.entities.find(
      (e) => e.type === "doc" && e.name === "Sarthi Architecture Guide"
    );
    assert(readmeDoc !== undefined, "README title extracted as doc entity");

    const sectionDoc = docResult.entities.find((e) => e.name.includes("Overview"));
    assert(sectionDoc !== undefined, "H2 section extracted as sub-doc entity");

    // -------------------------------------------------------------
    // Test 5: Parser Manager & Fault Isolation
    // -------------------------------------------------------------
    console.log("\n5. Test Parser Manager & Fault Isolation");
    // Create combined project with package.json and one malformed file
    const combinedDir = path.join(fixtureDir, "combined-app");
    await fs.mkdir(combinedDir, { recursive: true });
    await fs.writeFile(
      path.join(combinedDir, "package.json"),
      JSON.stringify({
        dependencies: { express: "^4.18.2", "@prisma/client": "^5.0.0" },
      })
    );

    // Valid Express route
    await fs.writeFile(
      path.join(combinedDir, "routes.ts"),
      `router.get("/health", healthController);`
    );

    // Malformed syntax file to test error recovery
    await fs.writeFile(path.join(combinedDir, "broken.ts"), `const syntax error = {{{{;;;`);

    const techReport = await technologyDetector.detect(combinedDir);
    assert(techReport.technologies.includes("Express"), "Detector identified Express");
    assert(techReport.technologies.includes("Prisma"), "Detector identified Prisma");

    const mgrResult = await parserManager.parseRepository(combinedDir);
    assert(mgrResult.entities.length > 0, "Parser manager returned entities despite broken file");
    assert(mgrResult.stats.routesCount >= 1, "Routes count accurately aggregated");
    console.log(`     Entities found: ${mgrResult.stats.totalEntities}`);
    console.log(`     Modules count : ${mgrResult.stats.modulesCount}`);
    console.log(`     Routes count  : ${mgrResult.stats.routesCount}`);

    // -------------------------------------------------------------
    // Test 6: End-to-End API Integration
    // -------------------------------------------------------------
    console.log("\n6. Test End-to-End API Endpoints (POST /analyze & GET /entities)");
    // Register user
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Parser User", email: testUserEmail, password }),
    });
    const regData = (await regRes.json()) as { data: { accessToken: string } };
    token = regData.data.accessToken;

    // Create project
    const projRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Octocat M5 Project",
        githubUrl: "https://github.com/octocat/Hello-World",
      }),
    });
    const projData = (await projRes.json()) as { data: { project: { id: string } } };
    projectId = projData.data.project.id;

    // Analyze project
    const analyzeRes = await fetch(`${BASE_URL}/projects/${projectId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const analyzeData = (await analyzeRes.json()) as {
      success: boolean;
      data: {
        analysis: { status: string; summary: string; parserVersion: string };
        parseResult: { stats: { totalEntities: number } };
      };
    };

    assert(analyzeRes.status === 200, "POST /analyze returned HTTP 200");
    assert(analyzeData.data.analysis.status === "completed", "Analysis status is 'completed'");
    assert(analyzeData.data.analysis.parserVersion === "v1.0.0-m5", "Parser version is v1.0.0-m5");
    assert(
      analyzeData.data.parseResult !== undefined,
      "parseResult is included in analyze response"
    );

    // Fetch entities
    const entitiesRes = await fetch(`${BASE_URL}/projects/${projectId}/entities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const entitiesData = (await entitiesRes.json()) as {
      success: boolean;
      data: {
        entities: unknown[];
        technologies: { technologies: string[] };
        stats: { totalEntities: number };
      };
    };

    assert(entitiesRes.status === 200, "GET /entities returned HTTP 200");
    assert(entitiesData.success === true, "GET /entities succeeded");
    assert(Array.isArray(entitiesData.data.entities), "Returned entities array");

    console.log("\n=======================================================");
    console.log(`ALL MILESTONE 5 TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log("=======================================================");
  } finally {
    // Cleanup fixtures
    await fs.rm(fixtureDir, { recursive: true, force: true }).catch(() => {});

    // Cleanup project and test user
    if (projectId) {
      await fetch(`${BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });

    await prisma.$disconnect();
    server.close();
  }
}

main().catch((err) => {
  console.error("Verification failed with exception:", err);
  process.exit(1);
});
