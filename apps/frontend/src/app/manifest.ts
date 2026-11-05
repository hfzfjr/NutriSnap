import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriSnap — AI Nutrition, Bulking & Diet Tracker",
    short_name: "NutriSnap",
    description:
      "Snap your plate and hit your bulking or cutting macros with Google Gemini Multimodal AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#090D16",
    theme_color: "#10B981",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

