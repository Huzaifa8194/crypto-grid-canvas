import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type AuctionSettings, DEFAULT_AUCTION_SETTINGS } from "@/types/auction";
import { toast } from "sonner";

interface AuctionSettingsContextValue {
  settings: AuctionSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<AuctionSettings>) => Promise<void>;
}

const AuctionSettingsContext = createContext<AuctionSettingsContextValue | undefined>(undefined);
const DOC_PATH = "settings/auction";

export const AuctionSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AuctionSettings>(DEFAULT_AUCTION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, DOC_PATH),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_AUCTION_SETTINGS, ...snapshot.data() } as AuctionSettings);
        } else {
          setSettings(DEFAULT_AUCTION_SETTINGS);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load auction settings", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AuctionSettings>) => {
    const newSettings = { ...settings, ...updates };
    await setDoc(doc(db, DOC_PATH), newSettings);
    toast.success("Auction settings updated.");
  }, [settings]);

  const value = useMemo<AuctionSettingsContextValue>(
    () => ({
      settings,
      loading,
      error,
      updateSettings,
    }),
    [settings, loading, error, updateSettings]
  );

  return <AuctionSettingsContext.Provider value={value}>{children}</AuctionSettingsContext.Provider>;
};

export const useAuctionSettings = () => {
  const ctx = useContext(AuctionSettingsContext);
  if (!ctx) {
    throw new Error("useAuctionSettings must be used within an AuctionSettingsProvider");
  }
  return ctx;
};
