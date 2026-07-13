import { lookup } from "node:dns/promises";
import net from "node:net";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TEXT_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;

function isPrivateIp(address: string) {
  const family = net.isIP(address);
  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return false;
}

async function assertPublicUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are allowed");
  }

  if (isPrivateIp(url.hostname)) {
    throw new Error("Private URLs are not allowed");
  }

  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some((item) => isPrivateIp(item.address))) {
    throw new Error("Private URLs are not allowed");
  }
}

async function readLimitedText(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_TEXT_BYTES) {
      throw new Error("Text file is too large");
    }
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return new TextDecoder("utf-8").decode(buffer);
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let textUrl: URL;
  try {
    textUrl = new URL(src);
    await assertPublicUrl(textUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid URL" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(textUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Kirameku text proxy",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch text" }, { status: 502 });
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_TEXT_BYTES) {
      return NextResponse.json({ error: "Text file is too large" }, { status: 413 });
    }

    if (!response.body) {
      return NextResponse.json({ error: "Text response has no body" }, { status: 502 });
    }

    const text = await readLimitedText(response.body);
    return new NextResponse(text, {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Text proxy error:", error);
    return NextResponse.json({ error: "Failed to proxy text" }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
