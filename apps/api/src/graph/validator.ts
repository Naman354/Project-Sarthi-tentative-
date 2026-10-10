import { randomUUID } from "node:crypto";
import type { NormalizedEntity, NormalizedRelationship, SourceLocation } from "../parsers/types.js";
import type { GraphNode, GraphEdge, GraphValidationResult } from "./types.js";

function getEntityDeduplicationKey(entity: NormalizedEntity): string {
  const normName = entity.name.trim().toLowerCase();
  if (entity.type === "module") {
    return `module:${normName}`;
  }
  const normPath = (entity.filePath || "").replace(/\\/g, "/").toLowerCase();
  if (entity.type === "route") {
    const metaMethod =
      typeof entity.metadata.httpMethod === "string"
        ? entity.metadata.httpMethod.toUpperCase()
        : "";
    const metaPath = typeof entity.metadata.path === "string" ? entity.metadata.path : "";
    if (metaMethod && metaPath) {
      return `route:${normPath}:${metaMethod}:${metaPath.toLowerCase()}`;
    }
  }
  return `${entity.type}:${normPath}:${normName}`;
}

export class GraphValidator {
  validate(
    entities: NormalizedEntity[],
    relationships: NormalizedRelationship[]
  ): GraphValidationResult {
    const warnings: string[] = [];
    let nodesDeduplicated = 0;
    let edgesFiltered = 0;
    let orphanEdgesDropped = 0;
    let routesWithoutModuleAssigned = 0;

    // 1. Entity Deduplication & Node Generation
    // Map of original entityId -> GraphNode
    const entityIdToNode = new Map<string, GraphNode>();
    // Map of normalized composite key -> GraphNode
    const keyToNode = new Map<string, GraphNode>();

    for (const entity of entities) {
      const compositeKey = getEntityDeduplicationKey(entity);

      let existingNode = entityIdToNode.get(entity.id);
      if (!existingNode) {
        existingNode = keyToNode.get(compositeKey);
      }

      if (existingNode) {
        // Duplicate found: merge metadata, preserve location, alias entity.id
        nodesDeduplicated++;
        existingNode.metadata = {
          ...existingNode.metadata,
          ...entity.metadata,
        };
        if (!existingNode.location && entity.location) {
          existingNode.location = {
            filePath: entity.location.filePath || entity.filePath,
            ...entity.location,
          };
        }
        entityIdToNode.set(entity.id, existingNode);
      } else {
        const nodeLocation: SourceLocation | null = entity.location
          ? {
              filePath: entity.location.filePath || entity.filePath,
              ...entity.location,
            }
          : null;
        const node: GraphNode = {
          id: randomUUID(),
          entityId: entity.id,
          nodeType: entity.type,
          name: entity.name.trim(),
          location: nodeLocation,
          metadata: {
            filePath: entity.filePath,
            ...(nodeLocation ? { location: nodeLocation } : {}),
            ...entity.metadata,
          },
        };
        entityIdToNode.set(entity.id, node);
        keyToNode.set(compositeKey, node);
      }
    }

    // Build Resolution Indices for Cross-Plugin Relationship Endpoints
    // 1. Routes by method + path (e.g. GET:/api/users) and by path alone
    const routeByMethodAndPath = new Map<string, GraphNode>();
    const routesByPath = new Map<string, GraphNode[]>();
    // 2. Models by lowercase name
    const modelsByName = new Map<string, GraphNode[]>();
    // 3. Components by lowercase name
    const componentsByName = new Map<string, GraphNode[]>();

    for (const node of entityIdToNode.values()) {
      if (node.nodeType === "route") {
        const meta = node.metadata;
        const method = typeof meta.httpMethod === "string" ? meta.httpMethod.toUpperCase() : "";
        const rawPath = typeof meta.path === "string" ? meta.path : "";
        if (rawPath) {
          const normPath = rawPath.replace(/\/+$/, "") || "/";
          if (method) {
            routeByMethodAndPath.set(`${method}:${normPath}`, node);
            routeByMethodAndPath.set(`${method}:${rawPath}`, node);
          }
          const list = routesByPath.get(normPath) || [];
          list.push(node);
          routesByPath.set(normPath, list);
        }
      } else if (node.nodeType === "model") {
        const nameKey = node.name.toLowerCase();
        const list = modelsByName.get(nameKey) || [];
        list.push(node);
        modelsByName.set(nameKey, list);
      } else if (node.nodeType === "component" || node.nodeType === "page") {
        const nameKey = node.name.toLowerCase();
        const list = componentsByName.get(nameKey) || [];
        list.push(node);
        componentsByName.set(nameKey, list);
      }
    }

    // Endpoint resolver function
    const resolveNode = (id: string): GraphNode | undefined => {
      // Direct lookup by entityId
      const direct = entityIdToNode.get(id);
      if (direct) return direct;

      // Route reference resolution: e.g. "route:GET:/api/users" or "route:/api/users"
      if (id.startsWith("route:")) {
        const rest = id.slice("route:".length);
        const parts = rest.split(":");
        if (parts.length >= 2) {
          const method = parts[0]!.toUpperCase();
          const targetPath = parts.slice(1).join(":");
          const normPath = targetPath.replace(/\/+$/, "") || "/";
          const match =
            routeByMethodAndPath.get(`${method}:${normPath}`) ||
            routeByMethodAndPath.get(`${method}:${targetPath}`);
          if (match) return match;
        } else {
          const targetPath = rest.replace(/\/+$/, "") || "/";
          const matches = routesByPath.get(targetPath);
          if (matches && matches.length === 1) {
            return matches[0];
          }
        }
      }

      // Model reference resolution: e.g. "model:User" or "model:user"
      if (id.startsWith("model:")) {
        const modelName = id.slice("model:".length).toLowerCase();
        const matches = modelsByName.get(modelName);
        if (matches && matches.length === 1) {
          return matches[0];
        }
      }

      // Component reference resolution: e.g. "component:Button"
      if (id.startsWith("component:")) {
        const compName = id.slice("component:".length).toLowerCase();
        const matches = componentsByName.get(compName);
        if (matches && matches.length === 1) {
          return matches[0];
        }
      }

      return undefined;
    };

    // 2. Route-Based Module Verification
    // TDD Requirement: Every route should belong to a module via a 'contains' relationship
    const routeNodes = Array.from(new Set(entityIdToNode.values())).filter(
      (n) => n.nodeType === "route"
    );

    // Track which routes are contained by modules
    const containedRouteIds = new Set<string>();
    for (const rel of relationships) {
      if (rel.type === "contains") {
        const targetNode = resolveNode(rel.targetId);
        if (targetNode && targetNode.nodeType === "route") {
          containedRouteIds.add(targetNode.id);
        }
      }
    }

    // Existing modules lookup
    const moduleNodesByName = new Map<string, GraphNode>();
    for (const node of entityIdToNode.values()) {
      if (node.nodeType === "module") {
        moduleNodesByName.set(node.name.toLowerCase(), node);
      }
    }

    const syntheticRelationships: NormalizedRelationship[] = [];

    for (const routeNode of routeNodes) {
      if (!containedRouteIds.has(routeNode.id)) {
        routesWithoutModuleAssigned++;

        // Determine module name from route path or metadata
        let moduleName = "";
        const pathMeta = (routeNode.metadata.path as string) || "";
        const cleanPath = pathMeta.replace(/^\/+/, "");
        const firstSegment = cleanPath.split(/[/_?-]/)[0];

        if (routeNode.metadata.module && typeof routeNode.metadata.module === "string") {
          moduleName = routeNode.metadata.module;
        } else if (firstSegment && firstSegment.length > 0 && !firstSegment.startsWith(":")) {
          moduleName = firstSegment;
        } else {
          moduleName = "core";
        }

        const normalizedModuleName = moduleName.toLowerCase();
        let moduleNode = moduleNodesByName.get(normalizedModuleName);

        if (!moduleNode) {
          // Create synthetic module node
          const moduleId = `module:${normalizedModuleName}`;
          moduleNode = {
            id: randomUUID(),
            entityId: moduleId,
            nodeType: "module",
            name: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
            location: null,
            metadata: {
              generated: true,
              detectionMethod: "route-based",
            },
          };
          entityIdToNode.set(moduleId, moduleNode);
          moduleNodesByName.set(normalizedModuleName, moduleNode);
          warnings.push(`Auto-generated module node '${moduleNode.name}' for unassigned routes`);
        }

        syntheticRelationships.push({
          sourceId: moduleNode.entityId,
          targetId: routeNode.entityId,
          type: "contains",
          metadata: { autoAssigned: true },
        });

        containedRouteIds.add(routeNode.id);
      }
    }

    // 3. Edge Validation & Orphan Pruning
    const allRelationships = [...relationships, ...syntheticRelationships];
    const validatedEdges: GraphEdge[] = [];
    const edgeKeySet = new Set<string>();

    for (const rel of allRelationships) {
      const sourceNode = resolveNode(rel.sourceId);
      const targetNode = resolveNode(rel.targetId);

      if (!sourceNode || !targetNode) {
        orphanEdgesDropped++;
        warnings.push(
          `Dropped orphan relationship '${rel.type}': source '${rel.sourceId}' or target '${rel.targetId}' not found`
        );
        continue;
      }

      // Check duplicate edge
      const edgeKey = `${sourceNode.id}->${targetNode.id}:${rel.type}`;
      if (edgeKeySet.has(edgeKey)) {
        edgesFiltered++;
        continue;
      }

      edgeKeySet.add(edgeKey);
      validatedEdges.push({
        id: randomUUID(),
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        relationshipType: rel.type,
        metadata: rel.metadata || {},
      });
    }

    const uniqueNodes = Array.from(new Set(entityIdToNode.values()));

    return {
      nodes: uniqueNodes,
      edges: validatedEdges,
      warnings,
      stats: {
        totalEntitiesInput: entities.length,
        totalRelationshipsInput: relationships.length,
        nodesDeduplicated,
        edgesFiltered,
        orphanEdgesDropped,
        routesWithoutModuleAssigned,
      },
    };
  }
}

export const graphValidator = new GraphValidator();
