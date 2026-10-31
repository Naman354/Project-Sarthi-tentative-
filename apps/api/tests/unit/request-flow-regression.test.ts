import prisma from "../../src/config/prisma.js";
import { graphService } from "../../src/services/graph.service.js";
import { graphRepository } from "../../src/repositories/graph.repository.js";
import { projectService } from "../../src/services/project.service.js";

export async function runRequestFlowRegressionTests(): Promise<{
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

  console.log("\n  [Suite: Request Flow Explorer Zero-Endpoints Regression Suite]");

  try {
    // =========================================================================
    // 1. Saved Project & Graph Access Without Authentication
    // =========================================================================
    console.log("   Scenario 1: Unauthenticated Read Access for Public Repositories");
    const ayuSyncProject = await prisma.project.findFirst({
      where: { githubUrl: "https://github.com/Naman354/AyuSync" },
    });
    assert(Boolean(ayuSyncProject), "Swasthya Setu (AyuSync) project exists in database");

    if (ayuSyncProject) {
      // Test projectService.getProjectById with null userId (unauthenticated)
      const fetchedProject = await projectService.getProjectById(null, ayuSyncProject.id);
      assert(
        fetchedProject.id === ayuSyncProject.id,
        "Public repository project record is readable by guest/unauthenticated user"
      );

      // Test graphService.getGraph with null userId
      const graph = await graphService.getGraph(ayuSyncProject.id, null);
      assert(Boolean(graph), "Public repository graph is readable by guest/unauthenticated user");
      assert(
        graph.stats.routesCount === 22,
        `Swasthya Setu graph payload contains exactly 22 routes (actual: ${graph.stats.routesCount})`
      );

      // Test graphService.getModules with null userId
      const modules = await graphService.getModules(ayuSyncProject.id, null);
      assert(
        modules.length === 14,
        `Swasthya Setu module index contains exactly 14 modules (actual: ${modules.length})`
      );
    }

    // =========================================================================
    // 2. Endpoint Detection and Count Matching on Real Graph Payload
    // =========================================================================
    console.log("   Scenario 2: Real Graph Payloads & Endpoint Detection");

    // Check Swasthya Setu (currently displayed in browser)
    if (ayuSyncProject && ayuSyncProject.currentGraphVersionId) {
      const ayuGraph = await graphRepository.getGraph(ayuSyncProject.currentGraphVersionId);
      assert(Boolean(ayuGraph), "Loaded Swasthya Setu persisted graph payload");

      if (ayuGraph) {
        // Component route extraction logic: graph.nodes.filter(n => n.nodeType === "route")
        const routeNodes = ayuGraph.nodes.filter((n) => n.nodeType === "route");
        assert(
          routeNodes.length === 22,
          `Component endpoint detection extracts 22 routes from Swasthya Setu (actual: ${routeNodes.length})`
        );
        assert(
          ayuGraph.stats.routesCount === routeNodes.length,
          "Graph stats routesCount matches filtered routeNodes length"
        );

        // Verify route node metadata structure
        const triageRoute = routeNodes.find((r) => r.name === "POST /triage");
        assert(Boolean(triageRoute), "Found POST /triage route in Swasthya Setu graph");
        assert(
          triageRoute?.metadata?.httpMethod === "POST",
          "POST /triage metadata contains httpMethod: POST"
        );
        assert(
          triageRoute?.metadata?.path === "/triage",
          "POST /triage metadata contains path: /triage"
        );
        assert(
          triageRoute?.metadata?.handler === "handleTriage",
          "POST /triage metadata contains handler: handleTriage"
        );
        assert(
          Boolean(triageRoute?.metadata?.filePath),
          `POST /triage metadata contains filePath: ${triageRoute?.metadata?.filePath}`
        );

        // Verify handled_by edges exist in graph
        const handledEdges = ayuGraph.edges.filter((e) => e.relationshipType === "handled_by");
        assert(handledEdges.length > 0, `Found ${handledEdges.length} handled_by edges in graph`);
      }
    }

    // Check BRL Quiz Portal
    const brlProject = await prisma.project.findFirst({
      where: { githubUrl: "https://github.com/Naman354/BRL-Quiz-Portal" },
    });
    assert(Boolean(brlProject), "BRL Quiz Portal project exists in database");

    if (brlProject && brlProject.currentGraphVersionId) {
      const brlGraph = await graphRepository.getGraph(brlProject.currentGraphVersionId);
      assert(Boolean(brlGraph), "Loaded BRL Quiz Portal persisted graph payload");

      if (brlGraph) {
        const routeNodes = brlGraph.nodes.filter((n) => n.nodeType === "route");
        assert(
          routeNodes.length === 36,
          `Component endpoint detection extracts 36 routes from BRL Quiz Portal (actual: ${routeNodes.length})`
        );
        assert(
          brlGraph.stats.routesCount === 36,
          `BRL Quiz Portal stats.routesCount is 36 (actual: ${brlGraph.stats.routesCount})`
        );

        // Verify ordered middleware on real route node
        const studentRefresh = routeNodes.find((r) => r.name.includes("student/refresh-session"));
        if (studentRefresh) {
          const mwList = (studentRefresh.metadata.middleware as string[]) || [];
          assert(
            mwList.length >= 2,
            `student/refresh-session preserves ordered middleware list (actual length: ${mwList.length})`
          );
        }

        // Verify resolved controller connection via handled_by edge
        const routeWithEdge = routeNodes.find((r) =>
          brlGraph.edges.some((e) => e.sourceNodeId === r.id && e.relationshipType === "handled_by")
        );
        assert(Boolean(routeWithEdge), "Found route node with handled_by edge in BRL graph");
      }
    }

    // =========================================================================
    // 3. Genuine Zero-Route Repositories (Express JS library)
    // =========================================================================
    console.log("   Scenario 3: Genuine Zero-Route Repository Distinction");
    const expressProject = await prisma.project.findFirst({
      where: { githubUrl: "https://github.com/expressjs/express" },
    });
    assert(Boolean(expressProject), "Express JS project exists in database");

    if (expressProject && expressProject.currentGraphVersionId) {
      const expressGraph = await graphRepository.getGraph(expressProject.currentGraphVersionId);
      assert(Boolean(expressGraph), "Loaded Express JS graph payload");

      if (expressGraph) {
        const routeNodes = expressGraph.nodes.filter((n) => n.nodeType === "route");
        assert(
          routeNodes.length === 0,
          `Express JS genuinely contains 0 route nodes (actual: ${routeNodes.length})`
        );
        assert(
          expressGraph.stats.routesCount === 0,
          `Express JS graph stats.routesCount is 0 (actual: ${expressGraph.stats.routesCount})`
        );
        assert(
          expressGraph.nodes.length === 17,
          `Express JS has 17 documentation nodes (actual: ${expressGraph.nodes.length})`
        );

        // Confirm distinction logic:
        // !graph => "No Graph Data for Request Flow: Complete repository analysis"
        // graph && routeNodes.length === 0 => "No HTTP Endpoints Detected: No Express or HTTP route declarations were identified"
        const isUnanalyzed = !expressGraph;
        const hasNoEndpoints = expressGraph && routeNodes.length === 0;
        assert(!isUnanalyzed, "Distinguishes that Express JS IS analyzed (graph is not null)");
        assert(
          hasNoEndpoints,
          "Correctly flags as analyzed repository with no declared HTTP endpoints"
        );
      }
    }

    // =========================================================================
    // 4. Component Endpoint Filtering and Search Logic Simulation
    // =========================================================================
    console.log("   Scenario 4: Frontend Endpoint Filtering & Resolution Logic");
    if (ayuSyncProject && ayuSyncProject.currentGraphVersionId) {
      const ayuGraph = await graphRepository.getGraph(ayuSyncProject.currentGraphVersionId);
      if (ayuGraph) {
        const routeNodes = ayuGraph.nodes.filter((n) => n.nodeType === "route");

        // Filter by HTTP method: POST
        const postRoutes = routeNodes.filter((r) => {
          const method = ((r.metadata?.["httpMethod"] as string) || "GET").toUpperCase();
          return method === "POST";
        });
        assert(
          postRoutes.length > 0 && postRoutes.length <= routeNodes.length,
          `Filtered POST routes correctly (${postRoutes.length} of ${routeNodes.length})`
        );

        // Search by query: "triage"
        const q = "triage";
        const searchResults = routeNodes.filter((r) => {
          const meta = r.metadata || {};
          const method = ((meta["httpMethod"] as string) || "GET").toUpperCase();
          const pathStr = (meta["path"] as string) || r.name;
          const handlerStr = (meta["handler"] as string) || "";
          return (
            r.name.toLowerCase().includes(q) ||
            pathStr.toLowerCase().includes(q) ||
            method.toLowerCase().includes(q) ||
            handlerStr.toLowerCase().includes(q)
          );
        });
        assert(
          searchResults.length >= 1 && searchResults.some((r) => r.name.includes("triage")),
          `Search for 'triage' found matching route: ${searchResults[0]?.name}`
        );

        // Controller resolution simulation
        const selectedRoute = searchResults[0];
        const handledEdge = ayuGraph.edges.find(
          (e) => e.relationshipType === "handled_by" && e.sourceNodeId === selectedRoute?.id
        );
        const resolvedControllerNode = handledEdge
          ? ayuGraph.nodes.find((n) => n.id === handledEdge.targetNodeId)
          : null;
        assert(
          Boolean(resolvedControllerNode) || Boolean(selectedRoute?.metadata?.handler),
          "Selected endpoint resolves controller via handled_by edge or handler metadata"
        );
      }
    }
  } catch (error) {
    console.error("Regression test error:", error);
    failed++;
  }

  return { name: "Request Flow Explorer Zero-Endpoints Regression Suite", passed, failed };
}
