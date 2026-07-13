import { http } from "@/utils/http";

export type AcgStatus = "watched" | "watching" | "plan" | "on_hold" | "dropped";

export type AcgPersonalFields = {
  status: AcgStatus;
  progress: number;
  personal_score: number;
  review: string;
  watched_at: string;
  favorite: boolean;
  is_public: boolean;
  sort: number;
};

export type AcgItem = AcgPersonalFields & {
  id: number;
  bangumi_id: number;
  name: string;
  name_cn: string;
  cover_url: string;
  summary: string;
  air_date: string;
  year: number;
  total_episodes: number;
  bangumi_score: number;
  bangumi_rank: number;
  tags: string[];
  source_url: string;
  created_at: string;
  updated_at: string | null;
};

export type BangumiSearchItem = {
  bangumi_id: number;
  name: string;
  name_cn: string;
  cover_url: string;
  summary: string;
  air_date: string;
  year: number;
  total_episodes: number;
  score: number;
  rank: number;
  tags: string[];
  source_url: string;
};

export const getAcgItems = () =>
  http.request<AcgItem[]>("get", "/api/acg/admin");

export const searchBangumi = (query: string) =>
  http.request<BangumiSearchItem[]>("get", "/api/acg/search", {
    params: { q: query }
  });

export const importBangumiItem = (bangumiId: number, data: AcgPersonalFields) =>
  http.request<AcgItem>("post", `/api/acg/import/${bangumiId}`, { data });

export const updateAcgItem = (
  itemId: number,
  data: Partial<AcgPersonalFields>
) => http.request<AcgItem>("put", `/api/acg/${itemId}`, { data });

export const refreshAcgItem = (itemId: number) =>
  http.request<AcgItem>("post", `/api/acg/${itemId}/refresh`);

export const deleteAcgItem = (itemId: number) =>
  http.request<{ ok: boolean }>("delete", `/api/acg/${itemId}`);
