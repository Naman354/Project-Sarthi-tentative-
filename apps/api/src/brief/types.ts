export type EvidenceType =
  "documentation" | "manifest" | "source" | "parser_entity" | "test" | "config";

export interface EvidenceRecord {
  id: string; // e.g. "ev-1", "ev-2"
  type: EvidenceType;
  filePath: string;
  startLine?: number | undefined;
  endLine?: number | undefined;
  description: string;
  snippet?: string | undefined;
  url?: string | undefined; // Resolved GitHub permalink pinned to commit SHA
}

export interface ManifestSummary {
  filePath: string;
  ecosystem: "node" | "python" | "rust" | "go" | "java" | "ruby" | "php" | "other";
  name?: string | undefined;
  version?: string | undefined;
  dependencies: string[];
  devDependencies?: string[] | undefined;
  scripts?: Record<string, string> | undefined;
  entryPoints?: string[] | undefined;
}

export interface LanguageStat {
  language: string;
  fileCount: number;
  percentage: number;
}

export interface RepositoryEvidenceBundle {
  schemaVersion: "1.0.0";
  repoUrl: string;
  owner: string;
  repo: string;
  commitSha: string;
  branch: string;
  analyzedAt: string;
  identity: {
    name: string;
    owner: string;
    description?: string | undefined;
  };
  languages: LanguageStat[];
  projectTypes: string[]; // e.g. ["web-application", "library", "cli-tool"]
  manifests: ManifestSummary[];
  entryPoints: string[];
  structure: {
    totalFiles: number;
    totalDirectories: number;
    topLevelEntries: string[];
    treeSummary: string[];
  };
  documentation: {
    primaryDoc?:
      | {
          filePath: string;
          title: string;
          excerpt: string;
        }
      | undefined;
    docFiles: string[];
  };
  testsFound: string[];
  evidenceRecords: EvidenceRecord[];
  parserCoverage: "specialized-ast-graph" | "universal-baseline";
  classification?:
    | {
        category: ProjectCategory;
        confidence: "high" | "medium" | "inferred";
        rationale: string;
        detectedFrameworks: string[];
        detectedTools: string[];
        structuralFacts: StructuralFact[];
      }
    | undefined;
}

export type EvidenceStatus =
  "documented" | "implementation_found" | "test_found" | "inferred" | "unresolved";

export interface ProjectCapability {
  id: string;
  name: string;
  description: string;
  evidenceStatus: EvidenceStatus;
  evidenceIds: string[];
  primaryFiles: string[];
}

export type ProjectCategory =
  | "web-application"
  | "backend-system"
  | "cli-tool"
  | "library-framework"
  | "data-ml"
  | "universal";

export interface StructuralFact {
  label: string;
  value: string;
  detail?: string | undefined;
}

export interface ConceptualArea {
  id: string;
  name: string;
  role: string;
  evidenceIds: string[];
  associatedFiles: string[];
  category?:
    | "frontend"
    | "api"
    | "service"
    | "data"
    | "cli"
    | "core"
    | "pipeline"
    | "config"
    | "external"
    | undefined;
  nextStep?: string | undefined;
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
  targetFile?: string | undefined;
}

export interface TechnicalOverview {
  primaryLanguage: string;
  ecosystem: string;
  dependencies: string[];
  scripts: string[];
  entryPoints: string[];
  totalFiles: number;
  totalDirectories: number;
  projectCategory?: ProjectCategory | undefined;
  categoryConfidence?: "high" | "medium" | "inferred" | undefined;
  categoryRationale?: string | undefined;
  detectedFrameworks?: string[] | undefined;
  detectedTools?: string[] | undefined;
  structuralFacts?: StructuralFact[] | undefined;
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
  modelUsed?: string | undefined;
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
  repoUrl: string;
  owner: string;
  repo: string;
  generatedAt: string;
  cached: boolean;
}
