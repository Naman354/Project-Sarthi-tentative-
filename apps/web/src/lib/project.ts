import { api } from "./api";
import type {
  Project,
  CreateProjectPayload,
  ProjectStatusData,
  AnalyzeResultData,
  ParserManagerResult,
  ProjectGraph,
  ModuleSummaryItem,
  ModuleDetailResponse,
  GraphVersionSummary,
  ProjectOverviewData,
  InsightItem,
  ProjectHealthReport,
  ResumeSessionBriefing,
} from "../types/project";
import type { ApiResponse } from "../types/auth";

export async function fetchProjects(): Promise<ApiResponse<{ projects: Project[] }>> {
  return api.get<{ projects: Project[] }>("/projects");
}

export async function fetchProjectById(id: string): Promise<ApiResponse<{ project: Project }>> {
  return api.get<{ project: Project }>(`/projects/${id}`);
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<ApiResponse<{ project: Project }>> {
  return api.post<{ project: Project }>("/projects", payload);
}

export async function deleteProject(id: string): Promise<ApiResponse<{ message: string }>> {
  return api.delete<{ message: string }>(`/projects/${id}`);
}

export async function triggerProjectAnalysis(id: string): Promise<ApiResponse<AnalyzeResultData>> {
  return api.post<AnalyzeResultData>(`/projects/${id}/analyze`, {});
}

export async function fetchProjectStatus(id: string): Promise<ApiResponse<ProjectStatusData>> {
  return api.get<ProjectStatusData>(`/projects/${id}/status`);
}

export async function fetchProjectEntities(id: string): Promise<ApiResponse<ParserManagerResult>> {
  return api.get<ParserManagerResult>(`/projects/${id}/entities`);
}

export async function fetchProjectGraph(
  id: string,
  versionId?: string
): Promise<ApiResponse<ProjectGraph>> {
  const query = versionId ? `?version=${encodeURIComponent(versionId)}` : "";
  return api.get<ProjectGraph>(`/projects/${id}/graph${query}`);
}

export async function fetchProjectModules(
  id: string,
  versionId?: string
): Promise<ApiResponse<{ modules: ModuleSummaryItem[]; total: number }>> {
  const query = versionId ? `?version=${encodeURIComponent(versionId)}` : "";
  return api.get<{ modules: ModuleSummaryItem[]; total: number }>(
    `/projects/${id}/modules${query}`
  );
}

export async function fetchModuleDetails(
  id: string,
  moduleId: string,
  versionId?: string
): Promise<ApiResponse<ModuleDetailResponse>> {
  const query = versionId ? `?version=${encodeURIComponent(versionId)}` : "";
  return api.get<ModuleDetailResponse>(
    `/projects/${id}/module/${encodeURIComponent(moduleId)}${query}`
  );
}

export async function fetchGraphVersions(
  id: string
): Promise<ApiResponse<{ versions: GraphVersionSummary[]; total: number }>> {
  return api.get<{ versions: GraphVersionSummary[]; total: number }>(
    `/projects/${id}/graph/versions`
  );
}

export async function fetchProjectOverview(
  id: string
): Promise<ApiResponse<ProjectOverviewData>> {
  return api.get<ProjectOverviewData>(`/projects/${id}/overview`);
}

export async function fetchProjectInsights(
  id: string
): Promise<ApiResponse<{ insights: InsightItem[]; total: number }>> {
  return api.get<{ insights: InsightItem[]; total: number }>(`/projects/${id}/insights`);
}

export async function fetchProjectHealth(
  id: string
): Promise<ApiResponse<ProjectHealthReport>> {
  return api.get<ProjectHealthReport>(`/projects/${id}/health`);
}

export async function fetchResumeSession(
  id: string
): Promise<ApiResponse<ResumeSessionBriefing>> {
  return api.get<ResumeSessionBriefing>(`/projects/${id}/resume`);
}

