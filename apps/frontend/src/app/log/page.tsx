"use client";

import type { AiFoodScanResponse, MealItemInput } from "@nutrisnap/shared";
import {
  Camera,
  CheckCircle2,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { todayISO } from "@/lib/date";
import { compressFoodImageClient } from "@/lib/image-compress";

const QUICK_INDONESIAN_FOODS = [
  "Nasi Putih Matang",
  "Dada Ayam Panggang",
  "Telur Ayam Rebus Utuh",
  "Tempe Goreng",
  "Tahu Putih",
  "Oatmeal Rolled Oats",
  "Pisang Ambon",
  "Whey Protein",
];

export default function DualMealLoggerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"ai_scan" | "manual">(
    "ai_scan"
  );
  const [mealType, setMealType] = React.useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("lunch");

  // AI Scanner states
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [compressionStats, setCompressionStats] = React.useState<{
    beforeKb: number;
    afterKb: number;
  } | null>(null);
  const [userContextNote, setUserContextNote] = React.useState("");
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedMealTitle, setScannedMealTitle] = React.useState("");
  const [scannedItems, setScannedItems] = React.useState<MealItemInput[]>([]);
  const [scannedNotes, setScannedNotes] = React.useState<string | null>(null);

  // Manual Form states
  const [manualFoodName, setManualFoodName] = React.useState("");
  const [manualWeightGrams, setManualWeightGrams] = React.useState<number>(100);
  const [manualCalories, setManualCalories] = React.useState<number>(0);
  const [manualProteinG, setManualProteinG] = React.useState<number>(0);
  const [manualCarbsG, setManualCarbsG] = React.useState<number>(0);
  const [manualFatG, setManualFatG] = React.useState<number>(0);
  const [isEstimating, setIsEstimating] = React.useState(false);

  // Commit state
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramMealType = params.get("mealType");
      if (
        paramMealType === "breakfast" ||
        paramMealType === "lunch" ||
        paramMealType === "dinner" ||
        paramMealType === "snack"
      ) {
        setMealType(paramMealType);
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    try {
      const compressed = await compressFoodImageClient(file, {
        maxDimension: 1280,
        quality: 0.82,
      });
      setPreviewUrl(compressed.dataUrl);
      setCompressionStats({
        beforeKb: Math.max(1, Math.round(compressed.originalSizeBytes / 1024)),
        afterKb: Math.max(1, Math.round(compressed.compressedSizeBytes / 1024)),
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal memproses foto.",
      });
    }
  };

  const handleRunGeminiScan = async () => {
    if (!previewUrl) return;
    setIsScanning(true);
    setFeedback(null);
    try {
      const result = await apiFetch<AiFoodScanResponse>("/meals/scan-photo", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: previewUrl,
          mealType,
          userContextNote: userContextNote.trim() || undefined,
        }),
      });
      setScannedMealTitle(result.mealTitle);
      setScannedItems(result.items);
      setScannedNotes(result.nutritionNotes);
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Gagal menganalisis foto makanan dengan Gemini AI.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateScannedItemWeight = (index: number, newGrams: number) => {
    setScannedItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const oldGrams = Math.max(1, item.weightGrams);
        const ratio = Math.max(0, newGrams) / oldGrams;
        return {
          ...item,
          weightGrams: newGrams,
          calories: Math.round(item.calories * ratio),
          proteinG: Number((item.proteinG * ratio).toFixed(1)),
          carbsG: Number(((item.carbsG ?? 0) * ratio).toFixed(1)),
          fatG: Number(((item.fatG ?? 0) * ratio).toFixed(1)),
        };
      })
    );
  };

  const handleSaveAiScannedMeal = async () => {
    if (scannedItems.length === 0) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const todayStr = todayISO();
      await apiFetch("/meals", {
        method: "POST",
        body: JSON.stringify({
          loggedDate: todayStr,
          mealType,
          source: "ai_scan",
          title: scannedMealTitle || "Makanan Hasil AI Scan",
          aiNotes: scannedNotes,
          items: scannedItems,
        }),
      });
      setFeedback({
        type: "success",
        text: "Log makanan hasil AI Scan berhasil disimpan ke jurnal harian!",
      });
      setTimeout(() => router.push("/dashboard"), 700);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan log makanan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEstimateManualMacros = async (
    nameOverride?: string,
    weightOverride?: number
  ) => {
    const queryName = (nameOverride ?? manualFoodName).trim();
    const queryWeight = weightOverride ?? manualWeightGrams;
    if (!queryName || queryWeight <= 0) return;

    setIsEstimating(true);
    setFeedback(null);
    try {
      const res = await apiFetch<{
        foodName: string;
        weightGrams: number;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
      }>("/meals/estimate-manual", {
        method: "POST",
        body: JSON.stringify({
          foodName: queryName,
          weightGrams: queryWeight,
        }),
      });
      setManualFoodName(res.foodName);
      setManualCalories(res.calories);
      setManualProteinG(res.proteinG);
      setManualCarbsG(res.carbsG);
      setManualFatG(res.fatG);
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error ? err.message : "Gagal menghitung estimasi nutrisi.",
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSaveManualMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFoodName.trim() || manualWeightGrams <= 0) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const todayStr = todayISO();
      await apiFetch("/meals", {
        method: "POST",
        body: JSON.stringify({
          loggedDate: todayStr,
          mealType,
          source: "manual",
          title: `${manualFoodName.trim()} (${manualWeightGrams}g)`,
          items: [
            {
              foodName: manualFoodName.trim(),
              weightGrams: manualWeightGrams,
              calories: manualCalories,
              proteinG: manualProteinG,
              carbsG: manualCarbsG,
              fatG: manualFatG,
            },
          ],
        }),
      });
      setFeedback({
        type: "success",
        text: `Berhasil mencatat ${manualFoodName} (${manualWeightGrams}g) ke jurnal harian!`,
      });
      setTimeout(() => router.push("/dashboard"), 700);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan log manual.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Catat Asupan Nutrisi
        </h1>
        <p className="text-sm text-muted-foreground">
          Gunakan AI Food Photo Scanner (Gemini Multimodal) atau Input Manual (Nama Makanan + Berat Gram).
        </p>
      </div>

      {/* Pilihan Waktu Makan */}
      <div className="grid grid-cols-4 gap-2">
        {(
          [
            ["breakfast", "Sarapan"],
            ["lunch", "Makan Siang"],
            ["dinner", "Makan Malam"],
            ["snack", "Camilan"],
          ] as const
        ).map(([type, label]) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={mealType === type ? "default" : "outline"}
            onClick={() => setMealType(type)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Segmented Dual Mode Switcher */}
      <div className="grid grid-cols-2 rounded-2xl bg-secondary p-1">
        <button
          type="button"
          onClick={() => setActiveTab("ai_scan")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
            activeTab === "ai_scan"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-4 w-4 text-primary" />
          AI Food Photo Scanner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
            activeTab === "manual"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Scale className="h-4 w-4 text-primary" />
          Input Manual (Nama + Gram)
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-3 text-xs ${
            feedback.type === "success"
              ? "border-status-ontrack/40 bg-status-ontrack/10 text-status-ontrack font-medium"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* TAB 1: AI FOOD PHOTO SCANNER */}
      {activeTab === "ai_scan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Food Photo Scanner (Gemini Multimodal)
            </CardTitle>
            <CardDescription>
              Foto piring Anda akan dikompresi otomatis (&le;1280px WebP) sebelum diekstrak nutrisinya.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center cursor-pointer hover:border-primary/60 transition-colors">
              <Upload className="h-8 w-8 text-primary" />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold block">
                  Ambil Foto Kamera atau Pilih dari Galeri
                </span>
                <span className="text-xs text-muted-foreground block">
                  Mendukung JPEG, PNG, WebP (Otomatis dikompresi di perangkat)
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {previewUrl && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-border max-h-64 flex items-center justify-center bg-black/20">
                  <img
                    src={previewUrl}
                    alt="Pratinjau Makanan"
                    className="max-h-64 w-auto object-contain"
                  />
                </div>
                {compressionStats && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Optimasi Gambar Client-Side:</span>
                    <Badge variant="default">
                      {compressionStats.beforeKb} KB &rarr;{" "}
                      {compressionStats.afterKb} KB
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Catatan Konteks Opsional (Membantu Akurasi AI)
              </label>
              <Input
                value={userContextNote}
                onChange={(e) => setUserContextNote(e.target.value)}
                placeholder="Contoh: Nasi 200g dengan dada ayam bakar tanpa kulit"
              />
            </div>

            <Button
              type="button"
              onClick={handleRunGeminiScan}
              disabled={!previewUrl || isScanning}
              className="w-full gap-2"
            >
              <Camera className="h-4 w-4" />
              {isScanning
                ? "Gemini sedang menganalisis kalori & protein..."
                : "Ekstrak Nutrisi dengan Gemini AI"}
            </Button>

            {/* Editable Confirmation Result List */}
            {scannedItems.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Hasil Deteksi: {scannedMealTitle}
                  </h4>
                  <Badge variant="surplus">Editable Review</Badge>
                </div>

                {scannedNotes && (
                  <p className="rounded-xl bg-primary/10 p-2.5 text-xs text-primary">
                    {scannedNotes}
                  </p>
                )}

                <div className="space-y-2">
                  {scannedItems.map((item, idx) => (
                    <div
                      key={`${item.foodName}-${idx}`}
                      className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.foodName}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {item.calories} kcal •{" "}
                          <strong className="text-macro-protein font-semibold">
                            {item.proteinG}g Protein
                          </strong>{" "}
                          • {item.carbsG}g Karbo • {item.fatG}g Lemak
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Input
                            type="number"
                            value={item.weightGrams}
                            onChange={(e) =>
                              handleUpdateScannedItemWeight(
                                idx,
                                Number(e.target.value)
                              )
                            }
                            aria-label="Berat gram"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">g</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setScannedItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={handleSaveAiScannedMeal}
                  disabled={isSaving}
                  className="w-full gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSaving ? "Menyimpan..." : "Simpan ke Log Harian"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: MANUAL INPUT FORM (FOOD NAME + WEIGHT IN GRAMS) */}
      {activeTab === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Input Manual Makanan & Berat (Gram)
            </CardTitle>
            <CardDescription>
              Pilih dari saran makanan populer atau ketik nama makanan beserta beratnya dalam gram.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Pilihan Cepat Makanan Populer:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_INDONESIAN_FOODS.map((food) => (
                  <button
                    key={food}
                    type="button"
                    onClick={() => {
                      setManualFoodName(food);
                      void handleEstimateManualMacros(food, manualWeightGrams);
                    }}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                  >
                    + {food}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveManualMeal} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium">Nama Makanan</label>
                  <Input
                    required
                    value={manualFoodName}
                    onChange={(e) => setManualFoodName(e.target.value)}
                    placeholder="Contoh: Dada Ayam Panggang"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Berat (Gram)</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    max={5000}
                    value={manualWeightGrams}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setManualWeightGrams(val);
                    }}
                  />
                  <div className="flex gap-1 pt-0.5">
                    {[100, 150, 200, 250].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setManualWeightGrams(g);
                          if (manualFoodName.trim()) {
                            void handleEstimateManualMacros(manualFoodName, g);
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                          manualWeightGrams === g
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "bg-secondary/70 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full gap-2"
                onClick={() => void handleEstimateManualMacros()}
                disabled={isEstimating || !manualFoodName.trim()}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                {isEstimating
                  ? "Menghitung Makro..."
                  : "Hitung Kalori & Protein Otomatis dari Gramasi"}
              </Button>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary">
                    Kalori (kcal)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={manualCalories}
                    onChange={(e) => setManualCalories(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-macro-protein">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={manualProteinG}
                    onChange={(e) => setManualProteinG(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-macro-carbs">
                    Karbohidrat (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={manualCarbsG}
                    onChange={(e) => setManualCarbsG(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-macro-fat">
                    Lemak (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={manualFatG}
                    onChange={(e) => setManualFatG(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSaving || !manualFoodName.trim()}
              >
                <Plus className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Log Makanan Manual"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

