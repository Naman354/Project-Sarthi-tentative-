import path from "node:path";
import fs from "node:fs/promises";
import {
  parseSourceCode,
  walkAst,
  getStringLiteralValue,
  getExpressionName,
  formatExpression,
  parseMiddlewareNode,
  extractSourceLocation,
  type AstNode,
  type ParsedMiddleware,
} from "../visitors/ast.utils.js";
import type {
  ParserPlugin,
  ParsedOutput,
  NormalizedEntity,
  NormalizedRelationship,
  SourceLocation,
} from "../types.js";

const HTTP_METHODS = new Set(["get", "post", "put", "delete", "patch", "options", "head"]);

interface ImportInfo {
  source: string;
  imported: string;
  local: string;
}

export interface DetailedMiddleware extends ParsedMiddleware {
  implementationResolved?: boolean;
  declarationLocation?: SourceLocation | null;
  implementationLocation?: SourceLocation | null;
}

export class ExpressParserPlugin implements ParserPlugin {
  readonly id = "express-parser";
  readonly name = "Express Parser";
  readonly version = "1.1.0";

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

  private async resolveImportedFile(baseDir: string, importSource: string): Promise<string | null> {
    const candidates = [
      path.resolve(baseDir, `${importSource}.ts`),
      path.resolve(baseDir, `${importSource}.js`),
      path.resolve(baseDir, `${importSource}.tsx`),
      path.resolve(baseDir, `${importSource}.jsx`),
      path.resolve(baseDir, importSource, "index.ts"),
      path.resolve(baseDir, importSource, "index.js"),
      path.resolve(baseDir, importSource),
    ];

    for (const cand of candidates) {
      try {
        const s = await fs.stat(cand);
        if (s.isFile()) return cand;
      } catch {
        // Continue checking candidates
      }
    }
    return null;
  }

  private findSymbolLocationInAst(
    ast: AstNode,
    querySymbol: string | null,
    targetRelPath: string
  ): SourceLocation | null {
    if (!querySymbol) return null;
    let foundLoc: SourceLocation | null = null;

    walkAst(ast, (node) => {
      if (foundLoc) return;

      // Class method (e.g. static async refreshSession(...))
      if (
        node.type === "ClassMethod" ||
        node.type === "MethodDefinition" ||
        node.type === "TSMethodSignature"
      ) {
        const key = node["key"] as AstNode | undefined;
        const methodName =
          key?.type === "Identifier" ? (key["name"] as string) : getExpressionName(key);
        if (methodName === querySymbol) {
          foundLoc = extractSourceLocation(node, targetRelPath);
          return;
        }
      }

      // Standalone function declaration (e.g. function refreshSession(...))
      if (node.type === "FunctionDeclaration") {
        const id = node["id"] as AstNode | undefined;
        if (id?.type === "Identifier" && id["name"] === querySymbol) {
          foundLoc = extractSourceLocation(node, targetRelPath);
          return;
        }
      }

      // Variable declaration (e.g. const refreshSession = (...) => ... or class AuthController)
      if (node.type === "VariableDeclarator") {
        const id = node["id"] as AstNode | undefined;
        if (id?.type === "Identifier" && id["name"] === querySymbol) {
          foundLoc = extractSourceLocation(node, targetRelPath);
          return;
        }
      }

      if (node.type === "ClassDeclaration") {
        const id = node["id"] as AstNode | undefined;
        if (id?.type === "Identifier" && id["name"] === querySymbol) {
          foundLoc = extractSourceLocation(node, targetRelPath);
          return;
        }
      }
    });

    return foundLoc;
  }

  async parse(repoPath: string, files: string[]): Promise<ParsedOutput> {
    const entities: NormalizedEntity[] = [];
    const relationships: NormalizedRelationship[] = [];
    const warnings: string[] = [];
    const discoveredModules = new Map<string, NormalizedEntity>();
    const parsedAstCache = new Map<string, AstNode | null>();

    const getParsedFile = async (absPath: string): Promise<AstNode | null> => {
      if (parsedAstCache.has(absPath)) {
        return parsedAstCache.get(absPath)!;
      }
      try {
        const code = await fs.readFile(absPath, "utf-8");
        const isTsx = absPath.endsWith(".tsx") || absPath.endsWith(".jsx");
        const ast = parseSourceCode(code, isTsx);
        parsedAstCache.set(absPath, ast);
        return ast;
      } catch {
        parsedAstCache.set(absPath, null);
        return null;
      }
    };

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
      parsedAstCache.set(filePath, ast);

      // Collect imports for resolving middleware and handler implementations
      const importMap = new Map<string, ImportInfo>();
      walkAst(ast, (n) => {
        if (n.type === "ImportDeclaration") {
          const source = (n["source"] as { value?: string })?.value;
          const specifiers = n["specifiers"] as AstNode[] | undefined;
          if (source && Array.isArray(specifiers)) {
            for (const s of specifiers) {
              const local = (s["local"] as { name?: string })?.name;
              if (!local) continue;
              if (s.type === "ImportDefaultSpecifier") {
                importMap.set(local, { source, imported: "default", local });
              } else if (s.type === "ImportSpecifier") {
                const imported = (s["imported"] as { name?: string })?.name || local;
                importMap.set(local, { source, imported, local });
              } else if (s.type === "ImportNamespaceSpecifier") {
                importMap.set(local, { source, imported: "*", local });
              }
            }
          }
        }
      });

      // Walk AST looking for Express route declarations: router.get, app.post, etc.
      // We collect route calls first, then process asynchronously for import resolution
      const routeCallNodes: Array<{
        node: AstNode;
        callee: AstNode;
        args: AstNode[];
        methodName: string;
      }> = [];

      walkAst(ast, (node) => {
        if (node.type === "CallExpression") {
          const callee = node["callee"] as AstNode | undefined;
          const args = node["arguments"] as AstNode[] | undefined;

          if (callee && callee.type === "MemberExpression" && args && args.length >= 2) {
            const prop = callee["property"] as AstNode | undefined;
            const methodName =
              prop && prop.type === "Identifier" ? (prop["name"] as string).toLowerCase() : "";

            if (HTTP_METHODS.has(methodName)) {
              routeCallNodes.push({ node, callee, args, methodName });
            }
          }
        }
      });

      for (const { node, callee, args, methodName } of routeCallNodes) {
        const callerName = getExpressionName(callee["object"]);
        const firstArg = args[0];
        if (!firstArg) continue;
        const routePath = getStringLiteralValue(firstArg);

        if (routePath === null) continue;

        const httpMethod = methodName.toUpperCase();
        const routeLoc = extractSourceLocation(node, relativePath);
        const routeId = `route:${relativePath}#${httpMethod}:${routePath}`;
        const routeName = `${httpMethod} ${routePath}`;

        // Extract intermediate middleware arguments (in exact declaration order)
        const middlewareList: DetailedMiddleware[] = [];
        const middlewareNames: string[] = [];

        const processMiddlewareArg = async (midNode: AstNode) => {
          if (midNode.type === "ArrayExpression" && Array.isArray(midNode["elements"])) {
            for (const elem of midNode["elements"]) {
              if (elem && typeof elem === "object") {
                await processMiddlewareArg(elem as AstNode);
              }
            }
            return;
          }

          const parsed = parseMiddlewareNode(midNode, relativePath);
          const detailed: DetailedMiddleware = {
            ...parsed,
            declarationLocation: parsed.location,
            implementationResolved: false,
            implementationLocation: null,
          };

          // Attempt to resolve middleware implementation in source
          const midRoot = parsed.callee.includes(".") ? parsed.callee.split(".")[0] : parsed.callee;

          if (midRoot && importMap.has(midRoot)) {
            const imp = importMap.get(midRoot)!;
            if (imp.source.startsWith(".")) {
              const targetAbsPath = await this.resolveImportedFile(
                path.dirname(filePath),
                imp.source
              );
              if (targetAbsPath) {
                const targetRelPath = path.relative(repoPath, targetAbsPath).replace(/\\/g, "/");
                const targetAst = await getParsedFile(targetAbsPath);
                if (targetAst) {
                  const symbolToFind = parsed.callee.includes(".")
                    ? parsed.callee.split(".")[1]
                    : imp.imported !== "default" && imp.imported !== "*"
                      ? imp.imported
                      : midRoot;
                  const symLoc = this.findSymbolLocationInAst(
                    targetAst,
                    symbolToFind || null,
                    targetRelPath
                  );
                  if (symLoc) {
                    detailed.implementationResolved = true;
                    detailed.implementationLocation = symLoc;
                  } else {
                    detailed.implementationResolved = true;
                    detailed.implementationLocation = {
                      filePath: targetRelPath,
                      startLine: 1,
                      startColumn: 0,
                      endLine: 1,
                      endColumn: 0,
                    };
                  }
                }
              }
            }
          } else if (midRoot) {
            // Check if declared in this same file
            const localLoc = this.findSymbolLocationInAst(ast, midRoot, relativePath);
            if (localLoc) {
              detailed.implementationResolved = true;
              detailed.implementationLocation = localLoc;
            }
          }

          middlewareList.push(detailed);
          middlewareNames.push(detailed.name);
        };

        for (let i = 1; i < args.length - 1; i++) {
          const midArg = args[i];
          if (midArg) {
            await processMiddlewareArg(midArg);
          }
        }

        // Process terminal handler argument
        const handlerArg = args[args.length - 1];
        let handlerName = "anonymousHandler";
        let implementationResolved = false;
        let implementationLocation: SourceLocation | null = null;
        const declarationLocation = handlerArg
          ? extractSourceLocation(handlerArg, relativePath)
          : null;

        if (handlerArg) {
          if (
            handlerArg.type === "ArrowFunctionExpression" ||
            handlerArg.type === "FunctionExpression"
          ) {
            const fnId = (handlerArg["id"] as AstNode | undefined)?.["name"] as string | undefined;
            handlerName = fnId || "inlineHandler";
            implementationResolved = true;
            implementationLocation = declarationLocation;
          } else {
            handlerName =
              formatExpression(handlerArg) || getExpressionName(handlerArg) || "handler";

            let rootId: string | null = null;
            let methodId: string | null = null;

            if (handlerArg.type === "Identifier") {
              rootId = handlerArg["name"] as string;
            } else if (handlerArg.type === "MemberExpression") {
              rootId = getExpressionName(handlerArg["object"]);
              methodId = getExpressionName(handlerArg["property"]);
            }

            if (rootId && importMap.has(rootId)) {
              const imp = importMap.get(rootId)!;
              if (imp.source.startsWith(".")) {
                const targetAbsPath = await this.resolveImportedFile(
                  path.dirname(filePath),
                  imp.source
                );
                if (targetAbsPath) {
                  const targetRelPath = path.relative(repoPath, targetAbsPath).replace(/\\/g, "/");
                  const targetAst = await getParsedFile(targetAbsPath);
                  if (targetAst) {
                    const symbolToFind =
                      methodId ||
                      (imp.imported !== "default" && imp.imported !== "*" ? imp.imported : rootId);
                    const symLoc = this.findSymbolLocationInAst(
                      targetAst,
                      symbolToFind,
                      targetRelPath
                    );
                    if (symLoc) {
                      implementationResolved = true;
                      implementationLocation = symLoc;
                    } else {
                      // Target file located, but method AST node not matched
                      implementationResolved = true;
                      implementationLocation = {
                        filePath: targetRelPath,
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 0,
                      };
                    }
                  }
                }
              }
            } else if (rootId) {
              // Check if declared in this same file
              const localLoc = this.findSymbolLocationInAst(ast, methodId || rootId, relativePath);
              if (localLoc) {
                implementationResolved = true;
                implementationLocation = localLoc;
              }
            }
          }
        }

        const routeEntity: NormalizedEntity = {
          id: routeId,
          type: "route",
          name: routeName,
          filePath: relativePath,
          location: routeLoc,
          metadata: {
            httpMethod,
            path: routePath,
            routeKey: `route:${httpMethod}:${routePath}`,
            middleware: middlewareNames, // string[] backward compatible
            middlewares: middlewareList, // rich structured middleware details
            handler: handlerName,
            caller: callerName || "router",
            startLine: routeLoc?.startLine,
            endLine: routeLoc?.endLine,
            ...(routeLoc ? { location: routeLoc } : {}),
          },
        };
        entities.push(routeEntity);

        // Route-based Module Detection
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
          const controllerLoc = implementationLocation || declarationLocation;
          const controllerFile = implementationLocation?.filePath || relativePath;
          const controllerId = `controller:${controllerFile}#${handlerName}`;

          const controllerEntity: NormalizedEntity = {
            id: controllerId,
            type: "controller",
            name: handlerName,
            filePath: controllerFile,
            location: controllerLoc,
            metadata: {
              handlerMethod: handlerName,
              routeId,
              implementationResolved,
              declarationLocation,
              implementationLocation,
              ...(controllerLoc ? { location: controllerLoc } : {}),
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

    return {
      pluginId: this.id,
      entities,
      relationships,
      warnings,
    };
  }
}

export const expressParserPlugin = new ExpressParserPlugin();
