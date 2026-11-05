export interface ReferenceFoodItem {
  name: string;
  category: "karbohidrat" | "protein_hewani" | "protein_nabati" | "buah_sayur" | "suplemen_susu";
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export const INDONESIAN_FITNESS_FOODS: ReferenceFoodItem[] = [
  {
    name: "Nasi Putih Matang",
    category: "karbohidrat",
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
  },
  {
    name: "Nasi Merah Matang",
    category: "karbohidrat",
    caloriesPer100g: 111,
    proteinPer100g: 2.6,
    carbsPer100g: 23.0,
    fatPer100g: 0.9,
  },
  {
    name: "Dada Ayam Panggang / Rebus (Tanpa Kulit)",
    category: "protein_hewani",
    caloriesPer100g: 165,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
  },
  {
    name: "Ayam Goreng Bagian Dada",
    category: "protein_hewani",
    caloriesPer100g: 246,
    proteinPer100g: 27.0,
    carbsPer100g: 4.5,
    fatPer100g: 13.2,
  },
  {
    name: "Paha Ayam Panggang / Bakar",
    category: "protein_hewani",
    caloriesPer100g: 209,
    proteinPer100g: 26.0,
    carbsPer100g: 0.0,
    fatPer100g: 10.9,
  },
  {
    name: "Telur Ayam Rebus Utuh",
    category: "protein_hewani",
    caloriesPer100g: 155,
    proteinPer100g: 12.6,
    carbsPer100g: 1.1,
    fatPer100g: 10.6,
  },
  {
    name: "Telur Dadar / Ceplok",
    category: "protein_hewani",
    caloriesPer100g: 196,
    proteinPer100g: 13.6,
    carbsPer100g: 0.8,
    fatPer100g: 15.0,
  },
  {
    name: "Putih Telur Rebus",
    category: "protein_hewani",
    caloriesPer100g: 52,
    proteinPer100g: 10.9,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
  },
  {
    name: "Daging Sapi Tanpa Lemak (Sirloin/Tenderloin)",
    category: "protein_hewani",
    caloriesPer100g: 217,
    proteinPer100g: 26.1,
    carbsPer100g: 0.0,
    fatPer100g: 11.8,
  },
  {
    name: "Ikan Tongkol / Tuna Kukus",
    category: "protein_hewani",
    caloriesPer100g: 132,
    proteinPer100g: 28.0,
    carbsPer100g: 0.0,
    fatPer100g: 1.3,
  },
  {
    name: "Ikan Lele Goreng",
    category: "protein_hewani",
    caloriesPer100g: 240,
    proteinPer100g: 18.5,
    carbsPer100g: 6.0,
    fatPer100g: 15.5,
  },
  {
    name: "Tempe Kukus / Panggang",
    category: "protein_nabati",
    caloriesPer100g: 192,
    proteinPer100g: 20.3,
    carbsPer100g: 7.6,
    fatPer100g: 10.8,
  },
  {
    name: "Tempe Goreng",
    category: "protein_nabati",
    caloriesPer100g: 225,
    proteinPer100g: 18.0,
    carbsPer100g: 10.4,
    fatPer100g: 13.5,
  },
  {
    name: "Tahu Putih / Kukus",
    category: "protein_nabati",
    caloriesPer100g: 76,
    proteinPer100g: 8.1,
    carbsPer100g: 1.9,
    fatPer100g: 4.8,
  },
  {
    name: "Tahu Goreng",
    category: "protein_nabati",
    caloriesPer100g: 145,
    proteinPer100g: 9.7,
    carbsPer100g: 3.5,
    fatPer100g: 10.8,
  },
  {
    name: "Oatmeal Rolled Oats (Kering)",
    category: "karbohidrat",
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
  },
  {
    name: "Kentang Rebus",
    category: "karbohidrat",
    caloriesPer100g: 87,
    proteinPer100g: 1.9,
    carbsPer100g: 20.1,
    fatPer100g: 0.1,
  },
  {
    name: "Ubi Cilembu / Ubi Jalar Kukus",
    category: "karbohidrat",
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20.1,
    fatPer100g: 0.1,
  },
  {
    name: "Roti Gandum (Whole Wheat)",
    category: "karbohidrat",
    caloriesPer100g: 247,
    proteinPer100g: 13.0,
    carbsPer100g: 41.0,
    fatPer100g: 3.4,
  },
  {
    name: "Pisang Ambon / Cavendish",
    category: "buah_sayur",
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
  },
  {
    name: "Alpukat",
    category: "buah_sayur",
    caloriesPer100g: 160,
    proteinPer100g: 2.0,
    carbsPer100g: 8.5,
    fatPer100g: 14.7,
  },
  {
    name: "Brokoli / Sayur Hijau Rebus",
    category: "buah_sayur",
    caloriesPer100g: 35,
    proteinPer100g: 2.4,
    carbsPer100g: 7.2,
    fatPer100g: 0.4,
  },
  {
    name: "Selai Kacang (Peanut Butter)",
    category: "protein_nabati",
    caloriesPer100g: 588,
    proteinPer100g: 25.0,
    carbsPer100g: 20.0,
    fatPer100g: 50.0,
  },
  {
    name: "Susu Sapi Full Cream (Cair)",
    category: "suplemen_susu",
    caloriesPer100g: 61,
    proteinPer100g: 3.2,
    carbsPer100g: 4.8,
    fatPer100g: 3.3,
  },
  {
    name: "Whey Protein Isolate / Concentrate (Bubuk)",
    category: "suplemen_susu",
    caloriesPer100g: 385,
    proteinPer100g: 78.0,
    carbsPer100g: 8.0,
    fatPer100g: 4.5,
  },
];

/**
 * Menghitung makro berdasarkan pencarian nama makanan lokal dan berat dalam gram.
 */
export function estimateMacrosFromLocalCatalog(foodQuery: string, weightGrams: number) {
  const normalizedQuery = foodQuery.trim().toLowerCase();
  const matched = INDONESIAN_FITNESS_FOODS.find(
    (item) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(item.name.toLowerCase().split(" ")[0] ?? "")
  );

  if (!matched) {
    return null;
  }

  const ratio = weightGrams / 100;
  return {
    foodName: matched.name,
    weightGrams,
    calories: Math.round(matched.caloriesPer100g * ratio),
    proteinG: Number((matched.proteinPer100g * ratio).toFixed(1)),
    carbsG: Number((matched.carbsPer100g * ratio).toFixed(1)),
    fatG: Number((matched.fatPer100g * ratio).toFixed(1)),
    source: "local_db" as const,
  };
}

