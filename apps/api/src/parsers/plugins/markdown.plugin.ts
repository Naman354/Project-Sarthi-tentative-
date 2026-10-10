import path from "node:path";
import fs from "node:fs/promises";
import type {
  ParserPlugin,
  ParsedOutput,
  NormalizedEntity,
  NormalizedRelationship,
  SourceLocation,
} from "../types.js";

interface DocHeading {
  level: number;
  text: string;
  line: number;
}

export class MarkdownParserPlugin implements ParserPlugin {
  readonly id = "markdown-parser";
  readonly name = "Markdown Documentation Parser";
  readonly version = "1.0.0";

  supports(_repoPath: string, technologies: Set<string>): boolean {
    return technologies.has("Markdown");
  }

  async collectFiles(repoPath: string): Promise<string[]> {
    const collected: string[] = [];
    const IGNORED = new Set([".git", "node_modules", "dist", "build", ".next"]);

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
        } else if (entry.endsWith(".md") || entry.endsWith(".markdown")) {
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
      let content = "";
      try {
        content = await fs.readFile(filePath, "utf-8");
      } catch (err) {
        warnings.push(`Could not read Markdown file ${relativePath}: ${String(err)}`);
        continue;
      }

      const lines = content.split("\n");
      const headings: DocHeading[] = [];
      let docTitle = path.basename(filePath);
      let foundMainTitle = false;
      let codeBlockCount = 0;
      let inCodeBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
          if (!inCodeBlock) codeBlockCount++;
          inCodeBlock = !inCodeBlock;
          continue;
        }

        if (!inCodeBlock) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (match && match[1] && match[2]) {
            const level = match[1].length;
            const text = match[2].trim();
            headings.push({ level, text, line: i + 1 });

            if (level === 1 && !foundMainTitle) {
              docTitle = text;
              foundMainTitle = true;
            }
          }
        }
      }

      const docLoc: SourceLocation = {
        filePath: relativePath,
        startLine: 1,
        startColumn: 0,
        endLine: Math.max(1, lines.length),
        endColumn: lines[lines.length - 1]?.length ?? 0,
      };

      const docId = `doc:${relativePath}`;
      const docEntity: NormalizedEntity = {
        id: docId,
        type: "doc",
        name: docTitle,
        filePath: relativePath,
        location: docLoc,
        metadata: {
          title: docTitle,
          headingsCount: headings.length,
          headings: headings.slice(0, 15),
          codeBlockCount,
          lineCount: lines.length,
          wordCount: content.split(/\s+/).filter(Boolean).length,
          location: docLoc,
        },
      };
      entities.push(docEntity);

      // Section child entities for major H2 headings
      for (let hIdx = 0; hIdx < headings.length; hIdx++) {
        const heading = headings[hIdx]!;
        if (heading.level === 2) {
          const sectionId = `doc:${relativePath}#${heading.text.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`;
          let endLine = lines.length;
          for (let nextH = hIdx + 1; nextH < headings.length; nextH++) {
            if (headings[nextH]!.level <= 2) {
              endLine = Math.max(heading.line, headings[nextH]!.line - 1);
              break;
            }
          }
          const sectionLoc: SourceLocation = {
            filePath: relativePath,
            startLine: heading.line,
            startColumn: 0,
            endLine,
            endColumn: lines[endLine - 1]?.length ?? 0,
          };
          const sectionEntity: NormalizedEntity = {
            id: sectionId,
            type: "doc",
            name: `${docTitle} › ${heading.text}`,
            filePath: relativePath,
            location: sectionLoc,
            metadata: {
              heading: heading.text,
              level: heading.level,
              parentDocId: docId,
              location: sectionLoc,
            },
          };
          entities.push(sectionEntity);

          relationships.push({
            sourceId: docId,
            targetId: sectionId,
            type: "contains",
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

export const markdownParserPlugin = new MarkdownParserPlugin();
