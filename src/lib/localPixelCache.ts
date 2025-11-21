import localforage from "localforage";
import { type PixelRegion } from "@/types/pixels";

const cache = localforage.createInstance({
  name: "crypto-grid",
  storeName: "pixel-metadata",
  description: "Local cache for pixel metadata assignments",
});

const CACHE_KEY = "pixelRegions";

export const loadCachedRegions = async (): Promise<PixelRegion[]> => {
  const stored = await cache.getItem<PixelRegion[]>(CACHE_KEY);
  return stored ?? [];
};

export const cacheRegions = async (regions: PixelRegion[]) => {
  await cache.setItem(CACHE_KEY, regions);
};

