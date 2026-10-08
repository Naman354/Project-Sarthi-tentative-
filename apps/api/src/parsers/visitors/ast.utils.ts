import { parse, type ParserPlugin as BabelParserPlugin } from "@babel/parser";

export interface AstNode {
  type: string;
  [key: string]: unknown;
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
