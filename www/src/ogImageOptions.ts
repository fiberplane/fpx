import { OGImageRoute } from "astro-og-canvas";

type OGImageOptions = Omit<
  Awaited<
    ReturnType<Parameters<typeof OGImageRoute>[number]["getImageOptions"]>
  >,
  "title" | "description"
>;

export const ogImageOptions: OGImageOptions = {
  bgGradient: [
    [35, 34, 32],
    [27, 26, 24]
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
  padding: 48,
  border: {
    color: [255, 87, 51],
    side: "inline-start",
    width: 8
  },
  fonts: [
    "./src/assets/_fonts/Geist-Light.ttf",
    "./src/assets/_fonts/InstrumentSans-SemiBold.ttf"
  ]
};
