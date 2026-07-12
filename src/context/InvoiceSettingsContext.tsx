import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface InvoiceSettings {
  subjectTemplate: string;
  bodyTemplate: string;
  updatedAt: number;
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  subjectTemplate: "Your application has been approved — {{companyName}}",
  bodyTemplate: `<p>Hello {{companyName}},</p>
<p>Great news — your pixel placement application has been approved.</p>
<p>Order summary: {{selectedBlocks}} block(s), {{selectedPixels}} pixels, total <strong>{{total}}</strong>.</p>
<p>Please return to The Million Dollar Crypto Page buy page to complete your crypto payment and secure your placement.</p>
<p>Best regards,<br />The Million Dollar Crypto Page Team</p>`,
  updatedAt: Date.now(),
};

interface InvoiceSettingsContextValue {
  settings: InvoiceSettings;
  loading: boolean;
  saveSettings: (settings: InvoiceSettings) => Promise<void>;
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextValue | undefined>(undefined);

const SETTINGS_DOC = doc(db, "config", "invoiceSettings");

export const InvoiceSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      SETTINGS_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as InvoiceSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load invoice settings", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveSettings = useCallback(async (next: InvoiceSettings) => {
    const payload = {
      ...next,
      updatedAt: Date.now(),
    };
    await setDoc(SETTINGS_DOC, payload, { merge: true });
    setSettings(payload);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      saveSettings,
    }),
    [settings, loading, saveSettings]
  );

  return <InvoiceSettingsContext.Provider value={value}>{children}</InvoiceSettingsContext.Provider>;
};

export const useInvoiceSettings = () => {
  const ctx = useContext(InvoiceSettingsContext);
  if (!ctx) {
    throw new Error("useInvoiceSettings must be used within an InvoiceSettingsProvider");
  }
  return ctx;
};















