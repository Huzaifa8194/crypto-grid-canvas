import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type ContactSettings, DEFAULT_CONTACT_SETTINGS } from "@/types/contact";
import { toast } from "sonner";

interface ContactSettingsContextValue {
  settings: ContactSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<ContactSettings>) => Promise<void>;
}

const ContactSettingsContext = createContext<ContactSettingsContextValue | undefined>(undefined);
const DOC_PATH = "settings/contact";

export const ContactSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, DOC_PATH),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_CONTACT_SETTINGS, ...snapshot.data() } as ContactSettings);
        } else {
          setSettings(DEFAULT_CONTACT_SETTINGS);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load contact settings", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<ContactSettings>) => {
    const newSettings = { ...settings, ...updates };
    await setDoc(doc(db, DOC_PATH), newSettings);
    toast.success("Contact settings updated.");
  }, [settings]);

  const value = useMemo<ContactSettingsContextValue>(
    () => ({
      settings,
      loading,
      error,
      updateSettings,
    }),
    [settings, loading, error, updateSettings]
  );

  return <ContactSettingsContext.Provider value={value}>{children}</ContactSettingsContext.Provider>;
};

export const useContactSettings = () => {
  const ctx = useContext(ContactSettingsContext);
  if (!ctx) {
    throw new Error("useContactSettings must be used within a ContactSettingsProvider");
  }
  return ctx;
};



