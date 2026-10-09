import type { EntityType, RelationshipType } from "../parsers/types.js";

export interface GraphNode {
  id: string; // Database ID (UUID)
  entityId: string; // Original parser entity ID
  graphVersionId?: string;
  nodeType: EntityType | string;
  name: string;
  metadata: Record<string, unknown>;
  createdAt?: Date;
}

export interface GraphEdge {
  id: string; // Database ID (UUID)
  graphVersionId?: string;
  sourceNodeId: string; // Foreign key referencing GraphNode.id
  targetNodeId: string; // Foreign key referencing GraphNode.id
  relationshipType: RelationshipType | string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface GraphValidationResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
  stats: {
    totalEntitiesInput: number;
    totalRelationshipsInput: number;
    nodesDeduplicated: number;
    edgesFiltered: number;
    orphanEdgesDropped: number;
    routesWithoutModuleAssigned: number;
  };
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodeTypeCounts: Record<string, number>;
  edgeTypeCounts: Record<string, number>;
  modulesCount: number;
  routesCount: number;
  modelsCount: number;
  servicesCount: number;
  componentsCount: number;
  docsCount: number;
}

export interface ProjectGraphResponse {
  version: {
    id: string;
    versionNumber: number;
    analysisTimestamp: Date;
    gitCommitHash: string | null;
    repositoryBranch: string | null;
    parserVersion: string | null;
  };
  nodes: Array<GraphNode & { incomingCount: number; outgoingCount: number }>;
  edges: GraphEdge[];
  stats: GraphStats;
}

export interface ModuleSummaryItem {
  id: string;
  name: string;
  entityId: string;
  routesCount: number;
  modelsCount: number;
  servicesCount: number;
  componentsCount: number;
  docsCount: number;
  routes: Array<{
    id: string;
    name: string;
    method?: string | undefined;
    path?: string | undefined;
  }>;
  models: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
  components: Array<{ id: string; name: string }>;
  docs: Array<{ id: string; name: string; filePath?: string | undefined }>;
}

export interface ModuleDetailResponse {
  module: ModuleSummaryItem;
  nodes: GraphNode[];
  edges: GraphEdge[];
  connectedModules: {
    inbound: Array<{ moduleId: string; moduleName: string; relationship: string }>;
    outbound: Array<{ moduleId: string; moduleName: string; relationship: string }>;
  };
}

export interface GraphVersionSummary {
  id: string;
  projectId: string;
  versionNumber: number;
  analysisTimestamp: Date;
  gitCommitHash: string | null;
  repositoryBranch: string | null;
  parserVersion: string | null;
  nodesCount: number;
  edgesCount: number;
  createdAt: Date;
}
