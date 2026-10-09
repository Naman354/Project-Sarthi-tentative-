import { randomUUID } from "node:crypto";
import type { NormalizedEntity, NormalizedRelationship } from "../parsers/types.js";
import type { GraphNode, GraphEdge, GraphValidationResult } from "./types.js";

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
    // Map of normalized key (type + lowercase name) -> GraphNode
    const keyToNode = new Map<string, GraphNode>();

    for (const entity of entities) {
      const compositeKey = `${entity.type}:${entity.name.trim().toLowerCase()}`;

      let existingNode = entityIdToNode.get(entity.id);
      if (!existingNode) {
        existingNode = keyToNode.get(compositeKey);
      }

      if (existingNode) {
        // Duplicate found: merge metadata and alias entity.id
        nodesDeduplicated++;
        existingNode.metadata = {
          ...existingNode.metadata,
          ...entity.metadata,
        };
        entityIdToNode.set(entity.id, existingNode);
      } else {
        const node: GraphNode = {
          id: randomUUID(),
          entityId: entity.id,
          nodeType: entity.type,
          name: entity.name.trim(),
          metadata: {
            filePath: entity.filePath,
            ...entity.metadata,
          },
        };
        entityIdToNode.set(entity.id, node);
        keyToNode.set(compositeKey, node);
      }
    }

    // 2. Route-Based Module Verification
    // TDD Requirement: Every route should belong to a module via a 'contains' relationship
    const routeNodes = Array.from(new Set(entityIdToNode.values())).filter(
      (n) => n.nodeType === "route"
    );

    // Track which routes are contained by modules
    const containedRouteIds = new Set<string>();
    for (const rel of relationships) {
      if (rel.type === "contains") {
        const targetNode = entityIdToNode.get(rel.targetId);
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
      const sourceNode = entityIdToNode.get(rel.sourceId);
      const targetNode = entityIdToNode.get(rel.targetId);

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
