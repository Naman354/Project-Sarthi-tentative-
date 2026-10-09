import { graphBuilder } from "../../src/graph/builder.js";
import { graphValidator } from "../../src/graph/validator.js";
import type {
  NormalizedEntity,
  NormalizedRelationship,
  ParserManagerResult,
} from "../../src/parsers/types.js";

export async function runGraphTests(): Promise<{ name: string; passed: number; failed: number }> {
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

  console.log("\n  [Suite: Graph Builder & Validator]");

  // Mock Entities
  const entities: NormalizedEntity[] = [
    {
      id: "module:auth",
      type: "module",
      name: "Auth",
      filePath: "src/routes/auth.routes.ts",
      metadata: {},
    },
    {
      id: "route:post_login",
      type: "route",
      name: "POST /auth/login",
      filePath: "src/routes/auth.routes.ts",
      metadata: { method: "POST", path: "/auth/login" },
    },
    {
      id: "controller:auth",
      type: "controller",
      name: "AuthController",
      filePath: "src/controllers/auth.controller.ts",
      metadata: {},
    },
    {
      id: "service:auth",
      type: "service",
      name: "AuthService",
      filePath: "src/services/auth.service.ts",
      metadata: {},
    },
    {
      id: "model:user",
      type: "model",
      name: "User",
      filePath: "prisma/schema.prisma",
      metadata: {},
    },
    {
      id: "doc:readme",
      type: "doc",
      name: "README.md",
      filePath: "README.md",
      metadata: {},
    },
  ];

  // Mock Relationships
  const relationships: NormalizedRelationship[] = [
    {
      sourceId: "module:auth",
      targetId: "route:post_login",
      type: "contains",
    },
    {
      sourceId: "route:post_login",
      targetId: "controller:auth",
      type: "handled_by",
    },
    {
      sourceId: "controller:auth",
      targetId: "service:auth",
      type: "uses",
    },
    {
      sourceId: "service:auth",
      targetId: "model:user",
      type: "queries",
    },
    {
      sourceId: "doc:readme",
      targetId: "module:auth",
      type: "documents",
    },
  ];

  // 1. Validator Tests
  console.log("   Scenario: Entity & Relationship Validation");
  const validation = graphValidator.validate(entities, relationships);
  assert(
    validation.nodes.length === entities.length,
    "Transforms all clean entities into GraphNodes"
  );
  assert(
    validation.edges.length === relationships.length,
    "Transforms all valid relationships into GraphEdges"
  );

  // Invalid relationship test (referencing non-existent entity)
  const brokenRelationships: NormalizedRelationship[] = [
    ...relationships,
    {
      sourceId: "non-existent-source",
      targetId: "model:user",
      type: "uses",
    },
  ];
  const invalidResult = graphValidator.validate(entities, brokenRelationships);
  assert(
    invalidResult.stats.orphanEdgesDropped >= 1,
    "Catches and drops dangling relationships to non-existent nodes"
  );

  // 2. Graph Builder Pipeline Tests
  console.log("   Scenario: Topological Graph Transformation");
  const mockParserResult: ParserManagerResult = {
    technologies: { technologies: ["Express", "Prisma"], details: {} },
    entities,
    relationships,
    warnings: [],
    stats: {
      totalEntities: entities.length,
      totalRelationships: relationships.length,
      modulesCount: 1,
      routesCount: 1,
      modelsCount: 1,
      componentsCount: 0,
      docsCount: 1,
      durationMs: 15,
    },
  };

  const buildResult = graphBuilder.build(mockParserResult);

  assert(buildResult.nodes.length === entities.length, "Transforms entities into GraphNodes");
  assert(
    buildResult.edges.length === relationships.length,
    "Transforms relationships into GraphEdges"
  );

  // Verify node type mapping
  const routeNode = buildResult.nodes.find((n) => n.name === "POST /auth/login");
  assert(routeNode !== undefined, "Contains POST /auth/login node");
  assert(routeNode?.nodeType === "route", "Node type correctly assigned as route");

  const userModelNode = buildResult.nodes.find((n) => n.name === "User");
  assert(userModelNode !== undefined, "Contains User model node");
  assert(userModelNode?.nodeType === "model", "Node type correctly assigned as model");

  // 3. Deduplication Test
  console.log("   Scenario: Duplicate Node Deduplication");
  const duplicatedEntities: NormalizedEntity[] = [
    ...entities,
    {
      id: "model:user-dup",
      type: "model",
      name: "User", // Identical type + name
      filePath: "prisma/schema.prisma",
      metadata: { table: "users" },
    },
  ];
  const dedupValidation = graphValidator.validate(duplicatedEntities, relationships);
  assert(
    dedupValidation.stats.nodesDeduplicated >= 1,
    "Deduplicates nodes with identical type and name"
  );
  assert(
    dedupValidation.nodes.length === entities.length,
    "Retains distinct unique nodes after deduplication"
  );

  return { name: "Graph Builder & Validator", passed, failed };
}
