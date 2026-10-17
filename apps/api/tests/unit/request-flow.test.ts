import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { expressParserPlugin } from "../../src/parsers/plugins/express.plugin.js";
import { graphValidator } from "../../src/graph/validator.js";

export async function runRequestFlowTests(): Promise<{
  name: string;
  passed: number;
  failed: number;
}> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`    PASS: ${testName}`);
      passed++;
    } else {
      console.error(`    FAIL: ${testName}`);
      failed++;
    }
  }

  console.log("\n  [Suite: Request Flow Explorer & AST Verification]");
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sarthi-request-flow-test-"));

  try {
    const modulesDir = path.join(tempDir, "src", "modules", "auth");
    const middlewareDir = path.join(tempDir, "src", "middleware");
    await fs.mkdir(modulesDir, { recursive: true });
    await fs.mkdir(middlewareDir, { recursive: true });

    // 1. Controller file with actual implementation
    await fs.writeFile(
      path.join(modulesDir, "auth.controller.ts"),
      `
import { Request, Response, NextFunction } from "express";

export class AuthController {
  static async studentLogin(req: Request, res: Response) {
    return res.json({ token: "student-token" });
  }

  static async refreshSession(req: Request, res: Response) {
    return res.json({ refreshed: true });
  }
}
      `.trim()
    );

    // 2. Middleware files
    await fs.writeFile(
      path.join(middlewareDir, "auth.middleware.ts"),
      `
export function authenticateJWT(req, res, next) { next(); }
export function requireRole(role: string) {
  return (req, res, next) => next();
}
      `.trim()
    );

    await fs.writeFile(
      path.join(middlewareDir, "contestGuard.ts"),
      `
export function contestGuard(req, res, next) { next(); }
      `.trim()
    );

    // 3. Realistic routes file matching BRL Quiz Portal pattern
    const routesFilePath = path.join(modulesDir, "auth.routes.ts");
    await fs.writeFile(
      routesFilePath,
      `
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";
import { contestGuard } from "../../middleware/contestGuard";

const router = Router();

router.post("/student/refresh-session", authenticateJWT, requireRole('STUDENT'), contestGuard, AuthController.refreshSession);
router.post("/admin/refresh-session", authenticateJWT, requireRole('ADMIN'), AuthController.refreshSession);
router.delete("/unresolved-target", externalOrUnknownHandler);
router.get("/inline-health", (req, res) => res.send("ok"));

export default router;
      `.trim()
    );

    // Run express parser
    const files = await expressParserPlugin.collectFiles(tempDir);
    const parsed = await expressParserPlugin.parse(tempDir, files);

    const routes = parsed.entities.filter((e) => e.type === "route");
    const controllers = parsed.entities.filter((e) => e.type === "controller");

    // 1. Extraction of identifier middleware
    console.log("   Scenario 1: Extraction of Identifier Middleware");
    const refreshRoute = routes.find((r) => r.name === "POST /student/refresh-session");
    assert(Boolean(refreshRoute), "Found POST /student/refresh-session route entity");

    const mwNames = (refreshRoute?.metadata.middleware as string[]) || [];
    assert(
      mwNames.includes("authenticateJWT"),
      "Identifies identifier middleware 'authenticateJWT'"
    );
    assert(mwNames.includes("contestGuard"), "Identifies identifier middleware 'contestGuard'");

    // 2. Extraction of call-expression middleware including requireRole('STUDENT')
    console.log("   Scenario 2: Extraction of Call-Expression Middleware with Arguments");
    assert(
      mwNames.includes("requireRole('STUDENT')"),
      "Extracts requireRole('STUDENT') without degrading to generic 'middleware'"
    );
    assert(!mwNames.includes("middleware"), "Does not contain fallback 'middleware' label");

    // 3. Preservation of declaration order and meaningful arguments
    console.log("   Scenario 3: Middleware Declaration Order & Argument Differentiation");
    assert(
      mwNames.length === 3,
      `Extracted exactly 3 middlewares in order (actual: ${mwNames.length})`
    );
    assert(mwNames[0] === "authenticateJWT", "Step 1 is authenticateJWT");
    assert(mwNames[1] === "requireRole('STUDENT')", "Step 2 is requireRole('STUDENT')");
    assert(mwNames[2] === "contestGuard", "Step 3 is contestGuard");

    const adminRoute = routes.find((r) => r.name === "POST /admin/refresh-session");
    const adminMwNames = (adminRoute?.metadata.middleware as string[]) || [];
    assert(
      adminMwNames.includes("requireRole('ADMIN')"),
      "Differentiates requireRole('ADMIN') from requireRole('STUDENT')"
    );

    // 4. Correct route source coordinates
    console.log("   Scenario 4: Route Declaration Source Coordinates");
    assert(Boolean(refreshRoute?.location), "Route has source location object");
    assert(
      typeof refreshRoute?.location?.startLine === "number" && refreshRoute.location.startLine > 0,
      `Route startLine is valid positive integer (actual: ${refreshRoute?.location?.startLine})`
    );
    assert(
      typeof refreshRoute?.location?.endLine === "number" &&
        refreshRoute.location.endLine >= (refreshRoute.location.startLine || 0),
      `Route endLine is greater than or equal to startLine (actual: ${refreshRoute?.location?.endLine})`
    );
    assert(
      refreshRoute?.filePath.includes("auth.routes.ts") || false,
      "Route location points to auth.routes.ts"
    );

    // 5. Correct handler relationships and honest behavior for resolution
    console.log("   Scenario 5: Handler Relationships & Honest Implementation Resolution");
    const resolvedController = controllers.find((c) => c.name === "AuthController.refreshSession");
    assert(Boolean(resolvedController), "Found AuthController.refreshSession controller entity");
    assert(
      resolvedController?.metadata.implementationResolved === true,
      "Marks AuthController.refreshSession implementation as resolved"
    );
    assert(
      resolvedController?.filePath.includes("auth.controller.ts") || false,
      `Resolved controller filePath points to auth.controller.ts (actual: ${resolvedController?.filePath})`
    );
    assert(
      typeof resolvedController?.location?.startLine === "number",
      "Resolved controller has source line number in controller file"
    );

    const unresolvedRoute = routes.find((r) => r.name === "DELETE /unresolved-target");
    assert(Boolean(unresolvedRoute), "Found DELETE /unresolved-target route");
    const unresolvedController = controllers.find((c) => c.name === "externalOrUnknownHandler");
    assert(Boolean(unresolvedController), "Found externalOrUnknownHandler controller entity");
    assert(
      unresolvedController?.metadata.implementationResolved === false,
      "Honestly marks unresolved handler as implementationResolved: false"
    );
    assert(
      unresolvedController?.filePath.includes("auth.routes.ts") || false,
      "Unresolved handler destination falls back to declaration route file"
    );

    const inlineRoute = routes.find((r) => r.name === "GET /inline-health");
    assert(Boolean(inlineRoute), "Found GET /inline-health route");
    const inlineController = controllers.find((c) => c.name === "inlineHandler");
    assert(Boolean(inlineController), "Found inlineHandler controller entity");
    assert(
      inlineController?.metadata.implementationResolved === true,
      "Marks inline handler as resolved in-place"
    );

    // 6. Graph validation and compatibility
    console.log("   Scenario 6: Graph Builder & Validator Payload Compatibility");
    const validation = graphValidator.validate(parsed.entities, parsed.relationships);
    const routeNode = validation.nodes.find((n) => n.name === "POST /student/refresh-session");
    assert(Boolean(routeNode), "Route Node created in graph");
    assert(
      Array.isArray(routeNode?.metadata.middleware) &&
        (routeNode?.metadata.middleware as string[])[1] === "requireRole('STUDENT')",
      "Route GraphNode metadata preserves middleware array with call arguments"
    );

    const handledByEdge = validation.edges.find(
      (e) => e.relationshipType === "handled_by" && e.sourceNodeId === routeNode?.id
    );
    assert(
      Boolean(handledByEdge),
      "Verified handled_by edge connects Route Node to Controller Node"
    );

    const targetControllerNode = validation.nodes.find((n) => n.id === handledByEdge?.targetNodeId);
    assert(
      targetControllerNode?.name === "AuthController.refreshSession",
      "Handled_by edge targets AuthController.refreshSession"
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return { name: "Request Flow Explorer & AST Verification", passed, failed };
}
