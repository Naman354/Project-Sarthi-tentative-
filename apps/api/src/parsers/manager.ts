import { technologyDetector, type TechnologyDetector } from "./detector.js";
import { expressParserPlugin } from "./plugins/express.plugin.js";
import { reactParserPlugin } from "./plugins/react.plugin.js";
import { prismaParserPlugin } from "./plugins/prisma.plugin.js";
import { markdownParserPlugin } from "./plugins/markdown.plugin.js";
import type {
  ParserPlugin,
  ParserManagerResult,
  NormalizedEntity,
  NormalizedRelationship,
} from "./types.js";

export class ParserManager {
  private plugins: ParserPlugin[] = [];

  constructor(
    private readonly detector: TechnologyDetector = technologyDetector,
    customPlugins?: ParserPlugin[]
  ) {
    if (customPlugins) {
      this.plugins = customPlugins;
    } else {
      // Register standard MVP plugins
      this.registerPlugin(expressParserPlugin);
      this.registerPlugin(reactParserPlugin);
      this.registerPlugin(prismaParserPlugin);
      this.registerPlugin(markdownParserPlugin);
    }
  }

  registerPlugin(plugin: ParserPlugin): void {
    if (!this.plugins.some((p) => p.id === plugin.id)) {
      this.plugins.push(plugin);
    }
  }

  getRegisteredPlugins(): ParserPlugin[] {
    return [...this.plugins];
  }

  async parseRepository(repoPath: string): Promise<ParserManagerResult> {
    const startTime = performance.now();

    // 1. Detect Technologies (Step 3 in Chapter 11)
    const techReport = await this.detector.detect(repoPath);
    const techSet = new Set(techReport.technologies);

    const allEntitiesMap = new Map<string, NormalizedEntity>();
    const allRelationships: NormalizedRelationship[] = [];
    const warnings: string[] = [];

    // 2. Select & Initialize Compatible Plugins (Step 4 in Chapter 11)
    const activePlugins: ParserPlugin[] = [];
    for (const plugin of this.plugins) {
      try {
        const supported = await plugin.supports(repoPath, techSet);
        if (supported) {
          activePlugins.push(plugin);
        }
      } catch (err) {
        warnings.push(`Plugin '${plugin.id}' check failed: ${String(err)}`);
      }
    }

    // 3. Execute Plugins with Isolated Error Handling (Fault Isolation)
    for (const plugin of activePlugins) {
      try {
        const files = await plugin.collectFiles(repoPath);
        if (files.length === 0) continue;

        const output = await plugin.parse(repoPath, files);

        if (output.warnings && output.warnings.length > 0) {
          warnings.push(...output.warnings);
        }

        // Merge entities with deduplication
        for (const entity of output.entities) {
          if (!allEntitiesMap.has(entity.id)) {
            allEntitiesMap.set(entity.id, entity);
          } else {
            // Merge metadata if duplicate
            const existing = allEntitiesMap.get(entity.id)!;
            existing.metadata = {
              ...existing.metadata,
              ...entity.metadata,
            };
            if (!existing.location && entity.location) {
              existing.location = entity.location;
            }
          }
        }

        // Collect relationships
        allRelationships.push(...output.relationships);
      } catch (err) {
        // Individual plugin failure does not fail overall parsing
        const msg = err instanceof Error ? err.message : String(err);
        warnings.push(`Plugin '${plugin.id}' execution error: ${msg}`);
      }
    }

    const allEntities = Array.from(allEntitiesMap.values());
    const durationMs = Math.round(performance.now() - startTime);

    // Compute metrics
    let modulesCount = 0;
    let routesCount = 0;
    let modelsCount = 0;
    let componentsCount = 0;
    let docsCount = 0;

    for (const entity of allEntities) {
      switch (entity.type) {
        case "module":
          modulesCount++;
          break;
        case "route":
          routesCount++;
          break;
        case "model":
          modelsCount++;
          break;
        case "component":
          componentsCount++;
          break;
        case "doc":
          docsCount++;
          break;
      }
    }

    return {
      technologies: techReport,
      entities: allEntities,
      relationships: allRelationships,
      warnings,
      stats: {
        totalEntities: allEntities.length,
        totalRelationships: allRelationships.length,
        modulesCount,
        routesCount,
        modelsCount,
        componentsCount,
        docsCount,
        durationMs,
      },
    };
  }
}

export const parserManager = new ParserManager();
