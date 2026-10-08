import path from "node:path";
import fs from "node:fs/promises";
import {
  parseSourceCode,
  walkAst,
  getStringLiteralValue,
  getExpressionName,
  type AstNode,
} from "../visitors/ast.utils.js";
import type {
  ParserPlugin,
  ParsedOutput,
  NormalizedEntity,
  NormalizedRelationship,
} from "../types.js";

const HTTP_METHODS = new Set(["get", "post", "put", "delete", "patch", "options", "head"]);

export class ExpressParserPlugin implements ParserPlugin {
  readonly id = "express-parser";
  readonly name = "Express Parser";
  readonly version = "1.0.0";

  supports(_repoPath: string, technologies: Set<string>): boolean {
    return technologies.has("Express");
  }

  async collectFiles(repoPath: string): Promise<string[]> {
    const collected: string[] = [];
    const IGNORED = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);

    const scan = async (dir: string): Promise<void> => {
      let entries: string[] = [];
      try {
        entries = await fs.readdir(dir);
      } catch {
        return;
      }

      for (const entry of entries) {
        if (IGNORED.has(entry)) continue;
        const fullPath = path.join(dir, entry);
        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          await scan(fullPath);
        } else if (
          entry.endsWith(".ts") ||
          entry.endsWith(".js") ||
          entry.endsWith(".mjs") ||
          entry.endsWith(".cjs")
        ) {
          const rel = path.relative(repoPath, fullPath).replace(/\\/g, "/");
          const lower = rel.toLowerCase();
          if (
            lower.includes("route") ||
            lower.includes("controller") ||
            lower.includes("service") ||
            lower.includes("middleware") ||
            lower.includes("app.ts") ||
            lower.includes("server.ts") ||
            lower.includes("api/")
          ) {
            collected.push(fullPath);
          }
        }
      }
    };

    await scan(repoPath);
    return collected;
  }

  async parse(repoPath: string, files: string[]): Promise<ParsedOutput> {
    const entities: NormalizedEntity[] = [];
    const relationships: NormalizedRelationship[] = [];
    const warnings: string[] = [];
    const discoveredModules = new Map<string, NormalizedEntity>();

    const getOrCreateModule = (moduleName: string, filePath: string): NormalizedEntity => {
      const cleanName = moduleName.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "general";
      const moduleId = `module:${cleanName}`;
      if (!discoveredModules.has(moduleId)) {
        const modEntity: NormalizedEntity = {
          id: moduleId,
          type: "module",
          name: `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Module`,
          filePath,
          metadata: { moduleSlug: cleanName },
        };
        discoveredModules.set(moduleId, modEntity);
        entities.push(modEntity);
      }
      return discoveredModules.get(moduleId)!;
    };

    for (const filePath of files) {
      const relativePath = path.relative(repoPath, filePath).replace(/\\/g, "/");
      let sourceText = "";
      try {
        sourceText = await fs.readFile(filePath, "utf-8");
      } catch (err) {
        warnings.push(`Could not read file ${relativePath}: ${String(err)}`);
        continue;
      }

      const isTsx = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
      const ast = parseSourceCode(sourceText, isTsx);
      if (!ast) {
        warnings.push(`AST parse failure for ${relativePath}`);
        continue;
      }

      walkAst(ast, (node) => {
        if (node.type === "CallExpression") {
          const callee = node["callee"] as AstNode | undefined;
          const args = node["arguments"] as AstNode[] | undefined;

          if (callee && callee.type === "MemberExpression" && args && args.length >= 2) {
            const prop = callee["property"] as AstNode | undefined;
            const callerName = getExpressionName(callee["object"]);
            const methodName =
              prop && prop.type === "Identifier" ? (prop["name"] as string).toLowerCase() : "";

            if (HTTP_METHODS.has(methodName)) {
              const firstArg = args[0];
              if (!firstArg) return;
              const routePath = getStringLiteralValue(firstArg);

              if (routePath !== null) {
                const httpMethod = methodName.toUpperCase();
                const routeId = `route:${httpMethod}:${routePath}`;
                const routeName = `${httpMethod} ${routePath}`;

                const handlerArg = args[args.length - 1];
                let handlerName = "anonymousHandler";
                if (handlerArg) {
                  handlerName = getExpressionName(handlerArg) || "handler";
                }

                const middlewareNames: string[] = [];
                for (let i = 1; i < args.length - 1; i++) {
                  const midArg = args[i];
                  if (midArg) {
                    const name = getExpressionName(midArg) || "middleware";
                    middlewareNames.push(name);
                  }
                }

                const routeEntity: NormalizedEntity = {
                  id: routeId,
                  type: "route",
                  name: routeName,
                  filePath: relativePath,
                  metadata: {
                    httpMethod,
                    path: routePath,
                    middleware: middlewareNames,
                    handler: handlerName,
                    caller: callerName || "router",
                  },
                };
                entities.push(routeEntity);

                // Route-based Module Detection (Chapter 4 Section 11)
                const segments = routePath.split("/").filter(Boolean);
                const firstSegment = segments[0] || "root";
                const moduleEntity = getOrCreateModule(firstSegment, relativePath);

                // Relationship: Module contains Route
                relationships.push({
                  sourceId: moduleEntity.id,
                  targetId: routeEntity.id,
                  type: "contains",
                });

                // Controller Entity & Relationship
                if (handlerName && handlerName !== "anonymousHandler") {
                  const controllerId = `controller:${handlerName}`;
                  const controllerEntity: NormalizedEntity = {
                    id: controllerId,
                    type: "controller",
                    name: handlerName,
                    filePath: relativePath,
                    metadata: {
                      handlerMethod: handlerName,
                      routeId,
                    },
                  };
                  entities.push(controllerEntity);

                  relationships.push({
                    sourceId: routeEntity.id,
                    targetId: controllerId,
                    type: "handled_by",
                  });
                }
              }
            }
          }
        }
      });
    }

    return {
      pluginId: this.id,
      entities,
      relationships,
      warnings,
    };
  }
}

export const expressParserPlugin = new ExpressParserPlugin();
