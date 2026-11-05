import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriSnap — AI Nutrition, Bulking & Diet Tracker",
    short_name: "NutriSnap",
    description:
      "Snap your plate and hit your bulking or cutting macros with Google Gemini Multimodal AI.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#090D16",
    theme_color: "#10B981",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
