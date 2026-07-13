import { lookup } from "node:dns/promises";
import net from "node:net";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_REDIRECTS = 5;

function isPrivateIp(address: string) {
  const family = net.isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
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
    throw new Error("Only http/https audio URLs are allowed");
  }
  if (isPrivateIp(url.hostname)) {
    throw new Error("Private audio URLs are not allowed");
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some((item) => isPrivateIp(item.address))) {
    throw new Error("Private audio URLs are not allowed");
  }
}

function inferAudioType(url: URL, upstreamType: string | null) {
  const path = decodeURIComponent(url.pathname).toLowerCase();
  if (path.endsWith(".flac")) return "audio/flac";
  if (path.endsWith(".mp3")) return "audio/mpeg";
  if (path.endsWith(".m4a")) return "audio/mp4";
  if (path.endsWith(".aac")) return "audio/aac";
  if (path.endsWith(".ogg") || path.endsWith(".oga")) return "audio/ogg";
  if (path.endsWith(".wav")) return "audio/wav";
  return upstreamType && upstreamType !== "application/octet-stream" ? upstreamType : "audio/mpeg";
}

async function fetchAudio(url: URL, range: string | null) {
  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicUrl(currentUrl);
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        ...(range ? { Range: range } : {}),
        "User-Agent": "Kirameku audio proxy",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect missing location");
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error("Too many redirects");
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid audio URL" }, { status: 400 });
  }

  try {
    const range = req.headers.get("range");
    const { response, finalUrl } = await fetchAudio(sourceUrl, range);
    if (!response.ok && response.status !== 206) {
      return NextResponse.json({ error: "Failed to fetch audio" }, { status: 502 });
    }
    if (!response.body) {
      return NextResponse.json({ error: "Audio response has no body" }, { status: 502 });
    }

    const headers = new Headers();
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    const acceptRanges = response.headers.get("accept-ranges") || "bytes";
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);
    headers.set("Accept-Ranges", acceptRanges);
    headers.set("Content-Type", inferAudioType(sourceUrl, response.headers.get("content-type")));
    headers.set("Content-Disposition", "inline");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(response.body, {
      status: response.status === 206 ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Audio proxy error:", error);
    return NextResponse.json({ error: "Failed to proxy audio" }, { status: 500 });
  }
}
