"use client";

import {
  AlertCircle,
  BotMessageSquare,
  KeyRound,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import ReactMarkdown from "react-markdown";
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
import { formatGram, formatKcal } from "@/lib/format";

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatHistoryResponse {
  messages: ChatMessageItem[];
  context: {
    goalType: "bulking" | "cutting" | "maintenance";
    targetCalories: number;
    consumedCalories: number;
    remainingCalories: number;
    targetProteinG: number;
    consumedProteinG: number;
    remainingProteinG: number;
    hasApiKey: boolean;
  };
}

const DEFAULT_QUICK_PROMPTS = [
  "Rekomendasi camilan tinggi protein di bawah 200 kcal",
  "Ide menu makan malam untuk menutup target protein",
  "Alternatif sumber protein murah selain dada ayam",
  "Tips mengatasi rasa lapar saat defisit kalori",
];

export default function AiDietCoachChatPage() {
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([]);
  const [context, setContext] = React.useState<
    ChatHistoryResponse["context"] | null
  >(null);
  const [inputText, setInputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const loadHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await apiFetch<ChatHistoryResponse>("/chat/history");
      setMessages(data.messages);
      setContext(data.context);
    } catch {
      // Abaikan jika gagal
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  React.useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Quick Prompts Dinamis berbasis sisa kalori & protein hari ini
  const quickPrompts = React.useMemo(() => {
    if (!context) return DEFAULT_QUICK_PROMPTS;
    const remainingCal = Math.max(0, context.remainingCalories);
    const remainingProt = Math.max(0, context.remainingProteinG);
    return [
      `Menu untuk sisa ${formatKcal(remainingCal)} & ${formatGram(remainingProt)} P`,
      `Ide camilan tinggi protein untuk ${context.goalType}`,
      "Alternatif sumber protein lokal murah",
      "Evaluasi keseimbangan makronutrisi hari ini",
    ];
  }, [context]);

  const handleSendMessage = async (textOverride?: string) => {
    const messageToSend = (textOverride ?? inputText).trim();
    if (!messageToSend || isSending) return;

    // Optimistic message update
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      role: "user",
      content: messageToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    if (!textOverride) {
      setInputText("");
    }

    try {
      const res = await apiFetch<{
        reply: string;
        messages: ChatMessageItem[];
      }>("/chat/message", {
        method: "POST",
        body: JSON.stringify({ message: messageToSend }),
      });
      setMessages(res.messages);
    } catch (err) {
      // Hapus pesan optimistik jika gagal kirim
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mengirim pesan ke Coach AI. Periksa koneksi atau kuota Gemini API."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await apiFetch("/chat/history", { method: "DELETE" });
      setMessages([]);
      toast.success("Riwayat obrolan berhasil dibersihkan.");
    } catch {
      toast.error("Gagal membersihkan riwayat obrolan.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Title & Clear Action */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-primary" />
            Coach AI Bulking & Diet
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Konsultasikan menu, strategi surplus/defisit, dan cara menutup target protein harian kamu.
          </p>
        </div>

        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleClearChat()}
            className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan Chat
          </Button>
        )}
      </div>

      {/* Context Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {context ? (
            <>
              <Badge variant="surplus" className="uppercase font-semibold">
                Mode: {context.goalType}
              </Badge>
              <span className="text-muted-foreground tabular-nums">
                Sisa Hari Ini:{" "}
                <strong className="text-primary font-bold">
                  {formatKcal(Math.max(0, context.remainingCalories))}
                </strong>{" "}
                •{" "}
                <strong className="text-macro-protein font-bold">
                  {formatGram(context.remainingProteinG)} Protein
                </strong>
              </span>
            </>
          ) : isLoadingHistory ? (
            <span className="text-xs text-muted-foreground animate-pulse">
              Memuat konteks nutrisi harian...
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Profil nutrisi belum dikonfigurasi
            </span>
          )}
        </div>

        {context?.hasApiKey ? (
          <Badge variant="default" className="gap-1 text-[11px]">
            <Sparkles className="h-3 w-3" />
            Gemini BYOK Aktif
          </Badge>
        ) : (
          <Link href="/settings">
            <Badge variant="outline" className="gap-1 hover:border-primary text-[11px] border-status-under/40 text-status-under">
              <KeyRound className="h-3 w-3" />
              Pasang Kunci Gemini di Pengaturan
            </Badge>
          </Link>
        )}
      </div>

      {/* Chat Conversation Box */}
      <Card className="flex flex-col border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-semibold text-foreground">
                Diskusi Strategi Nutrisi Cerdas
              </CardTitle>
              <CardDescription className="text-[11px]">
                Pilih topik cepat di bawah atau ketik pertanyaan langsung.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isSending}
                onClick={() => void handleSendMessage(prompt)}
                className="rounded-full border border-border bg-card px-3 py-1 text-left text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground hover:bg-secondary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col p-4 space-y-4">
          {/* Scrollable messages container */}
          <div className="space-y-3.5 max-h-[420px] min-h-[280px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-2 my-6">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BotMessageSquare className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Mulai Konsultasi dengan Coach AI
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Tanyakan rekomendasi porsi makan malam, ide camilan tinggi protein, atau strategi surplus dan defisit yang tepat untuk target tubuh kamu.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm mt-0.5">
                      <BotMessageSquare className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-secondary/70 border border-border text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed space-y-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-line">{msg.content}</span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex gap-2.5 items-center text-xs text-muted-foreground animate-pulse">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <BotMessageSquare className="h-4 w-4" />
                </div>
                <span>Coach AI sedang meracik saran nutrisi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-border"
          >
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tanyakan rekomendasi makan, sisa makro, atau resep..."
              disabled={isSending}
              className="text-xs"
            />
            <Button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="shrink-0 gap-1.5 h-10 px-4 text-xs font-semibold"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? "..." : "Kirim"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
