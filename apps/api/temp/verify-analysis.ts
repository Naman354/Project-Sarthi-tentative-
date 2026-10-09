import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { healthAnalyzer } from "../src/analysis/health.analyzer.js";
import { insightGenerator } from "../src/analysis/insight.generator.js";
import { resumeGenerator } from "../src/analysis/resume.generator.js";
import { insightRepository } from "../src/repositories/insight.repository.js";
import { healthMetricRepository } from "../src/repositories/health.repository.js";
import type { ProjectGraphResponse, ModuleSummaryItem } from "../graph/types.js";

const PORT = 5077;
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
  console.log("=== Milestone 7: Analysis Engine & Insight Generation Verification Suite ===");

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const timestamp = Date.now();
  const userAEmail = `analysis_tester_a_${timestamp}@example.com`;
  const userBEmail = `analysis_tester_b_${timestamp}@example.com`;
  const password = "Password123!";
  let tokenA = "";
  let tokenB = "";
  let projectId = "";

  try {
    // -------------------------------------------------------------
    // Test 1: Health Analyzer Signals & Scoring
    // -------------------------------------------------------------
    console.log("\n1. Test Health Analyzer Signals & Cycle Detection");
    const mockGraph1: ProjectGraphResponse = {
      version: {
        id: "v1-uuid",
        versionNumber: 1,
        analysisTimestamp: new Date(),
        gitCommitHash: "head1",
        repositoryBranch: "main",
        parserVersion: "v1.0.0-m6",
      },
      nodes: [
        {
          id: "m1",
          entityId: "mod:auth",
          nodeType: "module",
          name: "Auth",
          metadata: {},
          incomingCount: 0,
          outgoingCount: 2,
        },
        {
          id: "r1",
          entityId: "route:login",
          nodeType: "route",
          name: "POST /auth/login",
          metadata: { path: "/auth/login" },
          incomingCount: 1,
          outgoingCount: 1,
        },
        {
          id: "s1",
          entityId: "srv:auth",
          nodeType: "service",
          name: "AuthService",
          metadata: {},
          incomingCount: 1,
          outgoingCount: 1,
        },
        {
          id: "s2",
          entityId: "srv:token",
          nodeType: "service",
          name: "TokenService",
          metadata: {},
          incomingCount: 1,
          outgoingCount: 1,
        },
        {
          id: "d1",
          entityId: "doc:readme",
          nodeType: "doc",
          name: "README.md",
          metadata: { filePath: "README.md" },
          incomingCount: 0,
          outgoingCount: 0,
        },
      ],
      // Create a cycle: AuthService -> TokenService -> AuthService
      edges: [
        { id: "e1", sourceNodeId: "m1", targetNodeId: "r1", relationshipType: "contains" },
        { id: "e2", sourceNodeId: "r1", targetNodeId: "s1", relationshipType: "uses" },
        { id: "e3", sourceNodeId: "s1", targetNodeId: "s2", relationshipType: "uses" },
        { id: "e4", sourceNodeId: "s2", targetNodeId: "s1", relationshipType: "uses" },
      ],
      stats: {
        totalNodes: 5,
        totalEdges: 4,
        nodeTypeCounts: { module: 1, route: 1, service: 2, doc: 1 },
        edgeTypeCounts: { contains: 1, uses: 3 },
        modulesCount: 1,
        routesCount: 1,
        modelsCount: 0,
        servicesCount: 2,
        componentsCount: 0,
        docsCount: 1,
      },
    };

    const mockModules1: ModuleSummaryItem[] = [
      {
        id: "m1",
        name: "Auth",
        entityId: "mod:auth",
        routesCount: 1,
        modelsCount: 0,
        servicesCount: 2,
        componentsCount: 0,
        docsCount: 1,
        routes: [{ id: "r1", name: "POST /auth/login", method: "POST", path: "/auth/login" }],
        models: [],
        services: [{ id: "s1", name: "AuthService" }],
        components: [],
        docs: [{ id: "d1", name: "README.md" }],
      },
    ];

    const healthReport1 = healthAnalyzer.analyze(mockGraph1, mockModules1);
    assert(healthReport1.overallScore > 0, "Overall health score calculated");
    assert(healthReport1.metrics.length === 5, "Report contains 5 health metrics");

    const cycleMetric = healthReport1.metrics.find((m) => m.name === "Circular Dependencies");
    assert(Boolean(cycleMetric), "Circular Dependencies metric exists");
    assert(
      (cycleMetric?.details["cyclesDetected"] as number) >= 1,
      "Dependency cycle (AuthService <-> TokenService) detected"
    );
    assert(cycleMetric?.status !== "healthy", "Circular dependency metric flagged as non-healthy");

    const docMetric = healthReport1.metrics.find((m) => m.name === "Documentation Coverage");
    assert(Boolean(docMetric), "Documentation coverage metric calculated");
    assert(docMetric?.value === 100, "README covers Auth module resulting in 100% coverage");

    // -------------------------------------------------------------
    // Test 2: Insight Generator
    // -------------------------------------------------------------
    console.log("\n2. Test Insight Generator");
    const insights1 = insightGenerator.generate(mockGraph1, mockModules1, healthReport1);
    assert(insights1.length > 0, "InsightGenerator produced insights");

    const cycleInsight = insights1.find((i) => i.title.includes("Circular"));
    assert(Boolean(cycleInsight), "Generated insight for circular dependency");
    assert(cycleInsight?.severity === "high", "Circular dependency severity is high");

    // Test with low documentation graph
    const mockGraphNoDoc: ProjectGraphResponse = {
      ...mockGraph1,
      nodes: mockGraph1.nodes.filter((n) => n.nodeType !== "doc"),
    };
    const healthNoDoc = healthAnalyzer.analyze(mockGraphNoDoc, [
      { ...mockModules1[0], docsCount: 0, docs: [] },
    ]);
    const insightsNoDoc = insightGenerator.generate(mockGraphNoDoc, mockModules1, healthNoDoc);
    const docInsight = insightsNoDoc.find((i) => i.title.includes("Documentation"));
    assert(Boolean(docInsight), "Generated insight for documentation deficit");

    // -------------------------------------------------------------
    // Test 3: Resume Generator
    // -------------------------------------------------------------
    console.log("\n3. Test Resume Session Generator");
    const resumeInitial = resumeGenerator.generate(
      mockGraph1,
      null, // No previous graph (initial run)
      mockModules1,
      healthReport1,
      insights1,
      null
    );
    assert(resumeInitial.hasPreviousVersion === false, "Recognizes initial session");
    assert(resumeInitial.currentVersionNumber === 1, "Reports currentVersionNumber = 1");
    assert(
      resumeInitial.suggestedStartingPoint.moduleName === "Auth",
      "Suggests Auth as starting point"
    );
    assert(
      resumeInitial.navigationRecommendations.length > 0,
      "Produced navigation recommendations"
    );

    // Second run with previous graph diff
    const mockGraph2: ProjectGraphResponse = {
      ...mockGraph1,
      version: { ...mockGraph1.version, versionNumber: 2 },
      nodes: [
        ...mockGraph1.nodes,
        {
          id: "r2",
          entityId: "route:register",
          nodeType: "route",
          name: "POST /auth/register",
          metadata: { path: "/auth/register" },
          incomingCount: 1,
          outgoingCount: 0,
        },
      ],
    };
    const resumeDiff = resumeGenerator.generate(
      mockGraph2,
      mockGraph1, // Previous version
      mockModules1,
      healthReport1,
      insights1,
      new Date(Date.now() - 3600000) // 1 hour ago
    );
    assert(resumeDiff.hasPreviousVersion === true, "Recognizes diff against previous version");
    assert(resumeDiff.changesSummary.nodesAdded === 1, "Detected 1 newly added node");
    assert(resumeDiff.previousVersionNumber === 1, "Previous version reported as 1");
    assert(resumeDiff.currentVersionNumber === 2, "Current version reported as 2");

    // -------------------------------------------------------------
    // Test 4: Database Repositories (InsightRepository & HealthMetricRepository)
    // -------------------------------------------------------------
    console.log("\n4. Test Database Repositories Persistence");

    // Register User A
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userAEmail,
        password,
        name: "Analysis Tester A",
      }),
    });
    const regDataA = await regResA.json();
    tokenA = regDataA.data.accessToken;

    // Register User B
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userBEmail,
        password,
        name: "Analysis Tester B",
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
        name: "Analysis Engine Test Project",
        githubUrl: "https://github.com/octocat/Hello-World",
      }),
    });
    const projData = await projRes.json();
    projectId = projData.data.project.id;
    assert(Boolean(projectId), "Test project created");

    // Persist mock insights
    const savedInsightsCount = await insightRepository.createMany(projectId, undefined, [
      {
        title: "Test Architecture Risk",
        description: "Coupling between modules is high.",
        severity: "high",
        relatedModule: "Auth",
      },
      {
        title: "Test Documentation Warning",
        description: "Missing README in subpackage.",
        severity: "medium",
        relatedModule: "Auth",
      },
    ]);
    assert(savedInsightsCount === 2, "Persisted 2 insights in PostgreSQL");

    const dbInsights = await insightRepository.findByProjectId(projectId);
    assert(dbInsights.length === 2, "Retrieved 2 insights from database");
    assert(dbInsights[0].title === "Test Architecture Risk", "Insight title verified");

    // Persist health metrics
    const savedMetricsCount = await healthMetricRepository.replaceMetrics(projectId, [
      {
        name: "Documentation Coverage",
        value: 85,
        status: "healthy",
        details: { docCount: 3 },
      },
      {
        name: "Dependency Complexity",
        value: 70,
        status: "warning",
        details: { avgDegree: 3.2 },
      },
    ]);
    assert(savedMetricsCount === 2, "Persisted 2 health metrics in PostgreSQL");

    const dbMetrics = await healthMetricRepository.findByProjectId(projectId);
    assert(dbMetrics.length === 2, "Retrieved 2 health metrics from database");
    assert(dbMetrics[0].name === "Documentation Coverage", "Health metric name verified");

    // -------------------------------------------------------------
    // Test 5: End-to-End POST /projects/:id/analyze Pipeline
    // -------------------------------------------------------------
    console.log("\n5. Test End-to-End Analysis Pipeline Execution");
    const analyzeRes = await fetch(`${BASE_URL}/projects/${projectId}/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(analyzeRes.status === 200, "POST /analyze returned HTTP 200");
    const analyzeData = await analyzeRes.json();
    assert(analyzeData.success === true, "POST /analyze reports success: true");
    assert(Array.isArray(analyzeData.data.insights), "POST /analyze returned insights array");
    assert(Boolean(analyzeData.data.health), "POST /analyze returned health report");
    assert(analyzeData.data.health.overallScore > 0, "POST /analyze computed overallScore");
    assert(
      analyzeData.data.analysis.summary.includes("Health Score"),
      "Analysis summary includes Health Score"
    );

    // -------------------------------------------------------------
    // Test 6: HTTP API Endpoints (/overview, /insights, /health, /resume)
    // -------------------------------------------------------------
    console.log("\n6. Test Milestone 7 HTTP Endpoints");

    // GET /projects/:id/overview
    const overviewRes = await fetch(`${BASE_URL}/projects/${projectId}/overview`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(overviewRes.status === 200, "GET /projects/:id/overview returned HTTP 200");
    const overviewData = await overviewRes.json();
    assert(overviewData.success === true, "Overview reports success: true");
    assert(Boolean(overviewData.data.project), "Overview includes project object");
    assert(Boolean(overviewData.data.graphVersion), "Overview includes graphVersion");
    assert(Boolean(overviewData.data.health), "Overview includes health report");
    assert(Array.isArray(overviewData.data.topInsights), "Overview includes topInsights");

    // GET /projects/:id/insights
    const insightsRes = await fetch(`${BASE_URL}/projects/${projectId}/insights`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(insightsRes.status === 200, "GET /projects/:id/insights returned HTTP 200");
    const insightsData = await insightsRes.json();
    assert(insightsData.success === true, "Insights API reports success: true");
    assert(insightsData.data.total > 0, "Insights API returns non-empty list");

    // GET /projects/:id/health
    const healthRes = await fetch(`${BASE_URL}/projects/${projectId}/health`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(healthRes.status === 200, "GET /projects/:id/health returned HTTP 200");
    const healthData = await healthRes.json();
    assert(healthData.success === true, "Health API reports success: true");
    assert(healthData.data.overallScore > 0, "Health API reports positive overallScore");
    assert(healthData.data.metrics.length >= 2, "Health API reports metric items");

    // GET /projects/:id/resume
    const resumeRes = await fetch(`${BASE_URL}/projects/${projectId}/resume`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resumeRes.status === 200, "GET /projects/:id/resume returned HTTP 200");
    const resumeData = await resumeRes.json();
    assert(resumeData.success === true, "Resume API reports success: true");
    assert(
      Boolean(resumeData.data.timeSinceLastAnalysis),
      "Resume API includes timeSinceLastAnalysis"
    );
    assert(
      Boolean(resumeData.data.suggestedStartingPoint),
      "Resume API includes suggestedStartingPoint"
    );
    assert(
      Array.isArray(resumeData.data.navigationRecommendations),
      "Resume API includes navigationRecommendations"
    );

    // -------------------------------------------------------------
    // Test 7: Authorization & Tenant Isolation Checks
    // -------------------------------------------------------------
    console.log("\n7. Test Authorization & Tenant Isolation Checks");
    const forbiddenOverview = await fetch(`${BASE_URL}/projects/${projectId}/overview`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(forbiddenOverview.status === 403, "User B gets 403 Forbidden on /overview");

    const forbiddenInsights = await fetch(`${BASE_URL}/projects/${projectId}/insights`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(forbiddenInsights.status === 403, "User B gets 403 Forbidden on /insights");

    const forbiddenHealth = await fetch(`${BASE_URL}/projects/${projectId}/health`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(forbiddenHealth.status === 403, "User B gets 403 Forbidden on /health");

    const forbiddenResume = await fetch(`${BASE_URL}/projects/${projectId}/resume`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(forbiddenResume.status === 403, "User B gets 403 Forbidden on /resume");

    console.log("\n=======================================================");
    console.log(`ALL MILESTONE 7 TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log("=======================================================\n");
  } finally {
    // Cleanup
    try {
      await prisma.project.deleteMany({
        where: {
          owner: { email: { in: [userAEmail, userBEmail] } },
        },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userAEmail, userBEmail] } },
      });
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
