import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NutriSnap — Catat kalori & protein dari foto",
    short_name: "NutriSnap",
    description:
      "Pencatat kalori dan protein untuk bulking dan diet dengan kamera AI Google Gemini dan keamanan BYOK mandiri.",
    lang: "id",
    scope: "/",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#1D4A38",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Catat makanan",
        url: "/log",
      },
    ],
  };
}
