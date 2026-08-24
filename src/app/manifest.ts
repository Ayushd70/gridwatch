import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gridwatch",
    short_name: "Gridwatch",
    description: "Unofficial fan timing board for race weekends.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png" }],
  };
}
