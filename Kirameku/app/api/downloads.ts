import { request, qs } from "./client";

export type DownloadSource = "local" | "cloudreve" | "onedrive" | "link";

export interface DownloadFileItem {
  id: number;
  title: string;
  description: string;
  category: string;
  source_type: DownloadSource;
  original_filename: string;
  external_url: string;
  file_size: number;
  mime_type: string;
  is_public: boolean;
  download_count: number;
  sort: number;
  download_url: string;
  created_at: string;
  updated_at: string | null;
}

export function getDownloads(params?: { category?: string; q?: string }) {
  return request<DownloadFileItem[]>(`/api/downloads${qs(params)}`);
}
