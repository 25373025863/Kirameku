import { lookup } from "node:dns/promises";
import net from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { parseWebStream, selectCover, type IAudioMetadata, type ILyricsTag } from "music-metadata";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 80 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 45000;
const metadataCache = new Map<string, AudioMetadataResponse>();

interface AudioMetadataResponse {
  title: string;
  artist: string;
  album: string;
  cover: string;
  lrcText: string;
}

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

async function assertPublicAudioUrl(url: URL) {
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

function isAllowedLocalAudioUrl(url: URL, req: NextRequest) {
  return (
    url.origin === req.nextUrl.origin &&
    (url.pathname.startsWith("/api/downloads/") || url.pathname.startsWith("/uploads/"))
  );
}

function formatTimestamp(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}]`;
}

function lyricsToLrc(lyrics?: ILyricsTag[]) {
  if (!lyrics?.length) return "";
  const synced = lyrics.find((item) => item.syncText?.length);
  if (synced?.syncText?.length) {
    return synced.syncText
      .filter((line) => typeof line.timestamp === "number" && line.text)
      .map((line) => `${formatTimestamp(line.timestamp || 0)}${line.text}`)
      .join("\n");
  }

  const plain = lyrics.find((item) => item.text)?.text;
  return plain || "";
}

function nativeLyricsToLrc(metadata: IAudioMetadata) {
  const nativeTags = Object.values(metadata.native || {}).flat();
  for (const tag of nativeTags) {
    if (/lyrics|unsyncedlyrics|syncedlyrics/i.test(tag.id) && typeof tag.value === "string") {
      return repairMojibake(tag.value);
    }
  }
  return "";
}

function repairMojibake(value: string) {
  if (!value) return value;
  const candidates = [value];
  try {
    candidates.push(Buffer.from(value, "latin1").toString("utf8"));
  } catch {
    // ignore
  }
  try {
    candidates.push(decodeURIComponent(escape(value)));
  } catch {
    // ignore
  }

  return candidates.reduce((best, item) => (textScore(item) > textScore(best) ? item : best), value);
}

function textScore(value: string) {
  const cjk = (value.match(/[\u4e00-\u9fff]/g) || []).length;
  const mojibake = (value.match(/[\u0080-\u009fÃÂäåæçèé]/g) || []).length;
  const replacement = (value.match(/\ufffd/g) || []).length;
  return cjk * 4 - mojibake * 2 - replacement * 10;
}

function buildMetadataResponse(metadata: IAudioMetadata): AudioMetadataResponse {
  const cover = selectCover(metadata.common.picture);
  const lrcText = repairMojibake(lyricsToLrc(metadata.common.lyrics)) || nativeLyricsToLrc(metadata);

  return {
    title: repairMojibake(metadata.common.title || ""),
    artist: repairMojibake(metadata.common.artist || metadata.common.albumartist || ""),
    album: repairMojibake(metadata.common.album || ""),
    cover: cover ? `data:${cover.format};base64,${Buffer.from(cover.data).toString("base64")}` : "",
    lrcText,
  };
}

function repairMetadataResponse(metadata: AudioMetadataResponse): AudioMetadataResponse {
  return {
    ...metadata,
    title: repairMojibake(metadata.title),
    artist: repairMojibake(metadata.artist),
    album: repairMojibake(metadata.album),
    lrcText: repairMojibake(metadata.lrcText),
  };
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let audioUrl: URL;
  try {
    audioUrl = new URL(src, req.nextUrl.origin);
    if (!isAllowedLocalAudioUrl(audioUrl, req)) {
      await assertPublicAudioUrl(audioUrl);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid audio URL" },
      { status: 400 }
    );
  }

  const cacheKey = audioUrl.toString();
  const cached = metadataCache.get(cacheKey);
  if (cached) {
    const repaired = repairMetadataResponse(cached);
    metadataCache.set(cacheKey, repaired);
    return NextResponse.json(repaired);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(audioUrl, {
      signal: controller.signal,
      headers: {
        Range: `bytes=0-${MAX_AUDIO_BYTES - 1}`,
        "User-Agent": "Kirameku audio metadata reader",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch audio" }, { status: 502 });
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio file is too large" }, { status: 413 });
    }

    if (!response.body) {
      return NextResponse.json({ error: "Audio response has no body" }, { status: 502 });
    }

    const metadata = await parseWebStream(response.body, response.headers.get("content-type") || undefined, {
      duration: false,
      skipCovers: false,
    });
    const result = buildMetadataResponse(metadata);
    metadataCache.set(cacheKey, result);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Audio metadata error:", error);
    return NextResponse.json({ error: "Failed to parse audio metadata" }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
