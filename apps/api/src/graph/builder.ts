import type { ParserManagerResult } from "../parsers/types.js";
import { graphValidator, type GraphValidator } from "./validator.js";
import type { GraphNode, GraphEdge, GraphStats, GraphValidationResult } from "./types.js";

export interface BuildGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
  stats: GraphStats;
  validationStats: GraphValidationResult["stats"];
}

export class GraphBuilder {
  constructor(private readonly validator: GraphValidator = graphValidator) {}

  build(parseResult: ParserManagerResult): BuildGraphResult {
    const { entities, relationships } = parseResult;

    // Run graph validation pipeline (deduplication, route grouping, edge integrity)
    const validation = this.validator.validate(entities, relationships);

    // Compute comprehensive node & edge stats
    const nodeTypeCounts: Record<string, number> = {};
    for (const node of validation.nodes) {
      nodeTypeCounts[node.nodeType] = (nodeTypeCounts[node.nodeType] || 0) + 1;
    }

    const edgeTypeCounts: Record<string, number> = {};
    for (const edge of validation.edges) {
      edgeTypeCounts[edge.relationshipType] = (edgeTypeCounts[edge.relationshipType] || 0) + 1;
    }

    const stats: GraphStats = {
      totalNodes: validation.nodes.length,
      totalEdges: validation.edges.length,
      nodeTypeCounts,
      edgeTypeCounts,
      modulesCount: nodeTypeCounts["module"] || 0,
      routesCount: nodeTypeCounts["route"] || 0,
      modelsCount: nodeTypeCounts["model"] || 0,
      servicesCount: nodeTypeCounts["service"] || 0,
      componentsCount: (nodeTypeCounts["component"] || 0) + (nodeTypeCounts["page"] || 0),
      docsCount: nodeTypeCounts["doc"] || 0,
    };

    return {
      nodes: validation.nodes,
      edges: validation.edges,
      warnings: [...validation.warnings, ...parseResult.warnings],
      stats,
      validationStats: validation.stats,
    };
  }
}

export const graphBuilder = new GraphBuilder();
