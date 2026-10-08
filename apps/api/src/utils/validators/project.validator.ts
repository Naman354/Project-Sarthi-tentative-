import { z } from "zod";

// Validates https://github.com/:owner/:repo format (with or without .git suffix, ignoring trailing slashes)
const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name must not exceed 100 characters"),
  description: z.string().trim().max(500, "Description must not exceed 500 characters").optional(),
  githubUrl: z
    .string()
    .trim()
    .min(1, "GitHub repository URL is required")
    .url("Invalid URL format")
    .regex(
      GITHUB_REPO_REGEX,
      "URL must be a valid GitHub repository (e.g. https://github.com/owner/repository)"
    ),
  defaultBranch: z
    .string()
    .trim()
    .max(50, "Default branch name must not exceed 50 characters")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name must not exceed 100 characters")
    .optional(),
  description: z.string().trim().max(500, "Description must not exceed 500 characters").optional(),
  defaultBranch: z
    .string()
    .trim()
    .max(50, "Default branch name must not exceed 50 characters")
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
