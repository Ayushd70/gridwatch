import type { MetadataRoute } from "next";

const base = "https://gridwatch.ayushd70.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/standings", "/results", "/calendar"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
