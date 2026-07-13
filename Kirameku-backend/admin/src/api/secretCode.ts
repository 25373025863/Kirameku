import { http } from "@/utils/http";

export type SecretCodeTargetType = "internal" | "external" | "download";

export type SecretCodeItem = {
  id: number;
  name: string;
  code: string;
  description: string;
  target_type: SecretCodeTargetType;
  target_url: string;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SecretCodePayload = Pick<
  SecretCodeItem,
  | "name"
  | "code"
  | "description"
  | "target_type"
  | "target_url"
  | "is_active"
  | "expires_at"
  | "max_uses"
>;

export const getSecretCodes = () => {
  return http.request<SecretCodeItem[]>("get", "/api/secret-codes/admin");
};

export const createSecretCode = (data: SecretCodePayload) => {
  return http.request<SecretCodeItem>("post", "/api/secret-codes", { data });
};

export const updateSecretCode = (
  codeId: number,
  data: Partial<SecretCodePayload>
) => {
  return http.request<SecretCodeItem>("put", `/api/secret-codes/${codeId}`, {
    data
  });
};

export const resetSecretCodeUses = (codeId: number) => {
  return http.request<SecretCodeItem>(
    "post",
    `/api/secret-codes/${codeId}/reset-uses`
  );
};

export const deleteSecretCode = (codeId: number) => {
  return http.request<{ ok: boolean }>("delete", `/api/secret-codes/${codeId}`);
};
