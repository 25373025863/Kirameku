import { parse } from "yaml";

export const MAX_MARKDOWN_FILE_SIZE = 4 * 1024 * 1024;

export type MarkdownImportDraft = {
  sourceName: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  cover: string;
  category: string;
  tags: string[];
};

type FrontMatter = Record<string, unknown>;

let pendingDraft: MarkdownImportDraft | null = null;

function scalarToText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

function getFrontMatterText(frontMatter: FrontMatter, keys: string[]) {
  for (const key of keys) {
    const value = scalarToText(frontMatter[key]);
    if (value) return value;
  }
  return "";
}

function getFrontMatterTags(frontMatter: FrontMatter): string[] {
  const value = frontMatter.tags ?? frontMatter.tag;
  const values = Array.isArray(value)
    ? value.map(scalarToText)
    : scalarToText(value).split(/[,，]/);

  return [...new Set(values.map(item => item.trim()).filter(Boolean))];
}

function splitFrontMatter(markdown: string) {
  const lines = markdown
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  if (lines[0]?.trim() !== "---") {
    return { frontMatter: {} as FrontMatter, content: lines.join("\n") };
  }

  const endIndex = lines.findIndex(
    (line, index) => index > 0 && ["---", "..."].includes(line.trim())
  );
  if (endIndex < 0) {
    throw new Error("Markdown 的 Front Matter 缺少结束标记");
  }

  let parsed: unknown;
  try {
    parsed = parse(lines.slice(1, endIndex).join("\n"));
  } catch (error: any) {
    throw new Error(`Front Matter 格式不正确：${error?.message ?? "解析失败"}`);
  }

  if (parsed != null && (typeof parsed !== "object" || Array.isArray(parsed))) {
    throw new Error("Front Matter 必须是键值结构");
  }

  return {
    frontMatter: (parsed ?? {}) as FrontMatter,
    content: lines
      .slice(endIndex + 1)
      .join("\n")
      .replace(/^\n+/, "")
  };
}

function findFirstHeading(markdown: string) {
  let fence = "";
  for (const line of markdown.split("\n")) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      fence = fence ? "" : fenceMatch[1][0];
      continue;
    }
    if (fence) continue;

    const heading = line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (heading) return heading[1].trim();
  }
  return "";
}

function createSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function validateMarkdownFile(file: File) {
  if (!/\.(?:md|markdown)$/i.test(file.name)) {
    throw new Error("请选择 .md 或 .markdown 文件");
  }
  if (!file.size) throw new Error("Markdown 文件内容为空");
  if (file.size > MAX_MARKDOWN_FILE_SIZE) {
    throw new Error("Markdown 文件不能超过 4 MB");
  }
}

export async function parseMarkdownFile(
  file: File
): Promise<MarkdownImportDraft> {
  validateMarkdownFile(file);
  const markdown = await file.text();
  const { frontMatter, content } = splitFrontMatter(markdown);
  if (!content.trim()) throw new Error("Markdown 正文内容为空");

  const fileTitle = file.name.replace(/\.(?:md|markdown)$/i, "").trim();
  const title =
    getFrontMatterText(frontMatter, ["title", "name"]) ||
    findFirstHeading(content) ||
    fileTitle;
  const requestedSlug =
    getFrontMatterText(frontMatter, ["slug", "permalink"]) ||
    fileTitle ||
    title;

  return {
    sourceName: file.name,
    title,
    slug: createSlug(requestedSlug) || `post-${Date.now().toString(36)}`,
    description: getFrontMatterText(frontMatter, [
      "description",
      "summary",
      "excerpt"
    ]),
    content,
    cover: getFrontMatterText(frontMatter, [
      "cover",
      "image",
      "banner",
      "heroImage"
    ]),
    category: getFrontMatterText(frontMatter, ["category", "section"]),
    tags: getFrontMatterTags(frontMatter)
  };
}

export function stageMarkdownImport(draft: MarkdownImportDraft) {
  pendingDraft = draft;
}

export function consumeMarkdownImport() {
  const draft = pendingDraft;
  pendingDraft = null;
  return draft;
}
