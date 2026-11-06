"use client";

import type { AiFoodScanResponse, MealItemInput } from "@nutrisnap/shared";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  KeyRound,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { todayISO } from "@/lib/date";
import { formatGram, formatKcal, formatNumber } from "@/lib/format";
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

  // API Key status check
  const [apiKeyStatus, setApiKeyStatus] = React.useState<{
    hasKey: boolean;
    isValid: boolean;
  } | null>(null);

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

    apiFetch<{ hasKey: boolean; isValid: boolean }>("/apikey/status")
      .then(setApiKeyStatus)
      .catch(() => {});
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      toast.error(
        err instanceof Error ? err.message : "Gagal memproses file foto."
      );
    }
  };

  const handleRunGeminiScan = async () => {
    if (!previewUrl) return;
    setIsScanning(true);
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
      toast.success("Foto berhasil dianalisis oleh Gemini AI!");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal menganalisis foto makanan dengan Gemini AI."
      );
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

  const handleUpdateScannedItemName = (index: number, newName: string) => {
    setScannedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, foodName: newName } : item))
    );
  };

  const handleAddManualComponent = () => {
    setScannedItems((prev) => [
      ...prev,
      {
        foodName: "Komponen Tambahan",
        weightGrams: 100,
        calories: 100,
        proteinG: 5,
        carbsG: 15,
        fatG: 2,
      },
    ]);
  };

  const handleSaveAiScannedMeal = async () => {
    if (scannedItems.length === 0) return;
    setIsSaving(true);
    try {
      const todayStr = todayISO();
      await apiFetch("/meals", {
        method: "POST",
        body: JSON.stringify({
          loggedDate: todayStr,
          mealType,
          source: "ai_scan",
          title: scannedMealTitle.trim() || "Makanan Hasil AI Scan",
          aiNotes: scannedNotes,
          items: scannedItems,
        }),
      });
      toast.success("Catatan makanan hasil scan berhasil disimpan!");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan log makanan."
      );
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
      toast.success(`Estimasi nutrisi ${res.foodName} (${queryWeight}g) berhasil.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghitung estimasi nutrisi."
      );
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSaveManualMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFoodName.trim() || manualWeightGrams <= 0) {
      toast.error("Nama makanan dan berat harus diisi.");
      return;
    }

    setIsSaving(true);
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
      toast.success(`Berhasil mencatat ${manualFoodName} (${manualWeightGrams}g)!`);
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan log manual."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Catat Makanan Harian
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gunakan AI Vision untuk mengekstrak makronutrisi dari foto piring atau
          masukkan nama makanan secara manual.
        </p>
      </div>

      {/* Banner Kunci Gemini API (BYOK) jika belum diatur */}
      {apiKeyStatus && !apiKeyStatus.hasKey && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-status-under/40 bg-status-under/10 p-4 text-xs">
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <KeyRound className="h-4 w-4 text-status-under shrink-0" />
            <span>
              Kunci Google Gemini API belum diatur. Analisis foto membutuhkan kunci
              pribadi gratis dari Google AI Studio.
            </span>
          </div>
          <Link href="/settings" className="shrink-0">
            <Button size="sm" variant="outline" className="h-8 text-xs border-status-under/40 hover:bg-status-under/20">
              Atur Kunci Sekarang
            </Button>
          </Link>
        </div>
      )}

      {/* Sesi Makan Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground">Sesi Makan:</span>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["breakfast", "Sarapan Pagi"],
              ["lunch", "Makan Siang"],
              ["dinner", "Makan Malam"],
              ["snack", "Camilan / Snack"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={mealType === key ? "default" : "outline"}
              onClick={() => setMealType(key)}
              className="h-8 text-xs font-medium"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/80 p-1 border border-border">
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
          AI Food Scanner (Foto)
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

      {/* TAB 1: AI FOOD PHOTO SCANNER */}
      {activeTab === "ai_scan" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Food Photo Scanner (Gemini Multimodal)
            </CardTitle>
            <CardDescription>
              Foto piring kamu akan dikompresi otomatis (&le;1280px WebP) sebelum diekstrak nutrisinya.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Dwi-Aksi Kamera HP vs Galeri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center cursor-pointer hover:bg-primary/10 transition-colors">
                <Camera className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <span className="text-xs font-semibold text-foreground block">
                    Ambil Foto Kamera
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Buka kamera ponsel langsung
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

              <label className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-secondary/50 p-4 text-center cursor-pointer hover:bg-secondary/80 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <span className="text-xs font-semibold text-foreground block">
                    Pilih dari Galeri
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Pilih foto piring dari galeri HP
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview & Kompresi */}
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
                    <span>Kompresi Gambar di Perangkat:</span>
                    <Badge variant="default">
                      {compressionStats.beforeKb} KB &rarr; {compressionStats.afterKb} KB
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <Field
              label="Catatan Konteks Opsional (Membantu Akurasi AI)"
              helperText="Misal: 'Dada ayam tanpa kulit, nasi setengah porsi'"
            >
              <Input
                value={userContextNote}
                onChange={(e) => setUserContextNote(e.target.value)}
                placeholder="Tuliskan detail khusus makanan jika ada..."
              />
            </Field>

            <Button
              type="button"
              onClick={() => void handleRunGeminiScan()}
              disabled={!previewUrl || isScanning}
              className="w-full gap-2 font-semibold shadow-sm"
            >
              <Camera className="h-4 w-4" />
              {isScanning
                ? "Gemini sedang menganalisis kalori & protein..."
                : "Ekstrak Nutrisi dengan Gemini AI"}
            </Button>

            {/* Editable Confirmation Result List */}
            {scannedItems.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Judul Menu Makanan:
                  </label>
                  <Input
                    value={scannedMealTitle}
                    onChange={(e) => setScannedMealTitle(e.target.value)}
                    placeholder="Judul makanan..."
                  />
                </div>

                {scannedNotes && (
                  <p className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary leading-relaxed">
                    {scannedNotes}
                  </p>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Daftar Komponen Makanan:</span>
                    <button
                      type="button"
                      onClick={handleAddManualComponent}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Komponen
                    </button>
                  </div>

                  {scannedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <Input
                          value={item.foodName}
                          onChange={(e) => handleUpdateScannedItemName(idx, e.target.value)}
                          className="h-8 text-xs font-semibold"
                        />
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatNumber(item.calories)} kcal •{" "}
                          <strong className="text-macro-protein font-semibold">
                            {formatGram(item.proteinG)} Protein
                          </strong>{" "}
                          • {formatGram(item.carbsG)} Karbo • {formatGram(item.fatG)} Lemak
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[100, 150, 200].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateScannedItemWeight(idx, preset)}
                              className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                                item.weightGrams === preset
                                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                                  : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                              }`}
                            >
                              {preset}g
                            </button>
                          ))}
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min={1}
                            max={5000}
                            value={item.weightGrams}
                            onChange={(e) =>
                              handleUpdateScannedItemWeight(idx, Number(e.target.value))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() =>
                            setScannedItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label={`Hapus ${item.foodName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={() => void handleSaveAiScannedMeal()}
                  disabled={isSaving}
                  className="w-full gap-2 font-semibold shadow-sm mt-3"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSaving ? "Menyimpan Catatan..." : "Simpan ke Jurnal Harian"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: MANUAL INPUT FORM */}
      {activeTab === "manual" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="h-5 w-5 text-primary" />
              Input Manual Makanan & Berat (Gram)
            </CardTitle>
            <CardDescription>
              Pilih dari saran makanan lokal populer atau ketik nama makanan beserta berat gramasinya.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Pilihan Cepat Makanan Nusantara:
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
                    className="rounded-xl border border-border bg-secondary/70 px-2.5 py-1 text-xs text-foreground hover:bg-secondary hover:border-primary/40 transition-colors"
                  >
                    + {food}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveManualMeal} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="Nama Makanan" required>
                    <Input
                      required
                      value={manualFoodName}
                      onChange={(e) => setManualFoodName(e.target.value)}
                      placeholder="Contoh: Dada Ayam Panggang"
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Berat (Gram)" required>
                    <Input
                      type="number"
                      required
                      min={1}
                      max={5000}
                      value={manualWeightGrams}
                      onChange={(e) => setManualWeightGrams(Number(e.target.value))}
                    />
                  </Field>
                  <div className="flex gap-1 pt-1.5">
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
                            : "bg-secondary text-muted-foreground hover:text-foreground border-border"
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
                className="w-full gap-2 border border-border"
                onClick={() => void handleEstimateManualMacros()}
                disabled={isEstimating || !manualFoodName.trim()}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                {isEstimating
                  ? "Menghitung Makro..."
                  : "Hitung Kalori & Makro Otomatis"}
              </Button>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Kalori (kcal)">
                  <Input
                    type="number"
                    min={0}
                    value={manualCalories}
                    onChange={(e) => setManualCalories(Number(e.target.value))}
                  />
                </Field>
                <Field label="Protein (g)">
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={manualProteinG}
                    onChange={(e) => setManualProteinG(Number(e.target.value))}
                  />
                </Field>
                <Field label="Karbohidrat (g)">
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={manualCarbsG}
                    onChange={(e) => setManualCarbsG(Number(e.target.value))}
                  />
                </Field>
                <Field label="Lemak (g)">
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={manualFatG}
                    onChange={(e) => setManualFatG(Number(e.target.value))}
                  />
                </Field>
              </div>

              <Button
                type="submit"
                disabled={isSaving || !manualFoodName.trim() || manualWeightGrams <= 0}
                className="w-full gap-2 font-semibold shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Catatan Manual"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
