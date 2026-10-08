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

export class ReactParserPlugin implements ParserPlugin {
  readonly id = "react-parser";
  readonly name = "React & Next.js Parser";
  readonly version = "1.0.0";

  supports(_repoPath: string, technologies: Set<string>): boolean {
    return technologies.has("React") || technologies.has("Next.js");
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
          entry.endsWith(".tsx") ||
          entry.endsWith(".jsx") ||
          (entry.endsWith(".ts") && (entry.includes("page") || entry.includes("component")))
        ) {
          collected.push(fullPath);
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

    for (const filePath of files) {
      const relativePath = path.relative(repoPath, filePath).replace(/\\/g, "/");
      let sourceText = "";
      try {
        sourceText = await fs.readFile(filePath, "utf-8");
      } catch (err) {
        warnings.push(`Could not read React file ${relativePath}: ${String(err)}`);
        continue;
      }

      const isTsx = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
      const ast = parseSourceCode(sourceText, isTsx);
      if (!ast) {
        warnings.push(`AST parse failure for React file ${relativePath}`);
        continue;
      }

      const isPageFile =
        /(?:^|\/)app\//.test(relativePath) &&
        (relativePath.endsWith("page.tsx") || relativePath.endsWith("page.jsx"));

      let currentFileEntityId: string | null = null;

      // 1. Next.js App Router Page Identification
      if (isPageFile) {
        const appMatch = relativePath.match(/(?:^|\/)app\/(.*)/);
        let pageRoute = "/";
        if (appMatch && appMatch[1]) {
          const sub = appMatch[1]
            .replace(/\/page\.(tsx|jsx)$/, "")
            .replace(/^page\.(tsx|jsx)$/, "");
          pageRoute = sub ? "/" + sub : "/";
        }

        const pageId = `page:${pageRoute}`;
        const pageEntity: NormalizedEntity = {
          id: pageId,
          type: "page",
          name: `Page: ${pageRoute}`,
          filePath: relativePath,
          metadata: {
            pageRoute,
            framework: "Next.js App Router",
          },
        };
        entities.push(pageEntity);
        currentFileEntityId = pageId;
      }

      // 2. Identify UI Components
      walkAst(ast, (node) => {
        let componentName: string | null = null;

        if (node.type === "FunctionDeclaration") {
          const id = node["id"] as AstNode | undefined;
          if (id && id.type === "Identifier" && typeof id["name"] === "string") {
            const name = id["name"];
            if (/^[A-Z]/.test(name)) {
              componentName = name;
            }
          }
        } else if (node.type === "VariableDeclarator") {
          const id = node["id"] as AstNode | undefined;
          const init = node["init"] as AstNode | undefined;
          if (
            id &&
            id.type === "Identifier" &&
            typeof id["name"] === "string" &&
            /^[A-Z]/.test(id["name"]) &&
            init &&
            (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")
          ) {
            componentName = id["name"];
          }
        }

        if (componentName) {
          const componentId = `component:${componentName}`;
          if (!entities.some((e) => e.id === componentId)) {
            const componentEntity: NormalizedEntity = {
              id: componentId,
              type: "component",
              name: componentName,
              filePath: relativePath,
              metadata: {
                componentName,
                isPageRoot: isPageFile,
              },
            };
            entities.push(componentEntity);

            if (currentFileEntityId && currentFileEntityId !== componentId) {
              relationships.push({
                sourceId: currentFileEntityId,
                targetId: componentId,
                type: "contains",
              });
            }
          }
        }

        // 3. Detect API Usage / Outgoing Calls
        if (node.type === "CallExpression") {
          const callee = node["callee"] as AstNode | undefined;
          const args = node["arguments"] as AstNode[] | undefined;
          const callName = getExpressionName(callee);

          if (
            (callName === "fetch" ||
              callName?.startsWith("api.") ||
              callName?.startsWith("axios.")) &&
            args &&
            args.length > 0
          ) {
            const firstArg = args[0];
            if (firstArg) {
              const apiPath = getStringLiteralValue(firstArg);
              if (apiPath && (apiPath.startsWith("/") || apiPath.startsWith("http"))) {
                const targetEntityId = `route:${apiPath}`;
                if (currentFileEntityId) {
                  relationships.push({
                    sourceId: currentFileEntityId,
                    targetId: targetEntityId,
                    type: "uses",
                    metadata: {
                      caller: callName,
                      targetUrl: apiPath,
                    },
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

export const reactParserPlugin = new ReactParserPlugin();
