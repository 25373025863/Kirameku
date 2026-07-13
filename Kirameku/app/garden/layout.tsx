"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, redirect } from "next/navigation";
import {
  ArrowLeft, LayoutDashboard, MapPin, Orbit, CloudRain, User,
  Sparkles, Droplets, Flower2, Mountain, Code2, Grid3x3,
  Sigma, BarChart3, FileText, Braces, Palette, QrCode, Star, Box,
  Menu, X,
} from "lucide-react";

const navItems = [
  { href: "/garden", label: "仪表盘", icon: LayoutDashboard },
  { href: "/garden/map", label: "地图", icon: MapPin },
  { href: "/garden/solar", label: "太阳系", icon: Orbit },
  { href: "/garden/rain", label: "代码雨", icon: CloudRain },
  { href: "/garden/visitor", label: "访客信息", icon: User },
  { href: "/garden/fireworks", label: "烟花", icon: Sparkles },
  { href: "/garden/fluid", label: "流体", icon: Droplets },
  { href: "/garden/kaleidoscope", label: "万花筒", icon: Flower2 },
  { href: "/garden/sand", label: "重力沙子", icon: Mountain },
  { href: "/garden/python", label: "Python", icon: Code2 },
  { href: "/garden/life", label: "生命游戏", icon: Grid3x3 },
  { href: "/garden/math", label: "数学可视化", icon: Sigma },
  { href: "/garden/sorting", label: "排序算法", icon: BarChart3 },
  { href: "/garden/markdown", label: "Markdown", icon: FileText },
  { href: "/garden/json", label: "JSON", icon: Braces },
  { href: "/garden/color", label: "颜色工具", icon: Palette },
  { href: "/garden/studio", label: "3D工作室", icon: Box },
  { href: "/garden/qrcode", label: "二维码", icon: QrCode },
  { href: "/garden/stars", label: "星空", icon: Star },
];

export default function GardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("garden-unlock") === "true";
  });
  const currentNav = navItems.find((item) => item.href === pathname) ?? navItems[0];
  const CurrentIcon = currentNav.icon;

  if (!unlocked) {
    redirect("/");
  }

  return (
    <div className="-mt-16 flex h-[100dvh] flex-col overflow-hidden md:flex-row">
      {/* 侧边栏 - 桌面端 */}
      <aside className="hidden h-[100dvh] w-56 shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/60 md:flex">
        <div className="p-5 border-b border-slate-200/60 dark:border-white/5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回主站
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-sky-500">
                <circle cx="12" cy="5" r="3" />
                <line x1="12" y1="8" x2="12" y2="22" />
                <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-white">
                星港
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Star Harbor
              </p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((nav) => {
            const active = pathname === nav.href;
            return (
              <Link
                key={nav.href}
                href={nav.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <nav.icon className="w-4 h-4" />
                {nav.label}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* 移动端顶栏 */}
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200/60 bg-slate-50/90 px-3 backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/80 md:hidden">
        <Link
          href="/"
          className="flex w-fit items-center gap-1 text-xs text-slate-400 transition-colors hover:text-sky-500"
        >
          <ArrowLeft className="size-3.5" />
          返回
        </Link>
        <div className="flex min-w-0 items-center gap-2 text-slate-800 dark:text-white">
          <CurrentIcon className="size-4 shrink-0 text-sky-500" />
          <span className="max-w-36 truncate text-sm font-semibold">
            {currentNav.label}
          </span>
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "关闭应用菜单" : "打开应用菜单"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="justify-self-end rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-50 bg-slate-950/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav
            aria-label="应用切换"
            className="max-h-full overflow-y-auto border-b border-slate-200/70 bg-white/95 p-3 shadow-xl dark:border-white/10 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((nav) => {
                const active = pathname === nav.href;
                return (
                  <Link
                    key={nav.href}
                    href={nav.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-w-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <nav.icon className="size-4 shrink-0" />
                    <span className="truncate">{nav.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* 内容区 */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100/40 dark:bg-slate-950/40">
        {children}
      </main>
    </div>
  );
}
