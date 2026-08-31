import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f6f3ec",
    description:
      "Grounded, focused chapter practice for every learner in the family.",
    display: "standalone",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    name: "StudyCraft",
    short_name: "StudyCraft",
    start_url: "/",
    theme_color: "#164f45",
  };
}
