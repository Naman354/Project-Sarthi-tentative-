import { parse, type ParserPlugin as BabelParserPlugin } from "@babel/parser";
import type { SourceLocation } from "../types.js";

export interface AstNode {
  type: string;
  [key: string]: unknown;
}

/**
 * Extracts a normalized SourceLocation from a Babel AST node.
 * Line numbers are 1-indexed; column numbers are 0-indexed.
 * Returns null if location information is missing or incomplete.
 */
export function extractSourceLocation(
  node: AstNode | null | undefined,
  filePath?: string
): SourceLocation | null {
  if (!node || typeof node !== "object") return null;
  const loc = node["loc"] as
    | {
        start?: { line?: number; column?: number };
        end?: { line?: number; column?: number };
      }
    | undefined;

  if (
    loc &&
    loc.start &&
    typeof loc.start.line === "number" &&
    loc.end &&
    typeof loc.end.line === "number"
  ) {
    return {
      ...(filePath ? { filePath } : {}),
      startLine: loc.start.line,
      startColumn: typeof loc.start.column === "number" ? loc.start.column : 0,
      endLine: loc.end.line,
      endColumn: typeof loc.end.column === "number" ? loc.end.column : 0,
    };
  }
  return null;
}

export function parseSourceCode(sourceText: string, isTsx = true): AstNode | null {
  try {
    const plugins: BabelParserPlugin[] = ["typescript"];
    if (isTsx) {
      plugins.push("jsx");
    }
    return parse(sourceText, {
      sourceType: "module",
      plugins,
      errorRecovery: true,
    }) as unknown as AstNode;
  } catch {
    return null;
  }
}

export function walkAst(node: unknown, visitor: (node: AstNode) => void): void {
  if (!node || typeof node !== "object") return;
  const astNode = node as AstNode;
  if (typeof astNode.type === "string") {
    visitor(astNode);
  }

  for (const key of Object.keys(astNode)) {
    if (key === "loc" || key === "start" || key === "end" || key === "extra") continue;
    const value = astNode[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        walkAst(item, visitor);
      }
    } else if (value && typeof value === "object") {
      walkAst(value, visitor);
    }
  }
}

export function getStringLiteralValue(node: AstNode): string | null {
  if (node.type === "StringLiteral" && typeof node["value"] === "string") {
    return node["value"];
  }
  if (node.type === "TemplateLiteral") {
    const quasis = node["quasis"] as Array<{ value: { raw: string } }> | undefined;
    if (quasis && quasis.length === 1 && quasis[0]) {
      return quasis[0].value.raw;
    }
  }
  return null;
}

export function getExpressionName(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const astNode = node as AstNode;
  if (astNode.type === "Identifier" && typeof astNode["name"] === "string") {
    return astNode["name"];
  }
  if (astNode.type === "MemberExpression") {
    const obj = getExpressionName(astNode["object"]);
    const prop = getExpressionName(astNode["property"]);
    return obj && prop ? `${obj}.${prop}` : prop || obj;
  }
  return null;
}

export function formatArgument(arg: unknown): string | null {
  if (!arg || typeof arg !== "object") return null;
  const node = arg as AstNode;

  if (node.type === "StringLiteral" && typeof node["value"] === "string") {
    return `'${node["value"]}'`;
  }
  if (node.type === "NumericLiteral" && typeof node["value"] === "number") {
    return String(node["value"]);
  }
  if (node.type === "BooleanLiteral" && typeof node["value"] === "boolean") {
    return String(node["value"]);
  }
  if (node.type === "Identifier" && typeof node["name"] === "string") {
    return node["name"];
  }
  if (node.type === "MemberExpression") {
    return formatExpression(node);
  }
  if (node.type === "TemplateLiteral") {
    const val = getStringLiteralValue(node);
    return val !== null ? `\`${val}\`` : "`...`";
  }
  if (node.type === "ArrayExpression" && Array.isArray(node["elements"])) {
    const elements = (node["elements"] as unknown[])
      .map((el) => (el ? formatArgument(el) : ""))
      .filter(Boolean);
    return `[${elements.join(", ")}]`;
  }
  if (node.type === "ObjectExpression") {
    return "{...}";
  }
  return "...";
}

export function formatExpression(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const astNode = node as AstNode;

  if (astNode.type === "Identifier" && typeof astNode["name"] === "string") {
    return astNode["name"];
  }

  if (astNode.type === "MemberExpression") {
    const obj = formatExpression(astNode["object"]);
    const prop = formatExpression(astNode["property"]);
    return obj && prop ? `${obj}.${prop}` : prop || obj;
  }

  if (astNode.type === "CallExpression") {
    const callee = formatExpression(astNode["callee"]) || "middleware";
    const rawArgs = Array.isArray(astNode["arguments"])
      ? (astNode["arguments"] as unknown[])
          .map((arg) => formatArgument(arg))
          .filter((v): v is string => v !== null)
      : [];
    return `${callee}(${rawArgs.join(", ")})`;
  }

  return getExpressionName(node);
}

export interface ParsedMiddleware {
  name: string;
  callee: string;
  args: string[];
  isCallExpression: boolean;
  location: SourceLocation | null;
}

export function parseMiddlewareNode(node: AstNode, filePath: string): ParsedMiddleware {
  const loc = extractSourceLocation(node, filePath);
  if (node.type === "CallExpression") {
    const callee = formatExpression(node["callee"]) || "middleware";
    const rawArgs = Array.isArray(node["arguments"])
      ? (node["arguments"] as unknown[])
          .map((arg) => formatArgument(arg))
          .filter((v): v is string => v !== null)
      : [];
    const name = `${callee}(${rawArgs.join(", ")})`;
    return {
      name,
      callee,
      args: rawArgs,
      isCallExpression: true,
      location: loc,
    };
  }

  const name = formatExpression(node) || getExpressionName(node) || "middleware";
  return {
    name,
    callee: name,
    args: [],
    isCallExpression: false,
    location: loc,
  };
}
