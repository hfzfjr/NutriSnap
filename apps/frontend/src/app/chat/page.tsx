"use client";

import {
  BotMessageSquare,
  KeyRound,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
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

const QUICK_PROMPTS = [
  "Rekomendasi menu malam ini untuk menutup sisa protein saya",
  "Ide camilan tinggi kalori & protein murah untuk bulking",
  "Evaluasi progres kalori & protein saya hari ini",
  "Alternatif sumber protein selain dada ayam",
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

  const handleSendMessage = async (textOverride?: string) => {
    const messageToSend = (textOverride ?? inputText).trim();
    if (!messageToSend || isSending) return;

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
    } catch {
      // Abaikan jika gagal
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await apiFetch("/chat/history", { method: "DELETE" });
      setMessages([]);
    } catch {
      // Abaikan
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-primary" />
            AI Bulking & Diet Assistant
          </h1>
          <p className="text-xs text-muted-foreground">
            Asisten nutrisi personal yang otomatis memahami target kalori, protein, dan log harian Anda.
          </p>
        </div>

        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleClearChat()}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan Chat
          </Button>
        )}
      </div>

      {/* Context Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {context ? (
            <>
              <Badge variant="surplus" className="uppercase">
                Mode: {context.goalType}
              </Badge>
              <span className="text-muted-foreground tabular-nums">
                Sisa Hari Ini:{" "}
                <strong className="text-primary font-semibold">
                  {Math.max(0, context.remainingCalories)} kcal
                </strong>{" "}
                •{" "}
                <strong className="text-macro-protein font-semibold">
                  {context.remainingProteinG}g Protein
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
          <Badge variant="default" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Gemini BYOK Aktif
          </Badge>
        ) : (
          <Link href="/settings">
            <Badge variant="outline" className="gap-1 hover:border-primary">
              <KeyRound className="h-3 w-3 text-primary" />
              Atur Gemini Key di Settings
            </Badge>
          </Link>
        )}
      </div>

      {/* Chat Conversation Box */}
      <Card className="flex flex-col min-h-[440px]">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm">Diskusi Strategi Nutrisi</CardTitle>
          <CardDescription>
            Pilih topik cepat di bawah atau ketik pertanyaan spesifik seputar menu bulking/diet.
          </CardDescription>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isSending}
                onClick={() => void handleSendMessage(prompt)}
                className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-left text-[11px] font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between p-4 space-y-4">
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-2 my-6">
                <BotMessageSquare className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm font-semibold">
                  Mulai Konsultasi dengan AI Diet Coach
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Tanyakan porsi makan malam, resep tinggi protein murah, atau strategi surplus/defisit sesuai target berat badan Anda.
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <BotMessageSquare className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex gap-2.5 items-center text-xs text-muted-foreground animate-pulse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <BotMessageSquare className="h-4 w-4" />
                </div>
                <span>Gemini Coach sedang menganalisis menu terbaik...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
              placeholder="Tanyakan seputar bulking, cutting, atau ide makanan..."
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="shrink-0 gap-1.5"
            >
              <Send className="h-4 w-4" />
              {isSending ? "..." : "Kirim"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

