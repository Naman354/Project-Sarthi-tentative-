import type { ProjectGraphResponse, ModuleSummaryItem } from "../graph/types.js";
import type { ProjectHealthReport, AnalysisInsight } from "./types.js";

export class InsightGenerator {
  generate(
    graph: ProjectGraphResponse,
    modules: ModuleSummaryItem[],
    health: ProjectHealthReport
  ): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];
    const { nodes, edges } = graph;

    // 1. Documentation Insights
    const docMetric = health.metrics.find((m) => m.name === "Documentation Coverage");
    if (docMetric && docMetric.value < 60) {
      const docCount = (docMetric.details["totalDocs"] as number) || 0;
      insights.push({
        title: "Documentation Coverage Deficit",
        description: `Project has only ${docCount} documentation files covering ${modules.length} modules (${docMetric.value}% coverage). Key API routes lack accompanying Markdown notes or README references.`,
        severity: docMetric.value < 30 ? "high" : "medium",
        relatedModule: modules[0]?.name,
      });
    }

    // 2. Circular Dependency Insights
    const cycleMetric = health.metrics.find((m) => m.name === "Circular Dependencies");
    const cyclesCount = (cycleMetric?.details["cyclesDetected"] as number) || 0;
    if (cyclesCount > 0) {
      const topCycles = (cycleMetric?.details["cyclesPaths"] as string[][]) || [];
      const firstCycleStr = topCycles[0] ? topCycles[0].join(" -> ") : "Multiple entities";
      insights.push({
        title: "Circular Dependency Detected",
        description: `Identified ${cyclesCount} dependency cycle(s) in the project graph: [${firstCycleStr}]. Circular coupling increases fragility and prevents clean module isolation.`,
        severity: "high",
        relatedModule: modules[0]?.name,
      });
    }

    // 3. High Coupling & Bottleneck Services
    // Count incoming calls to each service/model
    const entityIncomingCount = new Map<string, number>();
    for (const edge of edges) {
      if (edge.relationshipType === "uses" || edge.relationshipType === "queries") {
        entityIncomingCount.set(
          edge.targetNodeId,
          (entityIncomingCount.get(edge.targetNodeId) || 0) + 1
        );
      }
    }

    for (const [nodeId, count] of entityIncomingCount.entries()) {
      if (count >= 4) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          insights.push({
            title: `High Fan-In Dependency: ${node.name}`,
            description: `${node.nodeType === "model" ? "Database model" : "Service"} '${node.name}' is heavily coupled across ${count} endpoints or services. Any breaking schema change here has wide blast radius.`,
            severity: count >= 6 ? "high" : "medium",
            relatedNodeId: node.id,
            relatedModule: (node.metadata["module"] as string) || undefined,
          });
        }
      }
    }

    // 4. Oversized Modules
    for (const mod of modules) {
      if (mod.routesCount > 8) {
        insights.push({
          title: `Oversized Module: ${mod.name}`,
          description: `Module '${mod.name}' contains ${mod.routesCount} routes and ${mod.componentsCount} components. Consider breaking it down into focused sub-modules.`,
          severity: mod.routesCount > 15 ? "high" : "medium",
          relatedModule: mod.name,
        });
      }
    }

    // 5. Orphan / Unconnected Entities
    const connMetric = health.metrics.find((m) => m.name === "Architecture Connectivity");
    const orphanCount = (connMetric?.details["orphanEntitiesCount"] as number) || 0;
    if (orphanCount > 0) {
      const orphanNames = ((connMetric?.details["orphanNodeNames"] as string[]) || []).join(", ");
      insights.push({
        title: "Disconnected Architectural Entities",
        description: `Detected ${orphanCount} entities with no incoming or outgoing relationships in the project graph (${orphanNames}). Verify if these are obsolete or unreferenced.`,
        severity: "low",
        relatedModule: modules[0]?.name,
      });
    }

    // 6. Positive Structural Health Insight
    if (insights.length === 0 || health.overallScore >= 80) {
      insights.push({
        title: "Clean Modular Boundaries",
        description: `Project graph exhibits healthy structural separation. Total ${modules.length} logical modules with an overall architecture score of ${health.overallScore}/100.`,
        severity: "low",
      });
    }

    return insights;
  }
}

export const insightGenerator = new InsightGenerator();
