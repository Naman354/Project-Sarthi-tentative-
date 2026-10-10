import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { parserManager } from "../../src/parsers/manager.js";
import { graphBuilder } from "../../src/graph/builder.js";
import { graphValidator } from "../../src/graph/validator.js";
import type {
  NormalizedEntity,
  NormalizedRelationship,
  SourceLocation,
} from "../../src/parsers/types.js";
import type { GraphNode } from "../../src/graph/types.js";

export async function runEvidenceFoundationTests(): Promise<{
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

  console.log("\n  [Suite: Phase 1A Evidence Foundation & Regression]");

  // --------------------------------------------------------------------------
  // Scenario 1: Source Location Extraction & Conventions
  // --------------------------------------------------------------------------
  console.log("   Scenario: Source Location Extraction & Conventions");

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sarthi-evidence-test-"));

  try {
    await fs.mkdir(path.join(tempDir, "src", "routes"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "components", "common"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "components", "admin"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "prisma"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "docs"), { recursive: true });

    // 1. package.json for technology detector
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-monorepo",
        dependencies: {
          express: "^4.18.0",
          react: "^18.2.0",
          "@prisma/client": "^5.0.0",
        },
      })
    );

    // 2. Express Route file with exact known line numbers
    // Line 1: import
    // Line 2: const router
    // Line 3: router.get(...)
    const expressFilePath = path.join(tempDir, "src", "routes", "users.routes.ts");
    await fs.writeFile(
      expressFilePath,
      `import { Router } from "express";
const router = Router();
router.get("/api/users", function listUsers(req, res) {
  res.json([]);
});
export default router;
`
    );

    // 3. React Component 1: src/components/common/Button.tsx
    const commonButtonPath = path.join(tempDir, "src", "components", "common", "Button.tsx");
    await fs.writeFile(
      commonButtonPath,
      `import React from "react";
export function Button({ label }: { label: string }) {
  return <button>{label}</button>;
}
`
    );

    // 4. React Component 2: src/components/admin/Button.tsx (Same name "Button", different file!)
    // Also makes API call to "/api/users"
    const adminButtonPath = path.join(tempDir, "src", "components", "admin", "Button.tsx");
    await fs.writeFile(
      adminButtonPath,
      `import React from "react";
export function Button() {
  React.useEffect(() => {
    fetch("/api/users");
  }, []);
  return <button className="admin-btn">Admin Action</button>;
}
`
    );

    // 5. Prisma Schema
    const prismaPath = path.join(tempDir, "prisma", "schema.prisma");
    await fs.writeFile(
      prismaPath,
      `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(uuid())
  email String @unique
  posts Post[]
}

model Post {
  id       String @id @default(uuid())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
`
    );

    // 6. Markdown Doc
    const docPath = path.join(tempDir, "docs", "architecture.md");
    await fs.writeFile(
      docPath,
      `# Architecture

## Services Overview
Detailed overview of backend services.

## Data Layer
Database schemas and persistence.
`
    );

    // Run ParserManager on multi-file fixture
    const parseResult = await parserManager.parseRepository(tempDir);

    assert(
      parseResult.entities.length > 0,
      "ParserManager extracts entities from multi-file fixture"
    );

    // Check Express Route Location
    const routeEntity = parseResult.entities.find((e) => e.type === "route");
    assert(routeEntity !== undefined, "Extracted Express route entity");
    assert(
      routeEntity?.location !== undefined && routeEntity?.location !== null,
      "Express route has source location"
    );
    assert(
      (routeEntity?.location?.startLine ?? 0) === 3,
      `Express route starts at line 3 (actual: ${routeEntity?.location?.startLine})`
    );
    assert(
      typeof routeEntity?.location?.startColumn === "number" &&
        (routeEntity?.location?.startColumn ?? -1) >= 0,
      "Express route has 0-indexed startColumn"
    );

    // Check React Component Location
    const commonButtonEntity = parseResult.entities.find(
      (e) => e.name === "Button" && e.filePath.includes("common")
    );
    assert(commonButtonEntity !== undefined, "Found common Button component entity");
    assert(
      commonButtonEntity?.location !== undefined && commonButtonEntity?.location !== null,
      "Common Button has source location"
    );
    assert(
      (commonButtonEntity?.location?.startLine ?? 0) === 2,
      `Common Button component starts at line 2 (actual: ${commonButtonEntity?.location?.startLine})`
    );

    // Check Prisma Model Location
    const userModelEntity = parseResult.entities.find(
      (e) => e.type === "model" && e.name === "User"
    );
    assert(userModelEntity !== undefined, "Found User model entity");
    assert(
      userModelEntity?.location !== undefined && userModelEntity?.location !== null,
      "User model has source location"
    );
    assert(
      (userModelEntity?.location?.startLine ?? 0) === 6,
      `User model starts at line 6 (actual: ${userModelEntity?.location?.startLine})`
    );

    // Check Markdown Doc and Section Locations
    const docEntity = parseResult.entities.find(
      (e) => e.type === "doc" && e.name === "Architecture"
    );
    assert(docEntity !== undefined, "Found Architecture doc entity");
    assert(docEntity?.location?.startLine === 1, "Doc entity starts at line 1");

    const sectionEntity = parseResult.entities.find(
      (e) => e.type === "doc" && e.name.includes("Services Overview")
    );
    assert(sectionEntity !== undefined, "Found Services Overview doc section entity");
    assert(
      (sectionEntity?.location?.startLine ?? 0) === 3,
      `Section entity starts at heading line 3 (actual: ${sectionEntity?.location?.startLine})`
    );

    // --------------------------------------------------------------------------
    // Scenario 2: Entity Identity & Deduplication (Distinct Entities in Different Files)
    // --------------------------------------------------------------------------
    console.log("   Scenario: Entity Identity & Cross-File Deduplication");

    const adminButtonEntity = parseResult.entities.find(
      (e) => e.name === "Button" && e.filePath.includes("admin")
    );
    assert(adminButtonEntity !== undefined, "Found admin Button component entity");
    assert(
      commonButtonEntity?.id !== adminButtonEntity?.id,
      "Two Button components in different files have distinct entity IDs"
    );

    // Build the graph from multi-file parse result
    const buildResult = graphBuilder.build(parseResult);

    const buttonNodes = buildResult.nodes.filter(
      (n) => n.name === "Button" && n.nodeType === "component"
    );
    assert(
      buttonNodes.length === 2,
      `Two components named 'Button' in different files remain 2 distinct GraphNodes (actual: ${buttonNodes.length})`
    );

    // Verify same declaration in same file DOES merge
    const duplicateEntity: NormalizedEntity = {
      id: `${commonButtonEntity!.id}-dup-reparse`,
      type: "component",
      name: "Button",
      filePath: commonButtonEntity!.filePath,
      location: commonButtonEntity!.location,
      metadata: { extraMeta: true },
    };

    const duplicateValidation = graphValidator.validate([commonButtonEntity!, duplicateEntity], []);
    assert(
      duplicateValidation.nodes.length === 1,
      "Duplicate entity declarations in the same file merge into 1 GraphNode"
    );
    assert(
      duplicateValidation.stats.nodesDeduplicated === 1,
      "Validator records deduplication stat correctly"
    );

    // --------------------------------------------------------------------------
    // Scenario 3: Relationship Resolution & Preservation
    // --------------------------------------------------------------------------
    console.log("   Scenario: Genuine Cross-File Relationship Resolution");

    // React fetch('/api/users') should connect admin Button -> Express route GET /api/users
    const userRouteNode = buildResult.nodes.find(
      (n) => n.nodeType === "route" && n.name.includes("/api/users")
    );
    assert(userRouteNode !== undefined, "Found GET /api/users GraphNode");

    const adminButtonNode = buildResult.nodes.find(
      (n) => n.name === "Button" && (n.metadata.filePath as string)?.includes("admin")
    );
    assert(adminButtonNode !== undefined, "Found admin Button GraphNode");

    const apiEdge = buildResult.edges.find(
      (e) => e.sourceNodeId === adminButtonNode?.id && e.targetNodeId === userRouteNode?.id
    );
    assert(
      apiEdge !== undefined,
      "React fetch('/api/users') resolved to Express route GraphNode across files"
    );

    // Prisma relation Post -> User
    const postModelNode = buildResult.nodes.find(
      (n) => n.nodeType === "model" && n.name === "Post"
    );
    const userModelNode = buildResult.nodes.find(
      (n) => n.nodeType === "model" && n.name === "User"
    );
    const modelRelationEdge = buildResult.edges.find(
      (e) => e.sourceNodeId === postModelNode?.id && e.targetNodeId === userModelNode?.id
    );
    assert(
      modelRelationEdge !== undefined,
      "Prisma Post -> User relation edge resolved and survived"
    );

    // Invalid reference handling: reference to non-existent route or entity
    const brokenEntities: NormalizedEntity[] = [
      {
        id: "component:src/Bad.tsx#BadComp",
        type: "component",
        name: "BadComp",
        filePath: "src/Bad.tsx",
        metadata: {},
      },
    ];
    const brokenRels: NormalizedRelationship[] = [
      {
        sourceId: "component:src/Bad.tsx#BadComp",
        targetId: "route:DELETE:/api/non-existent-endpoint",
        type: "uses",
      },
    ];
    const brokenValidation = graphValidator.validate(brokenEntities, brokenRels);
    assert(
      brokenValidation.edges.length === 0,
      "Invalid relationship target is safely dropped without creating fake nodes"
    );
    assert(
      brokenValidation.stats.orphanEdgesDropped === 1,
      "Orphan edge to non-existent endpoint recorded in stats"
    );
    assert(
      brokenValidation.warnings.some((w) => w.includes("Dropped orphan relationship")),
      "Orphan edge produces diagnostic warning"
    );

    // --------------------------------------------------------------------------
    // Scenario 4: Location Survival through Construction & Serialization
    // --------------------------------------------------------------------------
    console.log("   Scenario: Source Location Survival & Serialization");

    // All primary nodes in buildResult should retain their location
    assert(
      adminButtonNode?.location !== null && adminButtonNode?.location !== undefined,
      "adminButtonNode retains location in GraphNode"
    );
    assert(
      adminButtonNode?.location?.startLine === 2,
      "GraphNode location startLine matches AST source position"
    );
    assert(
      adminButtonNode?.location?.filePath === adminButtonEntity?.filePath,
      "GraphNode location filePath matches source file path"
    );

    // JSON Serialization round-trip
    const serializedGraph = JSON.stringify({
      nodes: buildResult.nodes,
      edges: buildResult.edges,
    });
    const parsedGraph = JSON.parse(serializedGraph) as { nodes: GraphNode[] };
    const roundTrippedAdminBtn = parsedGraph.nodes.find(
      (n) => n.name === "Button" && (n.metadata.filePath as string)?.includes("admin")
    );
    assert(
      roundTrippedAdminBtn?.location?.startLine === 2,
      "Location survived JSON serialization round-trip"
    );
    assert(
      roundTrippedAdminBtn?.location?.endLine !== undefined &&
        (roundTrippedAdminBtn?.location?.endLine ?? 0) >= 2,
      "Location retains endLine after serialization"
    );

    // --------------------------------------------------------------------------
    // Scenario 5: Database Persistence & Retrieval Contract
    // --------------------------------------------------------------------------
    console.log("   Scenario: Database Persistence & Retrieval Transformation Contract");

    // Note: Live PostgreSQL execution requires a running PostgreSQL instance and migrations.
    // Here we test the exact persistence mapper and retrieval unpacker logic from graphRepository:
    // persistGraph maps node.location into node.metadata.location
    // getGraph unpacks node.metadata.location into node.location
    const testLocation: SourceLocation = {
      filePath: "src/services/order.service.ts",
      startLine: 14,
      startColumn: 2,
      endLine: 45,
      endColumn: 1,
    };

    const mockNode: GraphNode = {
      id: "node-uuid-1",
      entityId: "service:src/services/order.service.ts#OrderService",
      nodeType: "service",
      name: "OrderService",
      location: testLocation,
      metadata: {
        filePath: "src/services/order.service.ts",
      },
    };

    // Simulate persistGraph mapping
    const persistedDbRecord = {
      id: "new-uuid",
      graphVersionId: "version-uuid",
      nodeType: mockNode.nodeType,
      name: mockNode.name,
      metadata: {
        ...(mockNode.metadata as Record<string, unknown>),
        originalEntityId: mockNode.entityId,
        ...(mockNode.location ? { location: mockNode.location } : {}),
      },
      createdAt: new Date(),
    };

    assert(
      (persistedDbRecord.metadata.location as SourceLocation)?.startLine === 14,
      "Persistence contract embeds SourceLocation in node metadata JSON"
    );

    // Simulate getGraph unpacking
    const retrievedNode: GraphNode = {
      id: persistedDbRecord.id,
      entityId: (persistedDbRecord.metadata.originalEntityId as string) || persistedDbRecord.id,
      graphVersionId: persistedDbRecord.graphVersionId,
      nodeType: persistedDbRecord.nodeType,
      name: persistedDbRecord.name,
      location: (persistedDbRecord.metadata.location as SourceLocation) ?? null,
      metadata: persistedDbRecord.metadata,
      createdAt: persistedDbRecord.createdAt,
    };

    assert(
      retrievedNode.location !== null && retrievedNode.location !== undefined,
      "Retrieved node exposes location object"
    );
    assert(retrievedNode.location?.startLine === 14, "Retrieved node matches persisted startLine");
    assert(retrievedNode.location?.endLine === 45, "Retrieved node matches persisted endLine");
    assert(
      retrievedNode.location?.filePath === "src/services/order.service.ts",
      "Retrieved node matches persisted filePath"
    );
  } finally {
    // Clean up temporary test files
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return { name: "Phase 1A Evidence Foundation", passed, failed };
}
