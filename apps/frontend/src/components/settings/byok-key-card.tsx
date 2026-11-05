"use client";

import type { ApiKeyStatusResponse } from "@nutrisnap/shared";
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import * as React from "react";
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
  const [preferredModel, setPreferredModel] = React.useState<
    "gemini-2.5-flash" | "gemini-2.5-pro"
  >("gemini-2.5-flash");
  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadStatus = React.useCallback(async () => {
    try {
      const data = await apiFetch<ApiKeyStatusResponse>("/apikey/status");
      setStatus(data);
      if (
        data.preferredModel === "gemini-2.5-flash" ||
        data.preferredModel === "gemini-2.5-pro"
      ) {
        setPreferredModel(data.preferredModel);
      }
    } catch {
      // Abaikan jika user belum login
    }
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const saved = await apiFetch<ApiKeyStatusResponse>("/apikey", {
        method: "PUT",
        body: JSON.stringify({
          apiKey: apiKeyInput.trim(),
          preferredModel,
        }),
      });
      setStatus(saved);
      setApiKeyInput("");
      setFeedback({
        type: "success",
        text: `API Key berhasil divalidasi dan dienkripsi (${saved.keyHint}).`,
      });
      onSuccess?.(saved);
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Gagal menyimpan Gemini API Key.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const deleted = await apiFetch<ApiKeyStatusResponse>("/apikey", {
        method: "DELETE",
      });
      setStatus(deleted);
      setFeedback({
        type: "success",
        text: "API Key terenkripsi telah dihapus dari server.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error ? err.message : "Gagal menghapus Gemini API Key.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              BYOK Google Gemini API Key Vault
            </CardTitle>
            <CardDescription>
              Dienkripsi di server menggunakan <code>AES-256-GCM</code> (96-bit IV + 128-bit Auth Tag).
            </CardDescription>
          </div>
          {status?.hasKey ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aktif ({status.keyHint})
            </Badge>
          ) : (
            <Badge variant="outline">Belum Diatur</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && (
          <div
            className={`rounded-xl border p-3 text-xs ${
              feedback.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSaveKey} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium">Google Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Dapatkan Key di Google AI Studio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input
              type="password"
              placeholder={
                status?.keyHint
                  ? `Tersimpan: ${status.keyHint} (Ketik key baru untuk mengganti)`
                  : "Masukkan kunci AIzaSy..."
              }
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Model Gemini Pilihan</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  preferredModel === "gemini-2.5-flash" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreferredModel("gemini-2.5-flash")}
              >
                gemini-2.5-flash (Cepat)
              </Button>
              <Button
                type="button"
                variant={
                  preferredModel === "gemini-2.5-pro" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreferredModel("gemini-2.5-pro")}
              >
                gemini-2.5-pro (Presisi)
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isLoading || apiKeyInput.trim().length < 20}
            >
              <ShieldCheck className="h-4 w-4" />
              {isLoading ? "Memvalidasi & Mengenkripsi..." : "Validasi & Enkripsi Key"}
            </Button>

            {status?.hasKey && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDeleteKey}
                disabled={isLoading}
                aria-label="Hapus API Key"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

