"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";
import { resolveSecretCode } from "@/app/api/secretCodes";
import { useToast } from "@/components/providers/ToastProvider";

export default function SearchBar() {
  const router = useRouter();
  const { addToast } = useToast();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const code = value.trim();
    if (!code || loading) return;

    setLoading(true);
    try {
      const result = await resolveSecretCode(code);

      if (!result.matched) {
        if (result.reason === "expired") {
          addToast("warning", "暗号已过期");
        } else if (result.reason === "exhausted") {
          addToast("warning", "暗号使用次数已耗尽");
        } else {
          addToast("error", "暗号不正确");
        }
        return;
      }

      if (result.target_type === "internal") {
        if (result.target_url.startsWith("/garden")) {
          localStorage.setItem("garden-unlock", "true");
        }
        router.push(result.target_url);
      } else if (result.target_type === "download") {
        const link = document.createElement("a");
        link.href = result.target_url;
        link.download = "";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.location.assign(result.target_url);
      }

      setValue("");
      addToast("success", result.name);
    } catch {
      addToast("error", "暂时无法验证暗号，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mb-6 w-full max-w-2xl md:mb-10">
      <form
        className="relative group"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className="w-full rounded-2xl border border-white/40 bg-white/50 py-3.5 pr-6 pl-14 text-base font-medium text-slate-800 shadow-xl backdrop-blur-xl transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder:text-slate-400 md:rounded-3xl md:py-4 md:text-lg"
          placeholder="输入暗号探索更多..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="submit"
          aria-label="验证暗号"
          disabled={loading || !value.trim()}
          className="absolute inset-y-0 left-0 z-10 flex items-center pl-5 text-slate-400 transition-colors enabled:cursor-pointer enabled:group-focus-within:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Search className="size-5" strokeWidth={2.5} />
          )}
        </button>
      </form>
    </div>
  );
}
