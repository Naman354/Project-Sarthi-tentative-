import { randomUUID } from "node:crypto";
import prisma from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import type {
  GraphNode,
  GraphEdge,
  ProjectGraphResponse,
  GraphStats,
  ModuleSummaryItem,
  ModuleDetailResponse,
  GraphVersionSummary,
} from "../graph/types.js";
import type { SourceLocation } from "../parsers/types.js";

export interface PersistGraphMeta {
  gitCommitHash?: string | null | undefined;
  repositoryBranch?: string | null | undefined;
  parserVersion?: string | null | undefined;
}

export interface NodeMetadata {
  entityId?: string;
  originalEntityId?: string;
  filePath?: string;
  method?: string;
  path?: string;
  location?: SourceLocation | null;
  [key: string]: unknown;
}

function parseNodeMetadata(metadata: Prisma.JsonValue | null): NodeMetadata {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as NodeMetadata;
  }
  return {};
}

export class GraphRepository {
  async persistGraph(
    projectId: string,
    meta: PersistGraphMeta,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Determine next version number
      const latest = await tx.graphVersion.findFirst({
        where: { projectId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const nextVersionNumber = (latest?.versionNumber || 0) + 1;

      // 2. Create GraphVersion record
      const graphVersion = await tx.graphVersion.create({
        data: {
          projectId,
          versionNumber: nextVersionNumber,
          gitCommitHash: meta.gitCommitHash || null,
          repositoryBranch: meta.repositoryBranch || null,
          parserVersion: meta.parserVersion || null,
        },
      });

      // 3. Map nodes to new UUIDs for this specific GraphVersion
      const idMap = new Map<string, string>();
      const versionNodes = nodes.map((node) => {
        const newId = randomUUID();
        idMap.set(node.id, newId);
        const metaObj = (node.metadata || {}) as Record<string, unknown>;
        return {
          id: newId,
          graphVersionId: graphVersion.id,
          nodeType: node.nodeType,
          name: node.name,
          metadata: {
            ...metaObj,
            originalEntityId: node.entityId,
            ...(node.location ? { location: node.location as unknown as Prisma.InputJsonValue } : {}),
          } as Prisma.InputJsonObject,
        };
      });

      if (versionNodes.length > 0) {
        await tx.node.createMany({
          data: versionNodes,
        });
      }

      // 4. Map edges to match the new node UUIDs
      const versionEdges = edges.map((edge) => ({
        id: randomUUID(),
        graphVersionId: graphVersion.id,
        sourceNodeId: idMap.get(edge.sourceNodeId) || edge.sourceNodeId,
        targetNodeId: idMap.get(edge.targetNodeId) || edge.targetNodeId,
        relationshipType: edge.relationshipType,
      }));

      if (versionEdges.length > 0) {
        await tx.edge.createMany({
          data: versionEdges,
        });
      }

      // 5. Update Project's currentGraphVersionId
      await tx.project.update({
        where: { id: projectId },
        data: { currentGraphVersionId: graphVersion.id },
      });

      return graphVersion;
    });
  }

  async findLatestVersion(projectId: string) {
    return prisma.graphVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: "desc" },
    });
  }

  async findVersionById(versionId: string, projectId: string) {
    return prisma.graphVersion.findFirst({
      where: {
        id: versionId,
        projectId,
      },
    });
  }

  async listVersions(projectId: string): Promise<GraphVersionSummary[]> {
    const versions = await prisma.graphVersion.findMany({
      where: { projectId },
      orderBy: { versionNumber: "desc" },
      include: {
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      projectId: v.projectId,
      versionNumber: v.versionNumber,
      analysisTimestamp: v.analysisTimestamp,
      gitCommitHash: v.gitCommitHash,
      repositoryBranch: v.repositoryBranch,
      parserVersion: v.parserVersion,
      nodesCount: v._count.nodes,
      edgesCount: v._count.edges,
      createdAt: v.createdAt,
    }));
  }

  async getGraph(graphVersionId: string): Promise<ProjectGraphResponse | null> {
    const version = await prisma.graphVersion.findUnique({
      where: { id: graphVersionId },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!version) {
      return null;
    }

    // Compute incoming/outgoing counts per node
    const incomingMap = new Map<string, number>();
    const outgoingMap = new Map<string, number>();
    const edgeTypeCounts: Record<string, number> = {};

    for (const edge of version.edges) {
      outgoingMap.set(edge.sourceNodeId, (outgoingMap.get(edge.sourceNodeId) || 0) + 1);
      incomingMap.set(edge.targetNodeId, (incomingMap.get(edge.targetNodeId) || 0) + 1);
    }

    const nodeTypeCounts: Record<string, number> = {};
    const formattedNodes = version.nodes.map((node) => {
      nodeTypeCounts[node.nodeType] = (nodeTypeCounts[node.nodeType] || 0) + 1;
      const meta = parseNodeMetadata(node.metadata);
      const loc = (meta.location as SourceLocation | undefined) ?? null;
      return {
        id: node.id,
        entityId: meta.entityId ?? meta.originalEntityId ?? node.id,
        graphVersionId: node.graphVersionId,
        nodeType: node.nodeType,
        name: node.name,
        location: loc,
        metadata: meta,
        incomingCount: incomingMap.get(node.id) || 0,
        outgoingCount: outgoingMap.get(node.id) || 0,
        createdAt: node.createdAt,
      };
    });

    const formattedEdges: GraphEdge[] = version.edges.map((edge) => ({
      id: edge.id,
      graphVersionId: edge.graphVersionId,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      relationshipType: edge.relationshipType,
      createdAt: edge.createdAt,
    }));

    const stats: GraphStats = {
      totalNodes: formattedNodes.length,
      totalEdges: formattedEdges.length,
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
      version: {
        id: version.id,
        versionNumber: version.versionNumber,
        analysisTimestamp: version.analysisTimestamp,
        gitCommitHash: version.gitCommitHash,
        repositoryBranch: version.repositoryBranch,
        parserVersion: version.parserVersion,
      },
      nodes: formattedNodes,
      edges: formattedEdges,
      stats,
    };
  }

  async getModules(graphVersionId: string): Promise<ModuleSummaryItem[]> {
    const nodes = await prisma.node.findMany({
      where: { graphVersionId },
    });

    const edges = await prisma.edge.findMany({
      where: { graphVersionId },
    });

    const nodeMap = new Map<string, (typeof nodes)[0]>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const moduleNodes = nodes.filter((n) => n.nodeType === "module");

    // Group items contained by each module
    const moduleToContainedNodes = new Map<string, (typeof nodes)[0][]>();
    for (const mod of moduleNodes) {
      moduleToContainedNodes.set(mod.id, []);
    }

    for (const edge of edges) {
      if (edge.relationshipType === "contains" && moduleToContainedNodes.has(edge.sourceNodeId)) {
        const target = nodeMap.get(edge.targetNodeId);
        if (target) {
          moduleToContainedNodes.get(edge.sourceNodeId)?.push(target);
        }
      }
    }

    return moduleNodes.map((mod) => {
      const contained = moduleToContainedNodes.get(mod.id) || [];

      const routes = contained
        .filter((n) => n.nodeType === "route")
        .map((n) => {
          const meta = parseNodeMetadata(n.metadata);
          return {
            id: n.id,
            name: n.name,
            ...(meta.method ? { method: meta.method } : {}),
            ...(meta.path ? { path: meta.path } : {}),
          };
        });

      const models = contained
        .filter((n) => n.nodeType === "model")
        .map((n) => ({ id: n.id, name: n.name }));

      const services = contained
        .filter((n) => n.nodeType === "service" || n.nodeType === "controller")
        .map((n) => ({ id: n.id, name: n.name }));

      const components = contained
        .filter((n) => n.nodeType === "component" || n.nodeType === "page")
        .map((n) => ({ id: n.id, name: n.name }));

      const docs = contained
        .filter((n) => n.nodeType === "doc")
        .map((n) => {
          const meta = parseNodeMetadata(n.metadata);
          return {
            id: n.id,
            name: n.name,
            ...(meta.filePath ? { filePath: meta.filePath } : {}),
          };
        });

      const modMeta = parseNodeMetadata(mod.metadata);

      return {
        id: mod.id,
        name: mod.name,
        entityId: modMeta.entityId ?? modMeta.originalEntityId ?? mod.id,
        routesCount: routes.length,
        modelsCount: models.length,
        servicesCount: services.length,
        componentsCount: components.length,
        docsCount: docs.length,
        routes,
        models,
        services,
        components,
        docs,
      };
    });
  }

  async getModuleDetails(
    graphVersionId: string,
    moduleId: string
  ): Promise<ModuleDetailResponse | null> {
    const modules = await this.getModules(graphVersionId);
    const targetModule = modules.find(
      (m) => m.id === moduleId || m.name.toLowerCase() === moduleId.toLowerCase()
    );

    if (!targetModule) {
      return null;
    }

    const version = await prisma.graphVersion.findUnique({
      where: { id: graphVersionId },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!version) {
      return null;
    }

    const nodeMap = new Map<string, (typeof version.nodes)[0]>();
    for (const node of version.nodes) {
      nodeMap.set(node.id, node);
    }

    // Collect all nodes directly in this module or connected
    const memberNodeIds = new Set<string>([targetModule.id]);
    for (const r of targetModule.routes) memberNodeIds.add(r.id);
    for (const m of targetModule.models) memberNodeIds.add(m.id);
    for (const s of targetModule.services) memberNodeIds.add(s.id);
    for (const c of targetModule.components) memberNodeIds.add(c.id);
    for (const d of targetModule.docs) memberNodeIds.add(d.id);

    // Also include any controller/service connected to routes
    for (const edge of version.edges) {
      if (memberNodeIds.has(edge.sourceNodeId)) {
        memberNodeIds.add(edge.targetNodeId);
      }
    }

    const moduleSubNodes: GraphNode[] = [];
    for (const id of memberNodeIds) {
      const node = nodeMap.get(id);
      if (node) {
        const meta = parseNodeMetadata(node.metadata);
        moduleSubNodes.push({
          id: node.id,
          entityId: meta.entityId ?? meta.originalEntityId ?? node.id,
          graphVersionId: node.graphVersionId,
          nodeType: node.nodeType,
          name: node.name,
          location: (meta.location as SourceLocation | undefined) ?? null,
          metadata: meta,
          createdAt: node.createdAt,
        });
      }
    }

    const moduleSubEdges: GraphEdge[] = version.edges
      .filter((e) => memberNodeIds.has(e.sourceNodeId) && memberNodeIds.has(e.targetNodeId))
      .map((e) => ({
        id: e.id,
        graphVersionId: e.graphVersionId,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        relationshipType: e.relationshipType,
        createdAt: e.createdAt,
      }));

    // Find cross-module connections
    const inbound: Array<{ moduleId: string; moduleName: string; relationship: string }> = [];
    const outbound: Array<{ moduleId: string; moduleName: string; relationship: string }> = [];

    for (const edge of version.edges) {
      if (memberNodeIds.has(edge.sourceNodeId) && !memberNodeIds.has(edge.targetNodeId)) {
        const ext = nodeMap.get(edge.targetNodeId);
        if (ext) {
          outbound.push({
            moduleId: ext.id,
            moduleName: ext.name,
            relationship: edge.relationshipType,
          });
        }
      }
      if (!memberNodeIds.has(edge.sourceNodeId) && memberNodeIds.has(edge.targetNodeId)) {
        const ext = nodeMap.get(edge.sourceNodeId);
        if (ext) {
          inbound.push({
            moduleId: ext.id,
            moduleName: ext.name,
            relationship: edge.relationshipType,
          });
        }
      }
    }

    return {
      module: targetModule,
      nodes: moduleSubNodes,
      edges: moduleSubEdges,
      connectedModules: {
        inbound,
        outbound,
      },
    };
  }
}

export const graphRepository = new GraphRepository();
