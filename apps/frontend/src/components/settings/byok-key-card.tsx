"use client";

import type { ApiKeyStatusResponse } from "@nutrisnap/shared";
import {
  CheckCircle2,
  ChevronDown,
  Clipboard,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

interface ByokKeyCardProps {
  onSuccess?: (status: ApiKeyStatusResponse) => void;
}

export function ByokKeyCard({ onSuccess }: ByokKeyCardProps) {
  const [status, setStatus] = React.useState<ApiKeyStatusResponse | null>(null);
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [preferredModel, setPreferredModel] = React.useState<
    "gemini-3.8-flash" | "gemini-3.8-pro"
  >("gemini-3.8-flash");
  const [isLoading, setIsLoading] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    try {
      const data = await apiFetch<ApiKeyStatusResponse>("/apikey/status");
      setStatus(data);
      if (
        data.preferredModel === "gemini-3.8-flash" ||
        data.preferredModel === "gemini-3.8-pro"
      ) {
        setPreferredModel(data.preferredModel);
      } else if (
        data.preferredModel === "gemini-2.5-flash" ||
        data.preferredModel === "gemini-2.5-pro"
      ) {
        setPreferredModel(
          data.preferredModel === "gemini-2.5-pro"
            ? "gemini-3.8-pro"
            : "gemini-3.8-flash"
        );
      }
    } catch {
      // Abaikan jika belum login
    }
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKeyInput(text.trim());
        toast.info("Kunci berhasil ditempel dari papan klip.");
      }
    } catch {
      toast.error("Tidak dapat mengakses clipboard. Silakan tempel manual.");
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (cleanKey.length < 20) {
      toast.error("Kunci API terlalu pendek (minimal 20 karakter).");
      return;
    }

    setIsLoading(true);
    try {
      const saved = await apiFetch<ApiKeyStatusResponse>("/apikey", {
        method: "PUT",
        body: JSON.stringify({
          apiKey: cleanKey,
          preferredModel,
        }),
      });
      setStatus(saved);
      setApiKeyInput("");
      setShowKey(false);
      toast.success(
        `Kunci API Gemini berhasil divalidasi dan dienkripsi (${saved.keyHint}).`
      );
      onSuccess?.(saved);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan & menguji Kunci API Gemini."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!window.confirm("Yakin ingin menghapus Kunci API Gemini tersimpan?")) {
      return;
    }

    setIsLoading(true);
    try {
      const deleted = await apiFetch<ApiKeyStatusResponse>("/apikey", {
        method: "DELETE",
      });
      setStatus(deleted);
      toast.success("Kunci API Gemini telah dihapus dari server.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus Kunci API."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isTooShort =
    apiKeyInput.trim().length > 0 && apiKeyInput.trim().length < 20;

  return (
    <Card id="api-key" className="scroll-mt-20 rounded-2xl border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
              <KeyRound className="h-5 w-5 text-primary" />
              API Key Gemini
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Dipakai untuk scan foto makanan dan Coach AI. Disimpan terenkripsi di server dan tidak pernah ditampilkan lagi.
            </CardDescription>
          </div>
          <div>
            {status?.hasKey ? (
              <Badge variant="default" className="gap-1.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tersimpan: {status.keyHint}
              </Badge>
            ) : (
              <Badge variant="outline" className="py-1">
                Belum Diatur
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Panduan 3 Langkah */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">
            Cara mendapatkan kunci API gratis:
          </p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Buka{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                aistudio.google.com/app/apikey
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Klik tombol <strong>Create API key</strong> pada proyek Google-mu.</li>
            <li>Salin kuncinya dan tempel pada isian di bawah.</li>
          </ol>
        </div>

        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="gemini-key-input" className="text-xs font-medium text-foreground">
              Kunci API Google AI Studio
            </label>
            <div className="relative flex items-center">
              <Input
                id="gemini-key-input"
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                autoComplete="off"
                className="pr-20"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Sembunyikan kunci" : "Tampilkan kunci"}
                >
                  {showKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => void handlePaste()}
                >
                  <Clipboard className="mr-1 h-3 w-3" />
                  Tempel
                </Button>
              </div>
            </div>
            {isTooShort && (
              <p className="text-[11px] text-destructive">
                Kunci API terlalu pendek (minimal 20 karakter).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Model Gemini Pilihan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  preferredModel === "gemini-3.8-flash" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreferredModel("gemini-3.8-flash")}
                className="h-10 text-xs font-mono justify-center truncate"
              >
                gemini-3.8-flash
              </Button>
              <Button
                type="button"
                variant={
                  preferredModel === "gemini-3.8-pro" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreferredModel("gemini-3.8-pro")}
                className="h-10 text-xs font-mono justify-center truncate"
              >
                gemini-3.8-pro
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1 gap-2 min-h-[44px]"
              disabled={isLoading || apiKeyInput.trim().length < 20}
            >
              <ShieldCheck className="h-4 w-4" />
              {isLoading
                ? "Menguji & Menyimpan..."
                : "Simpan & Uji Key"}
            </Button>

            {status?.hasKey && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => void handleDeleteKey()}
                disabled={isLoading}
                aria-label="Hapus Kunci API Gemini"
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>

        {/* Detail Teknis */}
        <details className="group rounded-xl border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground hover:text-primary">
            <span>Detail teknis enkripsi & privasi</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2.5 space-y-1.5 border-t border-border pt-2.5 text-[11px] leading-relaxed">
            <p>
              • <strong>AES-256-GCM</strong>: Setiap kunci dienkripsi menggunakan IV 96-bit unik dan verifikasi Auth Tag 128-bit.
            </p>
            <p>
              • <strong>Zero Plaintext</strong>: Kunci asli tidak pernah dicatat di log server maupun dikirim kembali ke browser.
            </p>
            <p>
              • <strong>Didekripsi Hanya Saat Dibutuhkan</strong>: Kunci hanya didekripsi sementara di memori server saat memanggil Google Gemini API.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
