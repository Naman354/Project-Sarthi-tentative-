export type EvidenceStatus =
  "documented" | "implementation_found" | "test_found" | "inferred" | "unresolved";

export interface EvidenceRecord {
  id: string;
  type: "documentation" | "manifest" | "source" | "parser_entity" | "test" | "config";
  filePath: string;
  startLine?: number;
  endLine?: number;
  description: string;
  snippet?: string;
  url?: string;
}

export interface ProjectCapability {
  id: string;
  name: string;
  description: string;
  evidenceStatus: EvidenceStatus;
  evidenceIds: string[];
  primaryFiles: string[];
}

export type ProjectCategory =
  "web-application" | "backend-system" | "cli-tool" | "library-framework" | "data-ml" | "universal";

export interface StructuralFact {
  label: string;
  value: string;
  detail?: string;
}

export interface ConceptualArea {
  id: string;
  name: string;
  role: string;
  evidenceIds: string[];
  associatedFiles: string[];
  category?:
    "frontend" | "api" | "service" | "data" | "cli" | "core" | "pipeline" | "config" | "external";
  nextStep?: string;
}

export interface ConceptualRelationship {
  fromAreaId: string;
  toAreaId: string;
  label: string;
  evidenceIds: string[];
}

export interface GuidedTourStep {
  step: number;
  title: string;
  description: string;
  targetFile?: string;
}

export interface TechnicalOverview {
  primaryLanguage: string;
  ecosystem: string;
  dependencies: string[];
  scripts: string[];
  entryPoints: string[];
  totalFiles: number;
  totalDirectories: number;
  projectCategory?: ProjectCategory;
  categoryConfidence?: "high" | "medium" | "inferred";
  categoryRationale?: string;
  detectedFrameworks?: string[];
  detectedTools?: string[];
  structuralFacts?: StructuralFact[];
}

export interface ProjectBrief {
  purpose: string;
  intendedAudience: string | null;
  capabilities: ProjectCapability[];
  conceptualMap: {
    areas: ConceptualArea[];
    relationships: ConceptualRelationship[];
  };
  guidedTour: GuidedTourStep[];
  technicalOverview: TechnicalOverview;
  limitationsAndGaps: string[];
  generatedBy: "groq" | "deterministic-fallback";
  modelUsed?: string;
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
  repoUrl: string;
  owner: string;
  repo: string;
  generatedAt: string;
  cached: boolean;
}

export interface EvidenceSummary {
  totalEvidenceRecords: number;
  languages: Array<{ language: string; fileCount: number; percentage: number }>;
  projectTypes: string[];
  totalFiles: number;
  totalDirectories: number;
  parserCoverage: "specialized-ast-graph" | "universal-baseline";
}

export interface ExploreResponse {
  brief: ProjectBrief;
  evidenceSummary: EvidenceSummary;
}

export interface RecentRepositoryItem {
  repoUrl: string;
  owner: string;
  repo: string;
  commitSha: string;
  purpose: string;
  primaryLanguage: string;
  analyzedAt: string;
}
