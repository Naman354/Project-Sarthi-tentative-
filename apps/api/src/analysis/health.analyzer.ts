import type { ProjectGraphResponse, ModuleSummaryItem } from "../graph/types.js";
import type { AnalysisHealthMetric, ProjectHealthReport, HealthStatus } from "./types.js";

export class HealthAnalyzer {
  analyze(graph: ProjectGraphResponse, modules: ModuleSummaryItem[]): ProjectHealthReport {
    const { nodes, edges } = graph;

    // 1. Documentation Coverage
    const docNodes = nodes.filter((n) => n.nodeType === "doc");
    const routeNodes = nodes.filter((n) => n.nodeType === "route");
    const moduleNodes = nodes.filter((n) => n.nodeType === "module");

    // Check which modules/routes have documentation
    const documentedModuleNames = new Set<string>();
    for (const d of docNodes) {
      const name = d.name.toLowerCase();
      for (const m of moduleNodes) {
        if (name.includes(m.name.toLowerCase()) || name.includes("readme")) {
          documentedModuleNames.add(m.id);
        }
      }
    }

    const totalKeyEntities = moduleNodes.length + routeNodes.length;
    let docCoverageValue = 100;
    if (totalKeyEntities > 0) {
      const documentedCount = documentedModuleNames.size + (docNodes.length > 0 ? 1 : 0);
      docCoverageValue = Math.min(
        100,
        Math.round((documentedCount / Math.max(1, moduleNodes.length)) * 100)
      );
    }

    const docStatus: HealthStatus =
      docCoverageValue >= 75 ? "healthy" : docCoverageValue >= 40 ? "warning" : "critical";

    const docMetric: AnalysisHealthMetric = {
      name: "Documentation Coverage",
      value: docCoverageValue,
      status: docStatus,
      details: {
        totalDocs: docNodes.length,
        totalModules: moduleNodes.length,
        totalRoutes: routeNodes.length,
        documentedModulesCount: documentedModuleNames.size,
      },
    };

    // 2. Dependency Complexity
    const totalEdges = edges.length;
    const totalNodes = nodes.length;
    const avgDegree = totalNodes > 0 ? Math.round((totalEdges / totalNodes) * 100) / 100 : 0;

    let complexityScore = 100;
    if (avgDegree > 4) {
      complexityScore = Math.max(20, Math.round(100 - (avgDegree - 4) * 15));
    }

    const complexityStatus: HealthStatus =
      complexityScore >= 70 ? "healthy" : complexityScore >= 45 ? "warning" : "critical";

    const complexityMetric: AnalysisHealthMetric = {
      name: "Dependency Complexity",
      value: complexityScore,
      status: complexityStatus,
      details: {
        averageNodeDegree: avgDegree,
        totalRelationships: totalEdges,
      },
    };

    // 3. Module Size & Balance
    const oversizedModules = modules.filter((m) => m.routesCount > 8);
    let sizeScore = 100;
    if (modules.length > 0 && oversizedModules.length > 0) {
      sizeScore = Math.max(30, Math.round(100 - (oversizedModules.length / modules.length) * 60));
    }

    const sizeStatus: HealthStatus =
      sizeScore >= 80 ? "healthy" : sizeScore >= 50 ? "warning" : "critical";

    const sizeMetric: AnalysisHealthMetric = {
      name: "Module Balance & Size",
      value: sizeScore,
      status: sizeStatus,
      details: {
        totalModules: modules.length,
        oversizedCount: oversizedModules.length,
        oversizedModuleNames: oversizedModules.map((m) => m.name),
      },
    };

    // 4. Circular Dependencies (Cycle Detection on Graph Edges)
    const cycles = this.detectCycles(nodes, edges);
    let cycleScore = 100;
    if (cycles.length === 1) {
      cycleScore = 60;
    } else if (cycles.length > 1) {
      cycleScore = Math.max(10, 100 - cycles.length * 30);
    }

    const cycleStatus: HealthStatus =
      cycles.length === 0 ? "healthy" : cycles.length === 1 ? "warning" : "critical";

    const cycleMetric: AnalysisHealthMetric = {
      name: "Circular Dependencies",
      value: cycleScore,
      status: cycleStatus,
      details: {
        cyclesDetected: cycles.length,
        cyclesPaths: cycles.slice(0, 5), // top 5 detected cycles
      },
    };

    // 5. Component & Route Connectivity (Orphan Detection)
    const connectedNodeIds = new Set<string>();
    for (const e of edges) {
      connectedNodeIds.add(e.sourceNodeId);
      connectedNodeIds.add(e.targetNodeId);
    }

    const orphanNodes = nodes.filter((n) => !connectedNodeIds.has(n.id) && n.nodeType !== "doc");
    let connectivityScore = 100;
    if (totalNodes > 0 && orphanNodes.length > 0) {
      connectivityScore = Math.max(
        20,
        Math.round(((totalNodes - orphanNodes.length) / totalNodes) * 100)
      );
    }

    const connectivityStatus: HealthStatus =
      connectivityScore >= 85 ? "healthy" : connectivityScore >= 60 ? "warning" : "critical";

    const connectivityMetric: AnalysisHealthMetric = {
      name: "Architecture Connectivity",
      value: connectivityScore,
      status: connectivityStatus,
      details: {
        orphanEntitiesCount: orphanNodes.length,
        orphanNodeNames: orphanNodes.slice(0, 5).map((n) => n.name),
      },
    };

    // Compute Weighted Overall Score
    const metrics = [docMetric, complexityMetric, sizeMetric, cycleMetric, connectivityMetric];
    const overallScore = Math.round(
      metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length
    );

    const overallStatus: HealthStatus =
      overallScore >= 80 ? "healthy" : overallScore >= 55 ? "warning" : "critical";

    return {
      overallScore,
      status: overallStatus,
      metrics,
      evaluatedAt: new Date(),
    };
  }

  private detectCycles(
    nodes: ProjectGraphResponse["nodes"],
    edges: ProjectGraphResponse["edges"]
  ): string[][] {
    const adj = new Map<string, string[]>();
    const nodeNameMap = new Map<string, string>();

    for (const node of nodes) {
      adj.set(node.id, []);
      nodeNameMap.set(node.id, node.name);
    }

    // Exclude 'contains' hierarchical edges so we detect semantic dependency cycles (uses, queries, calls)
    for (const edge of edges) {
      if (edge.relationshipType !== "contains") {
        adj.get(edge.sourceNodeId)?.push(edge.targetNodeId);
      }
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (curr: string, path: string[]) => {
      visited.add(curr);
      recursionStack.add(curr);
      path.push(curr);

      const neighbors = adj.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          dfs(next, path);
        } else if (recursionStack.has(next)) {
          // Cycle found
          const cycleStartIndex = path.indexOf(next);
          if (cycleStartIndex !== -1) {
            const cyclePath = path.slice(cycleStartIndex).map((id) => nodeNameMap.get(id) || id);
            cyclePath.push(nodeNameMap.get(next) || next);
            cycles.push(cyclePath);
          }
        }
      }

      path.pop();
      recursionStack.delete(curr);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return cycles;
  }
}

export const healthAnalyzer = new HealthAnalyzer();
