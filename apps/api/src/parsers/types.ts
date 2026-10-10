export type EntityType =
  "module" | "route" | "controller" | "service" | "model" | "component" | "page" | "doc";

export type RelationshipType =
  "contains" | "handled_by" | "uses" | "queries" | "renders" | "documents";

/**
 * Precise source code position within a file.
 * Line numbers are 1-indexed (the first line in a file is line 1).
 * Column numbers are 0-indexed (the first character on a line is column 0),
 * adhering to standard JavaScript AST (Babel / ESTree / LSP) conventions.
 */
export interface SourceLocation {
  filePath?: string;
  startLine: number;
  startColumn?: number;
  endLine: number;
  endColumn?: number;
}

export interface NormalizedEntity {
  id: string;
  type: EntityType;
  name: string;
  filePath: string;
  location?: SourceLocation | null;
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
