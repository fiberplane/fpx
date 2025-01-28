import { OGImageRoute } from "astro-og-canvas";

type OGImageOptions = Omit<
  Awaited<ReturnType<Parameters<typeof OGImageRoute>[0]["getImageOptions"]>>,
  "title" | "description"
>;

export const ogImageOptions: OGImageOptions = {
  bgGradient: [
    [27, 26, 24],
    [35, 34, 32]
  ],
  logo: {
    path: "./src/assets/fp-og-logo.png",
    size: [150, 150]
  },
  font: {
    title: {
      size: 72,
      families: ["Instrument Sans"]
    },
    description: {
      size: 48,
      families: ["Geist"]
    }
  },
  padding: 40,
  fonts: [
    "./src/assets/_fonts/Geist-Light.ttf",
    "./src/assets/_fonts/InstrumentSans-SemiBold.ttf"
  ]
};
