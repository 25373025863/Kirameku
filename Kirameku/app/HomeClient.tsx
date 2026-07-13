"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import ProfileCard from "@/components/home/ProfileCard";
import FadeIn from "@/components/ui/FadeIn";

const CloudPlayer = dynamic(() => import("@/components/music/CloudPlayer"), { ssr: false });
const LyricBar = dynamic(() => import("@/components/music/LyricBar"), { ssr: false });
const LatestPostsCarousel = dynamic(() => import("@/components/home/LatestPostsCarousel"), { ssr: false });
const LatestChatterCarousel = dynamic(() => import("@/components/home/LatestChatterCarousel"), { ssr: false });
const PhotoWallPreview = dynamic(() => import("@/components/home/PhotoWallPreview"), { ssr: false });
const DogDiary = dynamic(() => import("@/components/home/DogDiary"), { ssr: false });
const SiteDashboard = dynamic(() => import("@/components/widgets/SiteDashboard"), { ssr: false });

export default function HomeClient({
  postCount,
  chatterCount,
  photoCount,
  profile,
}: {
  postCount: number;
  chatterCount: number;
  photoCount: number;
  profile: {
    name: string;
    bio: string;
    avatarUrl: string;
  };
}) {
  const router = useRouter();
  const [refreshToken, setRefreshToken] = useState(0);
  const lastRefresh = useRef(0);

  useEffect(() => {
    lastRefresh.current = Date.now();

    const refreshHomeData = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastRefresh.current < 750) return;
      lastRefresh.current = now;
      setRefreshToken((token) => token + 1);
      router.refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshHomeData();
    };

    window.addEventListener("focus", refreshHomeData);
    window.addEventListener("pageshow", refreshHomeData);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", refreshHomeData);
      window.removeEventListener("pageshow", refreshHomeData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 md:py-12 px-4 sm:px-10 relative z-10">
      {/* 搜索栏 */}
      <FadeIn>
        <div>
          <SearchBar />
        </div>
      </FadeIn>

      <main className="flex flex-col gap-4 md:gap-6 w-full">
        {/* 第一行：个人信息 + 播放器 */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 w-full items-stretch">
            <div className="md:col-span-8 flex w-full">
              <ProfileCard
                postCount={postCount}
                chatterCount={chatterCount}
                photoCount={photoCount}
                profile={profile}
              />
            </div>
            <div className="md:col-span-4 flex w-full">
              <CloudPlayer />
            </div>
          </div>
        </FadeIn>

        {/* 歌词栏 */}
        <FadeIn delay={0.15}>
          <div className="w-full">
            <LyricBar />
          </div>
        </FadeIn>

        {/* 第二行：照片墙 + 文章 + 说说 + 舔狗日记 */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 w-full items-stretch">
            <div className="md:col-span-4 h-full">
              <PhotoWallPreview refreshToken={refreshToken} />
            </div>
            <div className="md:col-span-8 flex flex-col gap-4 md:gap-6 h-full">
              <LatestPostsCarousel refreshToken={refreshToken} />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1 md:min-h-[220px] items-stretch">
                <div className="md:col-span-8 h-full">
                  <LatestChatterCarousel />
                </div>
                <div className="md:col-span-4 h-full flex">
                  <DogDiary />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 底部数据面板 */}
        <FadeIn delay={0.25}>
          <div className="w-full">
            <SiteDashboard />
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
