import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const defaultAssets = [
  {
    name: "BEE Character Sprite",
    type: "sprite",
    url: "https://opengameart.org/content/bee-character",
    license: "CC0",
    isFree: true,
    source: "OpenGameArt",
    tags: JSON.stringify(["bee", "character", "pixel_art", "platformer"]),
  },
  {
    name: "Platform Tileset",
    type: "sprite",
    url: "https://opengameart.org/content/platform-tileset",
    license: "CC-BY 3.0",
    isFree: true,
    source: "OpenGameArt",
    tags: JSON.stringify(["tileset", "platform", "pixel_art", "grass", "stone"]),
  },
  {
    name: "Jump Sound Effect",
    type: "sound",
    url: "https://opengameart.org/content/jump-sound-effect",
    license: "CC0",
    isFree: true,
    source: "OpenGameArt",
    tags: JSON.stringify(["sfx", "jump", "8bit"]),
  },
  {
    name: "Background Music — Level 1",
    type: "sound",
    url: "https://opengameart.org/content/background-music-level-1",
    license: "CC-BY 4.0",
    isFree: true,
    source: "OpenGameArt",
    tags: JSON.stringify(["music", "background", "chiptune", "loop"]),
  },
  {
    name: "Pixel Font",
    type: "font",
    url: "https://www.dafont.com/pixel-font.font",
    license: "Free for personal use",
    isFree: true,
    source: "DaFont",
    tags: JSON.stringify(["font", "pixel", "ui"]),
  },
];

export async function GET() {
  let added = 0;
  for (const asset of defaultAssets) {
    const exists = await prisma.asset.findFirst({ where: { name: asset.name } });
    if (!exists) {
      await prisma.asset.create({ data: asset });
      added++;
    }
  }
  return NextResponse.json({ message: "Assets seeded", added, total: defaultAssets.length });
}