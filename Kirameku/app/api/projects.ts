import { request } from "./client";

export type ProjectType = "own" | "favorite";

export interface ProjectItem {
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
  project_type: ProjectType;
  status: string;
  status_label: string;
  is_featured: boolean;
  sort: number;
  created_at: string;
}

export function getProjects() {
  return request<ProjectItem[]>("/api/projects");
}

export function getProjectBySlug(slug: string) {
  return request<ProjectItem>(`/api/projects/${slug}`);
}
