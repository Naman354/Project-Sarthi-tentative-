import { api } from "./api";
import type {
  Project,
  CreateProjectPayload,
  ProjectStatusData,
  AnalyzeResultData,
  ParserManagerResult,
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
