import { z } from "zod";

export const GITHUB_PUBLIC_REPO_REGEX =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

export const exploreRepositoryInputSchema = z.object({
  githubUrl: z
    .string()
    .trim()
    .min(1, "GitHub repository URL is required")
    .url("Invalid URL format")
    .regex(
      GITHUB_PUBLIC_REPO_REGEX,
      "URL must be a public GitHub repository (e.g. https://github.com/owner/repository)"
    )
    .refine((url) => !url.includes("@"), {
      message: "Embedded credentials in URLs are not allowed",
    }),
  forceRefresh: z.boolean().optional(),
});

export type ExploreRepositoryInput = z.infer<typeof exploreRepositoryInputSchema>;

export const projectBriefAiOutputSchema = z.object({
  purpose: z
    .string()
    .min(1, "Purpose is required")
    .max(1000, "Purpose too long"),
  intendedAudience: z.string().nullable().optional(),
  capabilities: z
    .array(
      z.object({
        id: z.string().default(() => `cap-${Math.random().toString(36).substring(2, 7)}`),
        name: z.string().min(1),
        description: z.string().min(1),
        evidenceStatus: z
          .enum([
            "documented",
            "implementation_found",
            "test_found",
            "inferred",
            "unresolved",
          ])
          .default("inferred"),
        evidenceIds: z.array(z.string()).default([]),
        primaryFiles: z.array(z.string()).default([]),
      })
    )
    .min(1, "At least one capability required")
    .max(8),
  conceptualMap: z.object({
    areas: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().min(1),
          role: z.string().min(1),
          evidenceIds: z.array(z.string()).default([]),
          associatedFiles: z.array(z.string()).default([]),
        })
      )
      .min(1, "At least one conceptual area required"),
    relationships: z
      .array(
        z.object({
          fromAreaId: z.string(),
          toAreaId: z.string(),
          label: z.string(),
          evidenceIds: z.array(z.string()).default([]),
        })
      )
      .default([]),
  }),
  guidedTour: z
    .array(
      z.object({
        step: z.number(),
        title: z.string(),
        description: z.string(),
        targetFile: z.string().optional(),
      })
    )
    .default([]),
  limitationsAndGaps: z.array(z.string()).default([]),
});

export type ProjectBriefAiOutput = z.infer<typeof projectBriefAiOutputSchema>;
