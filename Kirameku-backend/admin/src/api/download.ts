import { http } from "@/utils/http";

export type DownloadSource = "local" | "cloudreve" | "onedrive" | "link";

export type DownloadFileItem = {
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
};

export const getDownloadFiles = (params?: {
  kind?: "all" | "files" | "music";
}) => {
  return http.request<DownloadFileItem[]>("get", "/api/downloads/admin", {
    params
  });
};

export const createExternalDownload = (
  data: Partial<DownloadFileItem> & { external_url: string }
) => {
  return http.request<DownloadFileItem>("post", "/api/downloads", { data });
};

export const updateDownloadFile = (
  fileId: number,
  data: Partial<DownloadFileItem>
) => {
  return http.request<DownloadFileItem>("put", `/api/downloads/${fileId}`, {
    data
  });
};

export const deleteDownloadFile = (fileId: number) => {
  return http.request<{ ok: boolean }>("delete", `/api/downloads/${fileId}`);
};

export const uploadDownloadFile = (data: FormData) => {
  return http.request<DownloadFileItem>("post", "/api/downloads/upload", {
    data,
    headers: { "Content-Type": "multipart/form-data" }
  });
};
