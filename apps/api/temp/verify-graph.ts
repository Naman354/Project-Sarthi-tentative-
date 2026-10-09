import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { graphValidator } from "../src/graph/validator.js";
import { graphBuilder } from "../src/graph/builder.js";
import { graphRepository } from "../src/repositories/graph.repository.js";
import { graphService } from "../src/services/graph.service.js";
import type {
  NormalizedEntity,
  NormalizedRelationship,
  ParserManagerResult,
} from "../parsers/types.js";

const PORT = 5088;
const BASE_URL = `http://localhost:${PORT}`;

let totalTests = 0;
let passedTests = 0;

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

async function main() {
  console.log("=== Milestone 6: Graph Builder Verification Suite ===");

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const timestamp = Date.now();
  const userAEmail = `graph_tester_a_${timestamp}@example.com`;
  const userBEmail = `graph_tester_b_${timestamp}@example.com`;
  const password = "Password123!";
  let tokenA = "";
  let tokenB = "";
  let projectId = "";

  const fixtureDir = path.resolve(process.cwd(), "temp", `test-graph-fixture-${timestamp}`);
  await fs.mkdir(fixtureDir, { recursive: true });

  try {
    // -------------------------------------------------------------
    // Test 1: Graph Validator - Entity Deduplication & Node Keying
    // -------------------------------------------------------------
    console.log("\n1. Test Graph Validator - Entity Deduplication");
    const rawEntities: NormalizedEntity[] = [
      {
        id: "route:post_login",
        type: "route",
        name: "POST /auth/login",
        filePath: "src/routes/auth.routes.ts",
        metadata: { method: "POST", path: "/auth/login" },
      },
      // Duplicate of post_login with identical type + name
      {
        id: "route:post_login_dup",
        type: "route",
        name: "POST /auth/login",
        filePath: "src/routes/auth.routes.ts",
        metadata: { handler: "authController.login" },
      },
      {
        id: "module:auth",
        type: "module",
        name: "Auth",
        filePath: "src/routes/auth.routes.ts",
        metadata: {},
      },
    ];

    const rawRelationships: NormalizedRelationship[] = [
      {
        sourceId: "module:auth",
        targetId: "route:post_login",
        type: "contains",
      },
      // Duplicate relationship
      {
        sourceId: "module:auth",
        targetId: "route:post_login",
        type: "contains",
      },
    ];

    const valResult1 = graphValidator.validate(rawEntities, rawRelationships);
    assert(valResult1.nodes.length === 2, "Entities deduplicated from 3 to 2 unique nodes");
    assert(valResult1.stats.nodesDeduplicated === 1, "Deduplication counter incremented");
    assert(valResult1.edges.length === 1, "Duplicate relationship filtered to single edge");
    const mergedRoute = valResult1.nodes.find((n) => n.name === "POST /auth/login");
    assert(
      (mergedRoute?.metadata as any)?.handler === "authController.login" &&
        (mergedRoute?.metadata as any)?.method === "POST",
      "Merged entity preserves metadata from both duplicates"
    );

    // -------------------------------------------------------------
    // Test 2: Graph Validator - Route-to-Module Grouping & Orphan Filtering
    // -------------------------------------------------------------
    console.log("\n2. Test Route-to-Module Auto-Assignment & Orphan Filtering");
    const unassignedEntities: NormalizedEntity[] = [
      {
        id: "route:get_users",
        type: "route",
        name: "GET /users",
        filePath: "src/routes/users.ts",
        metadata: { path: "/users", method: "GET" },
      },
      {
        id: "route:get_orders",
        type: "route",
        name: "GET /orders/:id",
        filePath: "src/routes/orders.ts",
        metadata: { path: "/orders/:id", method: "GET" },
      },
      {
        id: "model:user",
        type: "model",
        name: "User",
        filePath: "prisma/schema.prisma",
        metadata: {},
      },
    ];

    const brokenRelationships: NormalizedRelationship[] = [
      // Valid relation between existing nodes (will be valid)
      {
        sourceId: "route:get_users",
        targetId: "model:user",
        type: "queries",
      },
      // Broken orphan relation referencing non-existent source
      {
        sourceId: "non_existent_node_xyz",
        targetId: "model:user",
        type: "queries",
      },
      // Broken orphan relation referencing non-existent target
      {
        sourceId: "model:user",
        targetId: "non_existent_target_123",
        type: "uses",
      },
    ];

    const valResult2 = graphValidator.validate(unassignedEntities, brokenRelationships);
    assert(
      valResult2.stats.routesWithoutModuleAssigned === 2,
      "Detected 2 routes without module assignment"
    );
    assert(valResult2.stats.orphanEdgesDropped === 2, "Orphan edges safely dropped");

    const createdUsersModule = valResult2.nodes.find(
      (n) => n.nodeType === "module" && n.name.toLowerCase() === "users"
    );
    assert(Boolean(createdUsersModule), "Auto-created synthetic module for /users route");

    const createdOrdersModule = valResult2.nodes.find(
      (n) => n.nodeType === "module" && n.name.toLowerCase() === "orders"
    );
    assert(Boolean(createdOrdersModule), "Auto-created synthetic module for /orders/:id route");

    const containsEdges = valResult2.edges.filter((e) => e.relationshipType === "contains");
    assert(containsEdges.length === 2, "Contains edges established for auto-assigned routes");

    // -------------------------------------------------------------
    // Test 3: GraphBuilder Pipeline & Stats Aggregation
    // -------------------------------------------------------------
    console.log("\n3. Test GraphBuilder Pipeline & Aggregation");
    const mockParserResult: ParserManagerResult = {
      technologies: { technologies: ["Express", "Prisma"], details: {} },
      entities: [
        {
          id: "mod:billing",
          type: "module",
          name: "Billing",
          filePath: "src/billing",
          metadata: {},
        },
        {
          id: "route:post_pay",
          type: "route",
          name: "POST /billing/pay",
          filePath: "src/billing/routes.ts",
          metadata: { path: "/billing/pay", method: "POST" },
        },
        {
          id: "service:payment",
          type: "service",
          name: "PaymentService",
          filePath: "src/billing/service.ts",
          metadata: {},
        },
        {
          id: "model:invoice",
          type: "model",
          name: "Invoice",
          filePath: "prisma/schema.prisma",
          metadata: {},
        },
      ],
      relationships: [
        { sourceId: "mod:billing", targetId: "route:post_pay", type: "contains" },
        { sourceId: "route:post_pay", targetId: "service:payment", type: "uses" },
        { sourceId: "service:payment", targetId: "model:invoice", type: "queries" },
      ],
      warnings: [],
      stats: {
        totalEntities: 4,
        totalRelationships: 3,
        modulesCount: 1,
        routesCount: 1,
        modelsCount: 1,
        componentsCount: 0,
        docsCount: 0,
        durationMs: 15,
      },
    };

    const buildResult = graphBuilder.build(mockParserResult);
    assert(buildResult.nodes.length === 4, "GraphBuilder returned 4 validated nodes");
    assert(buildResult.edges.length === 3, "GraphBuilder returned 3 validated edges");
    assert(buildResult.stats.modulesCount === 1, "Stats aggregated modulesCount = 1");
    assert(buildResult.stats.routesCount === 1, "Stats aggregated routesCount = 1");
    assert(buildResult.stats.servicesCount === 1, "Stats aggregated servicesCount = 1");
    assert(buildResult.stats.modelsCount === 1, "Stats aggregated modelsCount = 1");

    // -------------------------------------------------------------
    // Test 4: Database Persistence & Transactional Integrity
    // -------------------------------------------------------------
    console.log("\n4. Test Database Transactional Persistence (GraphRepository)");
    // Register User A
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userAEmail,
        password,
        name: "Graph Tester A",
      }),
    });
    const regDataA = await regResA.json();
    tokenA = regDataA.data.accessToken;

    // Register User B for tenant isolation tests
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userBEmail,
        password,
        name: "Graph Tester B",
      }),
    });
    const regDataB = await regResB.json();
    tokenB = regDataB.data.accessToken;

    // Create Project
    const projRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: "Graph Validation App",
        githubUrl: "https://github.com/octocat/Hello-World",
      }),
    });
    const projData = (await projRes.json()) as { data: { project: { id: string } } };
    projectId = projData.data.project.id;
    assert(Boolean(projectId), "Project created for graph tests");

    // Persist Graph Version 1 directly via GraphRepository
    const version1 = await graphRepository.persistGraph(
      projectId,
      {
        gitCommitHash: "c0ffee1",
        repositoryBranch: "main",
        parserVersion: "v1.0.0-m6",
      },
      buildResult.nodes,
      buildResult.edges
    );

    assert(Boolean(version1.id), "GraphVersion record created in PostgreSQL");
    assert(version1.versionNumber === 1, "Initial graph versionNumber is 1");

    // Verify Nodes & Edges exist in DB
    const dbNodes = await prisma.node.findMany({ where: { graphVersionId: version1.id } });
    const dbEdges = await prisma.edge.findMany({ where: { graphVersionId: version1.id } });
    assert(dbNodes.length === 4, "All 4 nodes persisted in 'nodes' table");
    assert(dbEdges.length === 3, "All 3 edges persisted in 'edges' table");

    // Verify Project's currentGraphVersionId updated
    const updatedProj = await prisma.project.findUnique({ where: { id: projectId } });
    assert(
      updatedProj?.currentGraphVersionId === version1.id,
      "Project currentGraphVersionId points to Version 1"
    );

    // -------------------------------------------------------------
    // Test 5: Graph Versioning & Incremental Analysis
    // -------------------------------------------------------------
    console.log("\n5. Test Graph Versioning & Incremental History");
    const version2 = await graphRepository.persistGraph(
      projectId,
      {
        gitCommitHash: "c0ffee2",
        repositoryBranch: "feature/v2",
        parserVersion: "v1.0.0-m6",
      },
      buildResult.nodes,
      buildResult.edges
    );

    assert(version2.versionNumber === 2, "Re-analysis increments versionNumber to 2");

    const projV2 = await prisma.project.findUnique({ where: { id: projectId } });
    assert(
      projV2?.currentGraphVersionId === version2.id,
      "Project currentGraphVersionId updated to Version 2"
    );

    const versionList = await graphRepository.listVersions(projectId);
    assert(versionList.length === 2, "Repository listVersions returns both versions");
    assert(
      versionList[0].versionNumber === 2 && versionList[1].versionNumber === 1,
      "Versions sorted in descending order"
    );

    // -------------------------------------------------------------
    // Test 6: Querying Graph, Modules, and Module Details
    // -------------------------------------------------------------
    console.log("\n6. Test Graph & Module Repository Queries");
    const graphData = await graphRepository.getGraph(version2.id);
    assert(Boolean(graphData), "getGraph returns ProjectGraphResponse");
    assert(graphData?.nodes.length === 4, "Graph response contains 4 nodes");
    assert(graphData?.edges.length === 3, "Graph response contains 3 edges");

    // Check node degrees
    const billingModNode = graphData?.nodes.find((n) => n.nodeType === "module");
    assert(
      billingModNode?.outgoingCount === 1,
      "Module node has outgoingCount = 1 (contains edge)"
    );

    const modules = await graphRepository.getModules(version2.id);
    assert(modules.length === 1, "getModules returns 1 module");
    assert(modules[0].name === "Billing", "Module name is 'Billing'");
    assert(modules[0].routesCount === 1, "Module reports 1 route contained");

    const moduleDetails = await graphRepository.getModuleDetails(version2.id, modules[0].id);
    assert(Boolean(moduleDetails), "getModuleDetails returned module detail");
    assert(moduleDetails?.nodes.length >= 3, "Module detail includes subgraph nodes");

    // -------------------------------------------------------------
    // Test 7: HTTP API Endpoints (GET /graph, /modules, /module/:id, /versions)
    // -------------------------------------------------------------
    console.log("\n7. Test HTTP API Endpoints");

    // GET /projects/:id/graph
    const apiGraphRes = await fetch(`${BASE_URL}/projects/${projectId}/graph`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(apiGraphRes.status === 200, "GET /projects/:id/graph returned HTTP 200");
    const apiGraphData = await apiGraphRes.json();
    assert(apiGraphData.success === true, "API graph reports success: true");
    assert(
      apiGraphData.data.version.versionNumber === 2,
      "API graph serves latest version by default"
    );
    assert(apiGraphData.data.stats.totalNodes === 4, "API graph reports accurate totalNodes");

    // GET /projects/:id/graph?version=<version1.id>
    const apiGraphV1Res = await fetch(
      `${BASE_URL}/projects/${projectId}/graph?version=${version1.id}`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const apiGraphV1Data = await apiGraphV1Res.json();
    assert(
      apiGraphV1Data.data.version.versionNumber === 1,
      "Explicit ?version query fetches Version 1"
    );

    // GET /projects/:id/modules
    const apiModulesRes = await fetch(`${BASE_URL}/projects/${projectId}/modules`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(apiModulesRes.status === 200, "GET /projects/:id/modules returned HTTP 200");
    const apiModulesData = await apiModulesRes.json();
    assert(apiModulesData.data.total === 1, "API modules reports total = 1");
    assert(apiModulesData.data.modules[0].name === "Billing", "Module name verified");

    // GET /projects/:id/module/:moduleId
    const targetModId = apiModulesData.data.modules[0].id;
    const apiModDetailRes = await fetch(`${BASE_URL}/projects/${projectId}/module/${targetModId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(apiModDetailRes.status === 200, "GET /projects/:id/module/:moduleId returned HTTP 200");
    const apiModDetailData = await apiModDetailRes.json();
    assert(apiModDetailData.data.module.name === "Billing", "Module detail name matches");

    // GET /projects/:id/graph/versions
    const apiVersionsRes = await fetch(`${BASE_URL}/projects/${projectId}/graph/versions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(apiVersionsRes.status === 200, "GET /projects/:id/graph/versions returned HTTP 200");
    const apiVersionsData = await apiVersionsRes.json();
    assert(apiVersionsData.data.total === 2, "API versions reports total = 2");

    // -------------------------------------------------------------
    // Test 8: End-to-End Analysis Pipeline Linking GraphVersion
    // -------------------------------------------------------------
    console.log("\n8. Test End-to-End POST /analyze integration with Graph Builder");

    // Trigger POST /analyze on project
    const analyzeRes = await fetch(`${BASE_URL}/projects/${projectId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(analyzeRes.status === 200, "POST /analyze returned HTTP 200");
    const analyzeData = await analyzeRes.json();
    assert(analyzeData.success === true, "POST /analyze succeeded");
    assert(Boolean(analyzeData.data.graphVersion), "POST /analyze returned graphVersion");
    assert(
      analyzeData.data.graphVersion.versionNumber === 3,
      "POST /analyze created incremental graph versionNumber = 3"
    );
    assert(
      Boolean(analyzeData.data.analysis.graphVersionId),
      "Analysis DB record is linked to graphVersionId"
    );

    // Verify GET /graph on newly analyzed version
    const liveGraphRes = await fetch(`${BASE_URL}/projects/${projectId}/graph`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(liveGraphRes.status === 200, "GET /graph on newly analyzed repo returns 200");
    const liveGraphData = await liveGraphRes.json();
    assert(
      liveGraphData.data.version.versionNumber === 3,
      "GET /graph reflects newly generated Version 3"
    );

    // -------------------------------------------------------------
    // Test 9: Authorization & Tenant Isolation Checks
    // -------------------------------------------------------------
    console.log("\n9. Test Authorization & Tenant Isolation Checks");
    const forbiddenGraphRes = await fetch(`${BASE_URL}/projects/${projectId}/graph`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(forbiddenGraphRes.status === 403, "User B gets 403 Forbidden on User A's /graph");

    const forbiddenModulesRes = await fetch(`${BASE_URL}/projects/${projectId}/modules`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(forbiddenModulesRes.status === 403, "User B gets 403 Forbidden on User A's /modules");

    console.log("\n=======================================================");
    console.log(`ALL MILESTONE 6 TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log("=======================================================\n");
  } finally {
    // Cleanup
    try {
      await prisma.project.deleteMany({
        where: {
          owner: {
            email: { in: [userAEmail, userBEmail] },
          },
        },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userAEmail, userBEmail] } },
      });
      await fs.rm(fixtureDir, { recursive: true, force: true });
      await prisma.$disconnect();
    } catch {
      // ignore
    }
    server.close();
  }
}

main().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
