import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type StorySettings, DEFAULT_STORY_SETTINGS } from "@/types/story";
import { toast } from "sonner";

interface StorySettingsContextValue {
  settings: StorySettings;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<StorySettings>) => Promise<void>;
}

const StorySettingsContext = createContext<StorySettingsContextValue | undefined>(undefined);
const DOC_PATH = "settings/story";

export const StorySettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<StorySettings>(DEFAULT_STORY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, DOC_PATH),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_STORY_SETTINGS, ...snapshot.data() } as StorySettings);
        } else {
          setSettings(DEFAULT_STORY_SETTINGS);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load story settings", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<StorySettings>) => {
    const newSettings = { ...settings, ...updates };
    await setDoc(doc(db, DOC_PATH), newSettings);
    toast.success("Story settings updated.");
  }, [settings]);

  const value = useMemo<StorySettingsContextValue>(
    () => ({
      settings,
      loading,
      error,
      updateSettings,
    }),
    [settings, loading, error, updateSettings]
  );

  return <StorySettingsContext.Provider value={value}>{children}</StorySettingsContext.Provider>;
};

export const useStorySettings = () => {
  const ctx = useContext(StorySettingsContext);
  if (!ctx) {
    throw new Error("useStorySettings must be used within a StorySettingsProvider");
  }
  return ctx;
};
