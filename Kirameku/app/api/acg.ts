import { request, qs } from "./client";

export type AcgStatus =
  | "watched"
  | "watching"
  | "plan"
  | "on_hold"
  | "dropped";

export interface AcgItem {
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
  status: AcgStatus;
  progress: number;
  personal_score: number;
  review: string;
  watched_at: string;
  favorite: boolean;
  is_public: boolean;
  sort: number;
  created_at: string;
  updated_at: string | null;
}

export function getAcgItems(params?: {
  q?: string;
  status?: AcgStatus | "";
  year?: number;
  favorite?: boolean;
}) {
  return request<AcgItem[]>(
    `/api/acg${qs({
      q: params?.q,
      status: params?.status,
      year: params?.year,
      favorite:
        params?.favorite === undefined ? undefined : params.favorite ? 1 : 0,
    })}`
  );
}
