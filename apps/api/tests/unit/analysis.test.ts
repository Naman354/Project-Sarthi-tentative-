import { analysisEngine } from "../../src/analysis/engine.js";
import { healthAnalyzer } from "../../src/analysis/health.analyzer.js";
import type {
  ProjectGraphResponse,
  ModuleSummaryItem,
  GraphNode,
  GraphEdge,
} from "../../src/graph/types.js";

export async function runAnalysisTests(): Promise<{
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

  console.log("\n  [Suite: Analysis Engine & Health Analyzer]");

  // Construct a test graph with a known circular dependency
  // Node A -> Node B -> Node C -> Node A
  const circularNodes: Array<GraphNode & { incomingCount: number; outgoingCount: number }> = [
    {
      id: "node-a",
      entityId: "service-a",
      name: "ServiceA",
      nodeType: "service",
      metadata: { filePath: "src/services/a.service.ts" },
      incomingCount: 1,
      outgoingCount: 1,
    },
    {
      id: "node-b",
      entityId: "service-b",
      name: "ServiceB",
      nodeType: "service",
      metadata: { filePath: "src/services/b.service.ts" },
      incomingCount: 1,
      outgoingCount: 1,
    },
    {
      id: "node-c",
      entityId: "service-c",
      name: "ServiceC",
      nodeType: "service",
      metadata: { filePath: "src/services/c.service.ts" },
      incomingCount: 1,
      outgoingCount: 1,
    },
    {
      id: "node-orphan",
      entityId: "service-orphan",
      name: "OrphanService",
      nodeType: "service",
      metadata: { filePath: "src/services/orphan.service.ts" },
      incomingCount: 0,
      outgoingCount: 0,
    },
  ];

  const circularEdges: GraphEdge[] = [
    {
      id: "edge-1",
      sourceNodeId: "node-a",
      targetNodeId: "node-b",
      relationshipType: "uses",
    },
    {
      id: "edge-2",
      sourceNodeId: "node-b",
      targetNodeId: "node-c",
      relationshipType: "uses",
    },
    {
      id: "edge-3",
      sourceNodeId: "node-c",
      targetNodeId: "node-a",
      relationshipType: "uses",
    },
  ];

  const testGraph: ProjectGraphResponse = {
    version: {
      id: "ver-1",
      versionNumber: 1,
      analysisTimestamp: new Date(),
      gitCommitHash: "c0ffee",
      repositoryBranch: "main",
      parserVersion: "v1.0.0",
    },
    nodes: circularNodes,
    edges: circularEdges,
    stats: {
      totalNodes: circularNodes.length,
      totalEdges: circularEdges.length,
      nodeTypeCounts: { service: 4 },
      edgeTypeCounts: { uses: 3 },
      modulesCount: 1,
      routesCount: 0,
      modelsCount: 0,
      servicesCount: 4,
      componentsCount: 0,
      docsCount: 0,
    },
  };

  const modules: ModuleSummaryItem[] = [
    {
      id: "mod-core",
      name: "core",
      path: "src/services",
      routesCount: 0,
      servicesCount: 4,
      modelsCount: 0,
      docsCount: 0,
      componentsCount: 0,
    },
  ];

  // 1. Health Analyzer Tests
  console.log("   Scenario: Cycle & Anomaly Detection");
  const healthReport = healthAnalyzer.analyze(testGraph, modules);

  const cycleMetric = healthReport.metrics.find((m) => m.name === "Circular Dependencies");
  assert(
    ((cycleMetric?.details?.cyclesDetected as number) || 0) >= 1,
    "Detects circular dependency loop A -> B -> C -> A"
  );

  const orphanMetric = healthReport.metrics.find((m) => m.name === "Architecture Connectivity");
  assert(
    ((orphanMetric?.details?.orphanEntitiesCount as number) || 0) >= 1,
    "Detects orphan node with zero connections"
  );

  assert(
    healthReport.overallScore <= 90,
    "Deducts score penalty for circular dependencies and orphans"
  );
  assert(typeof healthReport.status === "string", "Assigns health status string");

  // 2. Analysis Engine Full Pipeline Test
  console.log("   Scenario: Comprehensive Analysis Engine Pipeline");
  const engineResult = analysisEngine.analyze(testGraph, modules, null, null);

  assert(engineResult.health !== undefined, "Produces health report");
  assert(engineResult.insights.length >= 1, "Generates architectural insights");
  assert(
    engineResult.insights.some(
      (i) => i.type === "circular_dependency" || i.title.toLowerCase().includes("circular")
    ),
    "Generates insight specifically for circular dependency"
  );

  // 3. Resume Session Briefing Test
  console.log("   Scenario: Resume Session Briefing Generation");
  assert(engineResult.resume !== undefined, "Generates Resume Session briefing");
  assert(
    typeof engineResult.resume.timeSinceLastAnalysis === "string",
    "Resume briefing includes time since last analysis"
  );
  assert(
    typeof engineResult.resume.suggestedStartingPoint.moduleName === "string",
    "Provides suggested starting module and rationale"
  );
  assert(
    Array.isArray(engineResult.resume.navigationRecommendations),
    "Provides navigation recommendations"
  );

  return { name: "Analysis Engine & Health Analyzer", passed, failed };
}
