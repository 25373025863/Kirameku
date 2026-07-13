"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ExternalLink,
  FileText,
  FolderGit2,
  Loader2,
  Search,
  Star,
} from "lucide-react";
import { getProjects } from "@/app/api";
import type { ProjectItem } from "@/app/api";

const statusLabels: Record<string, string> = {
  developing: "开发中",
  active: "维护中",
  archived: "已归档",
  planned: "计划中",
};

const statusStyles: Record<string, string> = {
  developing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  planned: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const projectTypeTabs = [
  { value: "own", label: "我的项目", icon: FolderGit2 },
  { value: "favorite", label: "收藏项目", icon: Bookmark },
] as const;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectType, setActiveProjectType] =
    useState<ProjectItem["project_type"]>("own");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadProjects = () => {
      getProjects()
        .then((data) => {
          if (!active) return;
          setProjects(data);
          setError("");
        })
        .catch(() => {
          if (active) setError("暂时无法读取项目");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadProjects();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadProjects();
    };
    window.addEventListener("focus", loadProjects);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("focus", loadProjects);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const projectCounts = useMemo(
    () => ({
      own: projects.filter((project) => project.project_type === "own").length,
      favorite: projects.filter(
        (project) => project.project_type === "favorite"
      ).length,
    }),
    [projects]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      if (project.project_type !== activeProjectType) return false;
      if (!query) return true;
      return (
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.long_description.toLowerCase().includes(query) ||
        project.status_label.toLowerCase().includes(query) ||
        project.tech_stack.some((tech) => tech.toLowerCase().includes(query))
      );
    });
  }, [activeProjectType, projects, searchQuery]);

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-12 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-center md:mb-10 md:text-left"
      >
        <div className="mb-2 flex items-center justify-center gap-2 md:mb-4 md:justify-start md:gap-3">
          <FolderGit2 className="h-5 w-5 text-sky-500 md:h-7 md:w-7" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white md:text-4xl">
            项目
          </h1>
        </div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 md:text-sm">
          记录亲手构建的作品，也收藏值得反复学习的项目
        </p>
      </motion.header>

      <div className="mb-6 flex w-full flex-col gap-3 md:mb-10 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="项目分类"
          className="grid w-full grid-cols-2 rounded-lg border border-white/50 bg-white/30 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40 md:w-auto"
        >
          {projectTypeTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeProjectType === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveProjectType(tab.value)}
                className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 md:min-w-36 md:text-sm ${
                  selected
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:bg-white/40 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`min-w-5 rounded px-1.5 py-0.5 text-[10px] leading-4 ${
                    selected
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                      : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {projectCounts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 md:left-4 md:h-5 md:w-5" />
          <input
            type="search"
            placeholder="搜索当前分类..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-full border border-white/40 bg-white/40 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 shadow-lg outline-none backdrop-blur-md transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-400 md:py-3 md:pl-12 md:pr-6 md:text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
        </div>
      ) : error && projects.length === 0 ? (
        <div className="py-24 text-center text-sm text-rose-500">{error}</div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => {
              const statusLabel =
                project.status_label || statusLabels[project.status] || project.status;
              const statusClass =
                statusStyles[project.status] || statusStyles.archived;

              return (
                <motion.article
                  layout
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group relative h-full overflow-hidden rounded-2xl border border-white/40 bg-white/40 p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl dark:border-white/10 dark:bg-slate-800/50 md:rounded-3xl md:p-7"
                >
                  {project.cover_image && (
                    <div className="relative mb-4 aspect-[16/7] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      {/* Project covers may be local uploads or arbitrary remote URLs. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.cover_image}
                        alt={project.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
                    </div>
                  )}

                  <div className="relative z-10 mb-3 flex items-start justify-between gap-3 md:mb-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white md:text-2xl">
                          {project.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${
                            project.project_type === "favorite"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                          }`}
                        >
                          {project.project_type === "favorite" ? (
                            <Bookmark className="h-3 w-3" />
                          ) : (
                            <FolderGit2 className="h-3 w-3" />
                          )}
                          {project.project_type === "favorite"
                            ? "收藏项目"
                            : "我的项目"}
                        </span>
                        {project.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <Star className="h-3 w-3 fill-current" />
                            精选
                          </span>
                        )}
                      </div>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
                      {project.link_github && (
                        <ProjectLink
                          href={project.link_github}
                          label="GitHub"
                          icon={<GithubIcon />}
                        />
                      )}
                      {project.link_gitee && (
                        <ProjectLink
                          href={project.link_gitee}
                          label="Gitee"
                          icon={<GiteeIcon />}
                        />
                      )}
                      {project.link_live && (
                        <ProjectLink
                          href={project.link_live}
                          label="在线预览"
                          icon={<ExternalLink className="h-4 w-4 md:h-5 md:w-5" />}
                        />
                      )}
                      {project.link_docs && (
                        <ProjectLink
                          href={project.link_docs}
                          label="项目文档"
                          icon={<FileText className="h-4 w-4 md:h-5 md:w-5" />}
                        />
                      )}
                    </div>
                  </div>

                  <p className="relative z-10 mb-4 min-h-12 line-clamp-3 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200 md:mb-6 md:min-h-15 md:text-sm">
                    {project.description || project.long_description}
                  </p>

                  <div className="relative z-10 flex flex-wrap gap-1.5 md:gap-2">
                    {project.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-600 dark:text-sky-400 md:px-3 md:py-1 md:text-[10px]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center text-xs font-medium text-slate-600 dark:text-slate-300 md:py-20 md:text-sm"
            >
              {projects.length === 0
                ? "暂无项目"
                : searchQuery
                  ? `没有找到匹配「${searchQuery}」的项目`
                  : activeProjectType === "favorite"
                    ? "还没有收藏项目"
                    : "暂无我的项目"}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ProjectLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 outline-none transition-colors duration-200 hover:bg-white/50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {icon}
    </a>
  );
}

function GiteeIcon() {
  return (
    <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482c0-.326.266-.592.592-.592h6.81c.328 0 .593.266.593.592v3.408a4.74 4.74 0 0 1-4.741 4.74H7.11A4.74 4.74 0 0 1 2.37 14.81V9.186a4.74 4.74 0 0 1 4.74-4.741h10.963v.888z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}
