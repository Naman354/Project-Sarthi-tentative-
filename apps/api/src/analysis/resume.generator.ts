import type { ProjectGraphResponse, ModuleSummaryItem } from "../graph/types.js";
import type {
  ProjectHealthReport,
  AnalysisInsight,
  ResumeSessionBriefing,
  NavigationRecommendation,
} from "./types.js";

export class ResumeGenerator {
  generate(
    currentGraph: ProjectGraphResponse,
    previousGraph: ProjectGraphResponse | null,
    modules: ModuleSummaryItem[],
    health: ProjectHealthReport,
    insights: AnalysisInsight[],
    lastAnalysisDate: Date | null
  ): ResumeSessionBriefing {
    // 1. Calculate Human Readable Time Since Last Analysis
    let timeSinceLastAnalysis = "Initial analysis session";
    if (lastAnalysisDate) {
      const now = Date.now();
      const diffMs = Math.max(0, now - new Date(lastAnalysisDate).getTime());
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 2) {
        timeSinceLastAnalysis = "Just now";
      } else if (diffMinutes < 60) {
        timeSinceLastAnalysis = `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
      } else if (diffHours < 24) {
        timeSinceLastAnalysis = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      } else {
        timeSinceLastAnalysis = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
      }
    }

    // 2. Diff between Previous and Current Graph Versions
    let nodesAdded = 0;
    let nodesRemoved = 0;
    let edgesAdded = 0;
    let edgesRemoved = 0;
    const modifiedModules: string[] = [];

    if (previousGraph) {
      const prevNodeNames = new Set(previousGraph.nodes.map((n) => `${n.nodeType}:${n.name}`));
      const currNodeNames = new Set(currentGraph.nodes.map((n) => `${n.nodeType}:${n.name}`));

      for (const n of currentGraph.nodes) {
        if (!prevNodeNames.has(`${n.nodeType}:${n.name}`)) {
          nodesAdded++;
        }
      }
      for (const n of previousGraph.nodes) {
        if (!currNodeNames.has(`${n.nodeType}:${n.name}`)) {
          nodesRemoved++;
        }
      }

      edgesAdded = Math.max(0, currentGraph.edges.length - previousGraph.edges.length);
      edgesRemoved = Math.max(0, previousGraph.edges.length - currentGraph.edges.length);

      // Track modules with changing route counts
      const prevModuleMap = new Map(
        previousGraph.nodes.filter((n) => n.nodeType === "module").map((m) => [m.name, m])
      );

      for (const mod of modules) {
        const prevMod = prevModuleMap.get(mod.name);
        if (!prevMod || mod.routesCount > 0) {
          modifiedModules.push(mod.name);
        }
      }
    } else {
      nodesAdded = currentGraph.nodes.length;
      edgesAdded = currentGraph.edges.length;
      modifiedModules.push(...modules.map((m) => m.name));
    }

    // 3. Navigation Recommendations
    const recommendations: NavigationRecommendation[] = [];

    // Most complex / largest module
    const sortedBySize = [...modules].sort(
      (a, b) => b.routesCount + b.componentsCount - (a.routesCount + a.componentsCount)
    );
    if (sortedBySize[0]) {
      recommendations.push({
        title: `Core Module: ${sortedBySize[0].name}`,
        targetModule: sortedBySize[0].name,
        reason: `Contains the highest volume of endpoints (${sortedBySize[0].routesCount} routes) and components (${sortedBySize[0].componentsCount}).`,
        priority: "high",
      });
    }

    // Module with highest risk or insights
    const riskInsight = insights.find((i) => i.severity === "high" || i.severity === "critical");
    if (riskInsight && riskInsight.relatedModule) {
      recommendations.push({
        title: `Attention Needed: ${riskInsight.relatedModule}`,
        targetModule: riskInsight.relatedModule,
        reason: riskInsight.title,
        priority: "high",
      });
    }

    // Least documented module
    const leastDocumented = modules.find((m) => m.docsCount === 0 && m.routesCount > 0);
    if (leastDocumented && leastDocumented.name !== sortedBySize[0]?.name) {
      recommendations.push({
        title: `Documentation Gap: ${leastDocumented.name}`,
        targetModule: leastDocumented.name,
        reason: "Has active API routes but no accompanying markdown documentation.",
        priority: "medium",
      });
    }

    // 4. Suggested Starting Point
    let suggestedModule = modules[0]?.name || "Core";
    let rationale = "Explore foundational module to understand the primary application workflow.";

    const firstRec = recommendations[0];
    if (firstRec) {
      suggestedModule = firstRec.targetModule;
      rationale = firstRec.reason;
    }

    const keyRisks = insights
      .filter((i) => i.severity === "high" || i.severity === "critical")
      .map((i) => `${i.title}: ${i.description}`)
      .slice(0, 4);

    return {
      lastAnalyzed: lastAnalysisDate,
      timeSinceLastAnalysis,
      hasPreviousVersion: Boolean(previousGraph),
      previousVersionNumber: previousGraph?.version.versionNumber,
      currentVersionNumber: currentGraph.version.versionNumber,
      changesSummary: {
        nodesAdded,
        nodesRemoved,
        edgesAdded,
        edgesRemoved,
        modifiedModules: Array.from(new Set(modifiedModules)),
      },
      suggestedStartingPoint: {
        moduleName: suggestedModule,
        rationale,
      },
      navigationRecommendations: recommendations,
      keyRisks,
    };
  }
}

export const resumeGenerator = new ResumeGenerator();
