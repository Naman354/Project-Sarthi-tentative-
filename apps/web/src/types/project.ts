export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  githubUrl: string;
  defaultBranch: string;
  framework: string | null;
  language: string | null;
  lastAnalysis: string | null;
  currentGraphVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  githubUrl: string;
  description?: string;
  defaultBranch?: string;
}

export interface Analysis {
  id: string;
  projectId: string;
  graphVersionId: string | null;
  analysisDuration: number | null;
  parserVersion: string | null;
  status: "pending" | "in_progress" | "completed" | "failed";
  summary: string | null;
  createdAt: string;
}

export interface RepositoryMetadata {
  branch: string;
  commitHash: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  fileCount: number;
  directoryCount: number;
  totalSizeBytes: number;
  detectedLanguage: string | null;
  detectedFramework: string | null;
  topLevelEntries: string[];
}

export type EntityType =
  "module" | "route" | "controller" | "service" | "model" | "component" | "page" | "doc";

export interface NormalizedEntity {
  id: string;
  type: EntityType;
  name: string;
  filePath: string;
  metadata: Record<string, unknown>;
}

export interface NormalizedRelationship {
  sourceId: string;
  targetId: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface ParserStats {
  totalEntities: number;
  totalRelationships: number;
  modulesCount: number;
  routesCount: number;
  modelsCount: number;
  componentsCount: number;
  docsCount: number;
  durationMs: number;
}

export interface ParserManagerResult {
  technologies: {
    technologies: string[];
    details: Record<string, boolean | string>;
  };
  entities: NormalizedEntity[];
  relationships: NormalizedRelationship[];
  warnings: string[];
  stats: ParserStats;
}

export interface ProjectStatusData {
  project: Project;
  latestAnalysis: Analysis | null;
  isCloned: boolean;
  metadata: RepositoryMetadata | null;
  parseResult?: ParserManagerResult | null;
}

export interface AnalyzeResultData {
  project: Project;
  analysis: Analysis;
  metadata: RepositoryMetadata;
  parseResult?: ParserManagerResult;
  graphVersion?: {
    id: string;
    versionNumber: number;
    analysisTimestamp: string;
    gitCommitHash: string | null;
    repositoryBranch: string | null;
  };
}

export interface GraphNode {
  id: string;
  entityId: string;
  graphVersionId?: string;
  nodeType: EntityType | string;
  name: string;
  metadata: Record<string, unknown>;
  incomingCount?: number;
  outgoingCount?: number;
}

export interface GraphEdge {
  id: string;
  graphVersionId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
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

export interface ProjectGraph {
  version: {
    id: string;
    versionNumber: number;
    analysisTimestamp: string;
    gitCommitHash: string | null;
    repositoryBranch: string | null;
    parserVersion: string | null;
  };
  nodes: GraphNode[];
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
  routes: Array<{ id: string; name: string; method?: string; path?: string }>;
  models: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
  components: Array<{ id: string; name: string }>;
  docs: Array<{ id: string; name: string; filePath?: string }>;
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
  analysisTimestamp: string;
  gitCommitHash: string | null;
  repositoryBranch: string | null;
  parserVersion: string | null;
  nodesCount: number;
  edgesCount: number;
  createdAt: string;
}

export type InsightSeverity = "low" | "medium" | "high" | "critical";

export interface InsightItem {
  id: string;
  projectId: string;
  analysisId: string | null;
  relatedNodeId: string | null;
  title: string;
  description: string;
  severity: InsightSeverity;
  relatedModule: string | null;
  createdAt: string;
}

export type HealthStatus = "healthy" | "warning" | "critical";

export interface HealthMetricItem {
  id?: string;
  name: string;
  value: number;
  status: HealthStatus;
  details?: Record<string, unknown>;
}

export interface ProjectHealthReport {
  overallScore: number;
  status: HealthStatus;
  metrics: HealthMetricItem[];
  evaluatedAt: string;
}

export interface NavigationRecommendation {
  title: string;
  targetModule: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface ResumeSessionBriefing {
  lastAnalyzed: string | null;
  timeSinceLastAnalysis: string;
  hasPreviousVersion: boolean;
  previousVersionNumber?: number;
  currentVersionNumber: number;
  changesSummary: {
    nodesAdded: number;
    nodesRemoved: number;
    edgesAdded: number;
    edgesRemoved: number;
    modifiedModules: string[];
  };
  suggestedStartingPoint: {
    moduleName: string;
    rationale: string;
  };
  navigationRecommendations: NavigationRecommendation[];
  keyRisks: string[];
}

export interface ProjectOverviewData {
  project: Project;
  latestAnalysis: Analysis | null;
  graphVersion: GraphVersionSummary | null;
  stats: GraphStats | null;
  modules: ModuleSummaryItem[];
  topInsights: Array<{
    title: string;
    description: string;
    severity: InsightSeverity;
    relatedModule?: string;
  }>;
  health: ProjectHealthReport;
}
