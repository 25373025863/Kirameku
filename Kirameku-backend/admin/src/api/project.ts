import { http } from "@/utils/http";

export type ProjectItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  cover_image: string;
  tech_stack: string[];
  link_github: string;
  link_gitee: string;
  link_live: string;
  link_docs: string;
  project_type: "own" | "favorite";
  status: string;
  status_label: string;
  is_featured: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
};

export type ProjectMetadata = Pick<
  ProjectItem,
  | "name"
  | "slug"
  | "description"
  | "long_description"
  | "cover_image"
  | "tech_stack"
  | "link_github"
  | "link_gitee"
  | "link_live"
  | "link_docs"
>;

/** 获取项目列表 */
export const getProjects = () => {
  return http.request<ProjectItem[]>("get", "/api/projects");
};

/** 从项目托管平台读取收藏项目信息 */
export const getProjectMetadata = (sourceUrl: string) => {
  return http.request<ProjectMetadata>(
    "post",
    "/api/projects/metadata",
    { data: { source_url: sourceUrl } },
    { timeout: 30000 }
  );
};

/** 创建项目 */
export const createProject = (data: Partial<ProjectItem>) => {
  return http.request<ProjectItem>("post", "/api/projects", { data });
};

/** 更新项目 */
export const updateProject = (
  projectId: number,
  data: Partial<ProjectItem>
) => {
  return http.request<ProjectItem>("put", `/api/projects/${projectId}`, {
    data
  });
};

/** 删除项目 */
export const deleteProject = (projectId: number) => {
  return http.request<{ ok: boolean }>("delete", `/api/projects/${projectId}`);
};
