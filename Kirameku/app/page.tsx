import HomeClient from "./HomeClient";
import { siteConfig } from "@/siteConfig";

const API = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8080"
).replace(/\/$/, "");

async function fetchFresh<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function fetchProfileData() {
  const [postsRes, chattersRes, albums, backendConfig] = await Promise.all([
    fetchFresh<{ count: number }>("/api/posts/count?status=published", { count: 0 }),
    fetchFresh<{ count: number }>("/api/chatters/count?status=published", { count: 0 }),
    fetchFresh<Array<{ photo_count?: number }>>("/api/albums", []),
    fetchFresh<Record<string, unknown>>("/api/site-config", {}),
  ]);

  const profileName =
    typeof backendConfig.profile_name === "string" &&
    backendConfig.profile_name.trim()
      ? backendConfig.profile_name
      : siteConfig.authorName;
  const profileBio =
    typeof backendConfig.profile_bio === "string"
      ? backendConfig.profile_bio
      : siteConfig.bio;
  const profileAvatarUrl =
    typeof backendConfig.profile_avatar === "string" &&
    backendConfig.profile_avatar.trim()
      ? backendConfig.profile_avatar
      : siteConfig.avatarUrl;

  return {
    postCount: postsRes.count ?? 0,
    chatterCount: chattersRes.count ?? 0,
    photoCount: albums.reduce((total, album) => total + (album.photo_count ?? 0), 0),
    profile: {
      name: profileName,
      bio: profileBio,
      avatarUrl: profileAvatarUrl,
    },
  };
}

export default async function Home() {
  const { postCount, chatterCount, photoCount, profile } =
    await fetchProfileData();

  return (
    <HomeClient
      postCount={postCount}
      chatterCount={chatterCount}
      photoCount={photoCount}
      profile={profile}
    />
  );
}
