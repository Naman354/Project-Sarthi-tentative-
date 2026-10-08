import { api } from "./api";
import type { Project, CreateProjectPayload } from "../types/project";
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
