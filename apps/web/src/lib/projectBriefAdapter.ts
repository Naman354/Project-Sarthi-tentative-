import type {
  ProjectBrief,
  ProjectCategory,
  ConceptualArea,
  ConceptualRelationship,
  GuidedTourStep,
  ProjectCapability,
} from "../types/brief";
import type {
  Project,
  RepositoryMetadata,
  ParserManagerResult,
  ProjectGraph,
  ModuleSummaryItem,
  ResumeSessionBriefing,
} from "../types/project";

export function adaptProjectToBrief(params: {
  project: Project;
  metadata?: RepositoryMetadata | null;
  parseResult?: ParserManagerResult | null;
  graph?: ProjectGraph | null;
  modules?: ModuleSummaryItem[];
  resume?: ResumeSessionBriefing | null;
}): ProjectBrief {
  const { project, metadata, parseResult, graph, modules = [], resume } = params;

  // Extract owner and repo from githubUrl
  const urlParts = project.githubUrl.replace(/^https?:\/\/github\.com\//, "").split("/");
  const owner = urlParts[0] || "repository";
  const repo = (urlParts[1] || project.name).replace(/\.git$/, "");

  // Determine category based on framework/technologies
  const techList = (parseResult?.technologies?.technologies || []).concat(
    project.framework || "",
    metadata?.detectedFramework || ""
  );
  const techStr = techList.join(" ").toLowerCase();

  let projectCategory: ProjectCategory = "universal";
  if (/next|react|vue|angular|svelte|frontend|vite/i.test(techStr)) {
    projectCategory = "web-application";
  } else if (/express|nest|fastify|django|flask|spring|api|backend/i.test(techStr)) {
    projectCategory = "backend-system";
  } else if (/cli|commander|yargs|clap/i.test(techStr)) {
    projectCategory = "cli-tool";
  } else if (/lib|sdk|package/i.test(techStr)) {
    projectCategory = "library-framework";
  }

  // Construct conceptual map areas from modules
  const areas: ConceptualArea[] =
    modules.length > 0
      ? modules.map((m) => {
          const cat = classifyCategoryByName(m.name);
          return {
            id: m.id,
            name: m.name,
            role: `${m.routesCount} routes, ${m.modelsCount} models, ${m.servicesCount} services`,
            evidenceIds: [],
            associatedFiles: m.docs?.map((d) => d.filePath || d.name) || [],
            category: cat,
          };
        })
      : [
          {
            id: "core",
            name: "Core Engine",
            role: "Main application entrypoint and coordinator",
            evidenceIds: [],
            associatedFiles: metadata?.topLevelEntries || [],
            category: "core",
          },
        ];

  // Construct conceptual relationships from graph edges
  const relationships: ConceptualRelationship[] =
    graph?.edges?.map((e) => ({
      fromAreaId: e.sourceNodeId,
      toAreaId: e.targetNodeId,
      label: e.relationshipType || "depends_on",
      evidenceIds: [],
    })) || [];

  // Construct guided tour from resume session recommendations
  const guidedTour: GuidedTourStep[] =
    resume?.navigationRecommendations && resume.navigationRecommendations.length > 0
      ? resume.navigationRecommendations.map((rec, idx) => ({
          step: idx + 1,
          title: rec.title,
          description: rec.reason,
          targetFile: rec.targetModule,
        }))
      : modules.slice(0, 3).map((m, idx) => ({
          step: idx + 1,
          title: `Explore ${m.name} Module`,
          description: `Primary application subsystem defining ${m.routesCount} routes and ${m.modelsCount} data models.`,
          targetFile: m.docs?.[0]?.filePath || undefined,
        }));

  // Construct capabilities from modules and parsed entities
  const capabilities: ProjectCapability[] =
    modules.length > 0
      ? modules.slice(0, 6).map((m) => ({
          id: `cap-${m.id}`,
          name: `${m.name} Operations`,
          description: `Handles operations including ${m.routesCount} routes and ${m.servicesCount} services.`,
          evidenceStatus: "implementation_found",
          evidenceIds: [],
          primaryFiles: m.docs?.map((d) => d.filePath || d.name) || [],
        }))
      : [];

  const structuralFacts = [
    {
      label: "Indexed Modules",
      value: `${modules.length}`,
      detail: "Application modules indexed and connected into the structural architecture graph.",
    },
    {
      label: "Graph Entities",
      value: `${graph?.stats?.totalNodes || parseResult?.stats?.totalEntities || 0}`,
      detail: "Verified AST nodes including routes, controllers, models, and services.",
    },
    {
      label: "Total Source Files",
      value: `${metadata?.fileCount || 0}`,
      detail: `Spanning ${metadata?.directoryCount || 0} directories in repository snapshot.`,
    },
  ];

  return {
    owner,
    repo,
    repoUrl: project.githubUrl,
    commitSha: metadata?.commitHash || "main",
    purpose:
      project.description ||
      `${project.name} is a ${project.language || metadata?.detectedLanguage || "modern"} repository utilizing ${project.framework || metadata?.detectedFramework || "modular architecture"}.`,
    intendedAudience: null,
    capabilities,
    conceptualMap: {
      areas,
      relationships,
    },
    guidedTour,
    technicalOverview: {
      primaryLanguage: project.language || metadata?.detectedLanguage || "TypeScript",
      ecosystem: project.framework || metadata?.detectedFramework || "Node.js",
      dependencies: parseResult?.technologies?.technologies || [],
      devDependencies: [],
      scripts: [],
      entryPoints: metadata?.topLevelEntries || [],
      totalFiles: metadata?.fileCount || 0,
      totalDirectories: metadata?.directoryCount || 0,
      projectCategory,
      categoryConfidence: "high",
      detectedFrameworks: project.framework ? [project.framework] : [],
      detectedTools: parseResult?.technologies?.technologies || [],
      structuralFacts,
    },
    limitationsAndGaps: [],
    generatedBy: "deterministic-fallback",
    modelUsed: undefined,
    evidenceMap: {},
    generatedAt: project.lastAnalysis || project.createdAt,
    cached: true,
  };
}

function classifyCategoryByName(
  name: string
): "frontend" | "api" | "service" | "data" | "cli" | "core" | "pipeline" | "config" | "external" {
  const norm = name.toLowerCase();
  if (/route|controller|api|endpoint|ingress/i.test(norm)) return "api";
  if (/service|middleware|handler/i.test(norm)) return "service";
  if (/model|schema|db|database|entity/i.test(norm)) return "data";
  if (/ui|view|component|page|frontend/i.test(norm)) return "frontend";
  if (/config|util|helper/i.test(norm)) return "config";
  return "core";
}
