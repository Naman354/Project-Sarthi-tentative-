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
}
