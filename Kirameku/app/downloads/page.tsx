"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Download,
  FileArchive,
  FileCode2,
  FileText,
  HardDriveDownload,
  Search,
} from "lucide-react";
import { getDownloads } from "@/app/api";
import type { DownloadFileItem } from "@/app/api";

function formatSize(size = 0) {
  if (!size) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function sourceLabel(source: DownloadFileItem["source_type"]) {
  const labels = {
    local: "本地",
    cloudreve: "Cloudreve",
    onedrive: "OneDrive",
    link: "外链",
  };
  return labels[source] ?? source;
}

function fileIcon(item: DownloadFileItem) {
  const name = `${item.original_filename} ${item.mime_type}`.toLowerCase();
  if (name.includes("zip") || name.includes("rar") || name.includes("7z")) return FileArchive;
  if (name.includes("json") || name.includes("code") || name.includes("script")) return FileCode2;
  if (item.source_type !== "local") return Cloud;
  return FileText;
}

export default function DownloadsPage() {
  const [files, setFiles] = useState<DownloadFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    getDownloads()
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const list = Array.from(new Set(files.map((file) => file.category).filter(Boolean)));
    return ["all", ...list];
  }, [files]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return files.filter((file) => {
      const matchedCategory = category === "all" || file.category === category;
      const matchedKeyword =
        !keyword ||
        file.title.toLowerCase().includes(keyword) ||
        file.description.toLowerCase().includes(keyword) ||
        file.original_filename.toLowerCase().includes(keyword);
      return matchedCategory && matchedKeyword;
    });
  }, [category, files, query]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-10"
      >
        <div className="flex items-center gap-3">
          <HardDriveDownload className="w-7 h-7 md:w-8 md:h-8 text-sky-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            下载
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2 ml-10 md:ml-11 text-sm md:text-base">
          公开文件、网盘资源和项目附件
        </p>
      </motion.div>

      <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索文件..."
            className="w-full rounded-xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === item
                  ? "bg-sky-500 text-white"
                  : "bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-sky-500/10"
              }`}
            >
              {item === "all" ? "全部" : item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">暂无可下载文件</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {filtered.map((file, index) => {
            const Icon = fileIcon(file);
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className="group rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 p-4 md:p-5 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-slate-800 dark:text-white line-clamp-1">
                        {file.title}
                      </h2>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md">
                        {sourceLabel(file.source_type)}
                      </span>
                    </div>
                    {file.description && (
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {file.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-slate-400">
                      <span>{formatSize(file.file_size)}</span>
                      {file.category && <span>{file.category}</span>}
                      <span>{file.download_count} 次下载</span>
                    </div>
                  </div>
                </div>
                <a
                  href={file.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-sky-500 text-white py-2.5 text-sm font-medium hover:bg-sky-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载
                </a>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
