import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback, useRef } from "react";
import { collection, doc, onSnapshot, setDoc, getDocs, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cacheRegions, loadCachedRegions } from "@/lib/localPixelCache";
import { type BlockCoordinate, type PixelRegion } from "@/types/pixels";
import { expandRegionsToBlocks } from "@/lib/pixelMath";

interface PixelMetadataContextValue {
  regions: PixelRegion[];
  loading: boolean;
  error: string | null;
  lockedBlocks: BlockCoordinate[];
  refresh: () => Promise<void>;
  upsertRegion: (region: PixelRegion) => Promise<void>;
}

const PixelMetadataContext = createContext<PixelMetadataContextValue | undefined>(undefined);

const COLLECTION = "pixelRegions";

const mapDoc = (snapshot: QueryDocumentSnapshot): PixelRegion => {
  const data = snapshot.data() as PixelRegion;
  return {
    ...data,
    id: snapshot.id,
  };
};

export const PixelMetadataProvider = ({ children }: { children: ReactNode }) => {
  const [regions, setRegions] = useState<PixelRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cachedMapRef = useRef<Record<string, PixelRegion>>({});

  const sortRegions = useCallback((items: PixelRegion[]) => {
    return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const initialize = async () => {
      setLoading(true);
      try {
        const cached = await loadCachedRegions();
        if (cached.length > 0) {
          cachedMapRef.current = Object.fromEntries(cached.map((item) => [item.id, item]));
          setRegions(sortRegions(cached));
        }
      } catch (err) {
        console.error("Failed to load cached pixel metadata", err);
      }

      unsubscribe = onSnapshot(
        collection(db, COLLECTION),
        (snapshot) => {
          const next = snapshot.docs.map(mapDoc).map((item) => {
            const cached = cachedMapRef.current[item.id];
            if (cached?.imageDataUrl && !item.imageDataUrl) {
              return { ...item, imageDataUrl: cached.imageDataUrl };
            }
            return item;
          });
          const sorted = sortRegions(next);
          setRegions(sorted);
          cacheRegions(sorted).catch((cacheErr) => {
            console.error("Failed to cache pixel metadata", cacheErr);
          });
          cachedMapRef.current = Object.fromEntries(sorted.map((entry) => [entry.id, entry]));
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error("Failed to sync pixel metadata", err);
          setError(err.message);
          setLoading(false);
        }
      );
    };

    initialize();
    return () => {
      unsubscribe?.();
    };
  }, [sortRegions]);

  const refresh = useCallback(async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const next = sortRegions(
      snapshot.docs.map(mapDoc).map((item) => {
        const cached = cachedMapRef.current[item.id];
        if (cached?.imageDataUrl && !item.imageDataUrl) {
          return { ...item, imageDataUrl: cached.imageDataUrl };
        }
        return item;
      })
    );
    setRegions(next);
    try {
      await cacheRegions(next);
    } catch (err) {
      console.error("Failed to update pixel metadata cache", err);
    }
    cachedMapRef.current = Object.fromEntries(next.map((entry) => [entry.id, entry]));
  }, [sortRegions]);

  const upsertRegion = useCallback(
    async (region: PixelRegion) => {
      const regionDoc = doc(db, COLLECTION, region.id);
      const { imageDataUrl, ...docRegion } = region;
      await setDoc(regionDoc, docRegion);
      const nextRegion: PixelRegion = imageDataUrl ? { ...docRegion, imageDataUrl } : docRegion;
      const next = sortRegions([...regions.filter((r) => r.id !== region.id), nextRegion]);
      setRegions(next);
      try {
        await cacheRegions(next);
      } catch (err) {
        console.error("Failed to update pixel metadata cache after upsert", err);
      }
      cachedMapRef.current = Object.fromEntries(next.map((entry) => [entry.id, entry]));
    },
    [sortRegions, regions]
  );

  const value = useMemo(
    () => ({
      regions,
      loading,
      error,
      lockedBlocks: expandRegionsToBlocks(regions),
      refresh,
      upsertRegion,
    }),
    [regions, loading, error, refresh, upsertRegion]
  );

  return <PixelMetadataContext.Provider value={value}>{children}</PixelMetadataContext.Provider>;
};

export const usePixelMetadata = () => {
  const ctx = useContext(PixelMetadataContext);
  if (!ctx) {
    throw new Error("usePixelMetadata must be used within a PixelMetadataProvider");
  }
  return ctx;
};

