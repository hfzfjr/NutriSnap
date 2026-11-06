/**
 * format.ts — Standar pemformatan angka, satuan, dan teks NutriSnap (id-ID).
 * Ribuan memakai titik, desimal memakai koma (mis. "2.415 kcal", "58,5 kg").
 * Sesuai panduan di docs/REFACTOR.md §0.5 dan §2.4.
 */

export function formatNumber(n: number, maxFractionDigits: number = 0): string {
  if (typeof n !== "number" || isNaN(n)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
}

export function formatKcal(n: number): string {
  return `${formatNumber(n, 0)} kcal`;
}

export function formatGram(n: number, maxFractionDigits: number = 1): string {
  return `${formatNumber(n, maxFractionDigits)} g`;
}

export function formatKg(n: number, maxFractionDigits: number = 1): string {
  return `${formatNumber(n, maxFractionDigits)} kg`;
}

export function formatCm(n: number): string {
  return `${formatNumber(n, 0)} cm`;
}

export function formatBmiCategory(category: string): string {
  switch (category?.toLowerCase()) {
    case "underweight":
      return "Kurus";
    case "normal":
      return "Normal";
    case "overweight":
      return "Gemuk";
    case "obese":
      return "Obesitas";
    default:
      return category || "Normal";
  }
}
