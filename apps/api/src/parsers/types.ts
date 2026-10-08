export type EntityType =
  "module" | "route" | "controller" | "service" | "model" | "component" | "page" | "doc";

export type RelationshipType =
  "contains" | "handled_by" | "uses" | "queries" | "renders" | "documents";

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
  type: RelationshipType;
  metadata?: Record<string, unknown>;
}

export interface ParsedOutput {
  pluginId: string;
  entities: NormalizedEntity[];
  relationships: NormalizedRelationship[];
  warnings?: string[];
}

export interface TechnologyReport {
  technologies: string[];
  details: Record<string, boolean | string>;
}

export interface ParserPlugin {
  id: string;
  name: string;
  version: string;
  supports(repoPath: string, technologies: Set<string>): Promise<boolean> | boolean;
  collectFiles(repoPath: string): Promise<string[]>;
  parse(repoPath: string, files: string[]): Promise<ParsedOutput>;
}

export interface ParserManagerResult {
  technologies: TechnologyReport;
  entities: NormalizedEntity[];
  relationships: NormalizedRelationship[];
  warnings: string[];
  stats: {
    totalEntities: number;
    totalRelationships: number;
    modulesCount: number;
    routesCount: number;
    modelsCount: number;
    componentsCount: number;
    docsCount: number;
    durationMs: number;
  };
}
