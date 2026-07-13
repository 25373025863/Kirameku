import { request } from "./client";

export type SecretCodeTargetType = "internal" | "external" | "download";

export type SecretCodeResolveResult = {
  matched: boolean;
  reason: "" | "invalid" | "expired" | "exhausted";
  name: string;
  description: string;
  target_type: SecretCodeTargetType | null;
  target_url: string;
};

export function resolveSecretCode(code: string) {
  return request<SecretCodeResolveResult>("/api/secret-codes/resolve", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
