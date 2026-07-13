"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Check,
  ChevronDown,
  Clapperboard,
  Clock3,
  ExternalLink,
  Heart,
  ImageOff,
  PauseCircle,
  PlayCircle,
  Search,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { getAcgItems } from "@/app/api";
import type { AcgItem, AcgStatus } from "@/app/api";

const statusOptions: Array<{
  value: AcgStatus | "all";
  label: string;
  icon: typeof CheckCircle2;
  color: string;
}> = [
  { value: "all", label: "全部", icon: Clapperboard, color: "text-slate-600" },
  { value: "watched", label: "已看完", icon: CheckCircle2, color: "text-emerald-500" },
  { value: "watching", label: "在看", icon: PlayCircle, color: "text-sky-500" },
  { value: "plan", label: "想看", icon: Clock3, color: "text-amber-500" },
  { value: "on_hold", label: "搁置", icon: PauseCircle, color: "text-slate-500" },
  { value: "dropped", label: "弃番", icon: XCircle, color: "text-rose-500" },
];

const statusBadge: Record<AcgStatus, string> = {
  watched: "bg-emerald-500 text-white",
  watching: "bg-sky-500 text-white",
  plan: "bg-amber-400 text-slate-950",
  on_hold: "bg-slate-500 text-white",
  dropped: "bg-rose-500 text-white",
};

function statusLabel(status: AcgStatus) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

function displayTitle(item: AcgItem) {
  return item.name_cn || item.name;
}

export default function AcgPage() {
  const [items, setItems] = useState<AcgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AcgStatus | "all">("all");
  const [year, setYear] = useState("all");
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [selected, setSelected] = useState<AcgItem | null>(null);
  const yearFilterRef = useRef<HTMLDivElement>(null);
  const yearButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getAcgItems()
      .then(setItems)
      .catch(() => setError("暂时无法读取 ACG 收藏"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  const years = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.year).filter(Boolean))).sort(
        (a, b) => b - a
      ),
    [items]
  );

  const yearOptions = useMemo(
    () => [
      { value: "all", label: "全部年份" },
      ...years.map((item) => ({ value: String(item), label: String(item) })),
    ],
    [years]
  );

  useEffect(() => {
    if (!yearMenuOpen) return;

    const focusSelectedOption = requestAnimationFrame(() => {
      yearFilterRef.current
        ?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]')
        ?.focus();
    });

    const handlePointerDown = (event: PointerEvent) => {
      if (!yearFilterRef.current?.contains(event.target as Node)) {
        setYearMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setYearMenuOpen(false);
        yearButtonRef.current?.focus();
      } else if (event.key === "Tab") {
        setYearMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusSelectedOption);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [yearMenuOpen]);

  const handleYearListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')
    );
    if (!options.length) return;

    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
    if (event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }
    options[nextIndex]?.focus();
  };

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (year !== "all" && item.year !== Number(year)) return false;
      if (!keyword) return true;
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.name_cn.toLowerCase().includes(keyword) ||
        item.review.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword))
      );
    });
  }, [items, query, status, year]);

  const stats = useMemo(() => {
    const scored = items.filter((item) => item.personal_score > 0);
    return {
      total: items.length,
      watched: items.filter((item) => item.status === "watched").length,
      favorites: items.filter((item) => item.favorite).length,
      average: scored.length
        ? scored.reduce((sum, item) => sum + item.personal_score, 0) / scored.length
        : 0,
    };
  }, [items]);

  const statItems = [
    {
      label: "收藏",
      value: stats.total,
      suffix: "部",
      icon: Clapperboard,
      iconClass: "bg-sky-500/10 text-sky-500",
    },
    {
      label: "已看完",
      value: stats.watched,
      suffix: "部",
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-500",
    },
    {
      label: "特别喜欢",
      value: stats.favorites,
      suffix: "部",
      icon: Heart,
      iconClass: "bg-rose-500/10 text-rose-500",
    },
    {
      label: "平均评分",
      value: stats.average ? stats.average.toFixed(1) : "-",
      suffix: "",
      icon: Star,
      iconClass: "bg-amber-500/10 text-amber-500",
    },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-12 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-10"
      >
        <div className="flex items-center gap-3">
          <Clapperboard className="h-7 w-7 text-sky-500 md:h-8 md:w-8" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
            ACG 档案
          </h1>
        </div>
        <p className="ml-10 mt-2 text-sm text-slate-500 dark:text-slate-400 md:ml-11 md:text-base">
          我看过的故事，以及它们留下的余温。
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-2.5 md:mb-8 md:grid-cols-4 md:gap-3"
        aria-label="收藏统计"
      >
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/40 bg-white/35 px-3.5 py-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-800/45 md:min-h-[88px] md:px-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div className="mt-0.5 text-xl font-bold tabular-nums text-slate-800 dark:text-white md:text-2xl">
                  {item.value}
                  {item.suffix && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {item.suffix}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="mb-6 space-y-3"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索作品、标签或短评"
              className="h-11 w-full rounded-xl border border-white/40 bg-white/40 pl-10 pr-4 text-sm text-slate-800 outline-none backdrop-blur-md transition focus:ring-2 focus:ring-sky-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-100"
            />
          </div>
          <div ref={yearFilterRef} className="relative w-full md:w-40">
            <button
              ref={yearButtonRef}
              type="button"
              aria-label="按年份筛选"
              aria-haspopup="listbox"
              aria-expanded={yearMenuOpen}
              onClick={() => setYearMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setYearMenuOpen(true);
                }
              }}
              className={`flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white/40 px-3 text-sm text-slate-700 outline-none backdrop-blur-md transition-all dark:bg-slate-800/50 dark:text-slate-200 ${
                yearMenuOpen
                  ? "border-sky-400 ring-2 ring-sky-500/20"
                  : "border-white/40 hover:bg-white/55 dark:border-white/10 dark:hover:bg-slate-800/65"
              }`}
            >
              <span>{yearOptions.find((item) => item.value === year)?.label}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                  yearMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {yearMenuOpen && (
                <motion.div
                  role="listbox"
                  aria-label="年份"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onKeyDown={handleYearListKeyDown}
                  className="absolute right-0 top-full z-30 mt-2 w-full min-w-40 overflow-hidden rounded-xl border border-white/60 bg-white/90 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90"
                >
                  {yearOptions.map((item) => {
                    const active = year === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setYear(item.value);
                          setYearMenuOpen(false);
                          yearButtonRef.current?.focus();
                        }}
                        className={`flex min-h-10 w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-inset ${
                          active
                            ? "bg-sky-500 font-medium text-white shadow-sm"
                            : "text-slate-700 hover:bg-sky-500/10 dark:text-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        <span>{item.label}</span>
                        {active && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {statusOptions.map((item) => {
            const Icon = item.icon;
            const active = status === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                className={`flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium shadow-sm backdrop-blur-md transition-all duration-200 ${
                  active
                    ? "border-sky-500 bg-sky-500 text-white shadow-sky-500/20"
                    : "border-white/40 bg-white/30 text-slate-600 hover:bg-white/55 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800/65"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "" : item.color}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {loading ? (
        <div className="py-24 text-center text-sm text-slate-400">正在整理收藏...</div>
      ) : error ? (
        <div className="py-24 text-center text-sm text-rose-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-sm text-slate-400">这里还没有匹配的作品</div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.button
                layout
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => setSelected(item)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-white/40 bg-white/40 text-left shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl dark:border-white/10 dark:bg-slate-800/50 dark:hover:border-sky-800"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover_url}
                      alt={displayTitle(item)}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageOff className="h-7 w-7" />
                    </div>
                  )}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge[item.status]}`}>
                    {statusLabel(item.status)}
                  </span>
                  {item.favorite && (
                    <Heart className="absolute right-2 top-2 h-5 w-5 fill-rose-500 text-white drop-shadow" />
                  )}
                </div>
                <div className="min-h-[92px] p-3">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-white">
                    {displayTitle(item)}
                  </h2>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.year || "年份未知"}</span>
                    {item.personal_score > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {item.personal_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setSelected(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={displayTitle(selected)}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/50 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90"
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="关闭详情"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="grid md:grid-cols-[260px_1fr]">
                <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 md:aspect-auto md:min-h-[520px]">
                  {selected.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.cover_url}
                      alt={displayTitle(selected)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center text-slate-400">
                      <ImageOff className="h-9 w-9" />
                    </div>
                  )}
                </div>
                <div className="p-5 md:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[selected.status]}`}>
                      {statusLabel(selected.status)}
                    </span>
                    {selected.favorite && (
                      <span className="flex items-center gap-1 text-xs font-medium text-rose-500">
                        <Heart className="h-4 w-4 fill-current" /> 特别喜欢
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-950 dark:text-white md:text-2xl">
                    {displayTitle(selected)}
                  </h2>
                  {selected.name_cn && selected.name !== selected.name_cn && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.name}</p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-slate-200 py-4 text-sm dark:border-white/10 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-slate-400">我的评分</div>
                      <div className="mt-1 font-semibold text-amber-500">
                        {selected.personal_score ? selected.personal_score.toFixed(1) : "未评分"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Bangumi</div>
                      <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                        {selected.bangumi_score ? selected.bangumi_score.toFixed(1) : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">集数</div>
                      <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                        {selected.progress} / {selected.total_episodes || "?"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">看完日期</div>
                      <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                        {selected.watched_at || "未记录"}
                      </div>
                    </div>
                  </div>

                  {selected.review && (
                    <section className="mt-5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">我的短评</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {selected.review}
                      </p>
                    </section>
                  )}

                  {selected.summary && (
                    <section className="mt-5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">作品简介</h3>
                      <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {selected.summary}
                      </p>
                    </section>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {selected.tags.slice(0, 8).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {selected.source_url && (
                    <a
                      href={selected.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    >
                      <ExternalLink className="h-4 w-4" />
                      查看 Bangumi 资料
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
