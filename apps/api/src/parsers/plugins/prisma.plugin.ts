import path from "node:path";
import fs from "node:fs/promises";
import type {
  ParserPlugin,
  ParsedOutput,
  NormalizedEntity,
  NormalizedRelationship,
} from "../types.js";

interface PrismaField {
  name: string;
  type: string;
  isId: boolean;
  isUnique: boolean;
  isOptional: boolean;
  relationTarget?: string;
}

export class PrismaParserPlugin implements ParserPlugin {
  readonly id = "prisma-parser";
  readonly name = "Prisma Schema Parser";
  readonly version = "1.0.0";

  supports(_repoPath: string, technologies: Set<string>): boolean {
    return technologies.has("Prisma");
  }

  async collectFiles(repoPath: string): Promise<string[]> {
    const collected: string[] = [];
    const IGNORED = new Set([".git", "node_modules", "dist", "build"]);

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
        } else if (entry.endsWith(".prisma")) {
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
      let schemaText = "";
      try {
        schemaText = await fs.readFile(filePath, "utf-8");
      } catch (err) {
        warnings.push(`Could not read Prisma schema ${relativePath}: ${String(err)}`);
        continue;
      }

      const lines = schemaText.split("\n");
      let currentModel: { name: string; fields: PrismaField[]; tableName?: string } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || "";
        if (!line || line.startsWith("//")) continue;

        // Model declaration: model User {
        const modelMatch = line.match(/^model\s+([A-Za-z0-9_]+)\s*\{/);
        if (modelMatch && modelMatch[1]) {
          currentModel = {
            name: modelMatch[1],
            fields: [],
          };
          continue;
        }

        // Inside model block
        if (currentModel) {
          if (line.startsWith("}")) {
            // End of model block
            const modelEntity: NormalizedEntity = {
              id: `model:${currentModel.name}`,
              type: "model",
              name: currentModel.name,
              filePath: relativePath,
              metadata: {
                modelName: currentModel.name,
                tableName: currentModel.tableName || currentModel.name.toLowerCase(),
                fieldsCount: currentModel.fields.length,
                fields: currentModel.fields,
              },
            };
            entities.push(modelEntity);

            // Register relationships for fields referencing other models
            for (const field of currentModel.fields) {
              if (field.relationTarget) {
                relationships.push({
                  sourceId: `model:${currentModel.name}`,
                  targetId: `model:${field.relationTarget}`,
                  type: "queries",
                  metadata: {
                    field: field.name,
                    relationType: "Prisma Relation",
                  },
                });
              }
            }

            currentModel = null;
            continue;
          }

          // Check @@map("table_name")
          const mapMatch = line.match(/^@@map\("([^"]+)"\)/);
          if (mapMatch && mapMatch[1]) {
            currentModel.tableName = mapMatch[1];
            continue;
          }

          // Field line: e.g. "id String @id @default(uuid())" or "owner User @relation(...)"
          const fieldTokens = line.split(/\s+/);
          if (fieldTokens.length >= 2) {
            const fieldName = fieldTokens[0];
            const fieldTypeRaw = fieldTokens[1];
            if (fieldName && fieldTypeRaw && !fieldName.startsWith("@")) {
              const isOptional = fieldTypeRaw.endsWith("?");
              const fieldType = fieldTypeRaw.replace(/[?[\]]/g, "");
              const isId = line.includes("@id");
              const isUnique = line.includes("@unique");

              const fieldInfo: PrismaField = {
                name: fieldName,
                type: fieldType,
                isId,
                isUnique,
                isOptional,
              };

              // If fieldType is likely another model (capitalized and not scalar)
              const SCALARS = new Set([
                "String",
                "Boolean",
                "Int",
                "BigInt",
                "Float",
                "Decimal",
                "DateTime",
                "Json",
                "Bytes",
              ]);

              if (!SCALARS.has(fieldType) && /^[A-Z]/.test(fieldType)) {
                fieldInfo.relationTarget = fieldType;
              }

              currentModel.fields.push(fieldInfo);
            }
          }
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

export const prismaParserPlugin = new PrismaParserPlugin();
