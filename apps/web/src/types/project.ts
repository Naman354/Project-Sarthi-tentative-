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
