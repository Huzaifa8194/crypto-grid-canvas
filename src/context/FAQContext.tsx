import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type FAQItem, type CreateFAQItemInput } from "@/types/faq";
import { toast } from "sonner";

interface FAQContextValue {
  items: FAQItem[];
  loading: boolean;
  error: string | null;
  addItem: (input: CreateFAQItemInput) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<FAQItem, "id">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  moveItem: (itemId: string, direction: "up" | "down") => Promise<void>;
}

const FAQContext = createContext<FAQContextValue | undefined>(undefined);
const COLLECTION = "faqItems";

export const FAQProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FAQItem, "id">),
          }))
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load FAQ items", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addItem = useCallback(async ({ question, answer }: CreateFAQItemInput) => {
    const order = (items[items.length - 1]?.order ?? 0) + 1;
    await addDoc(collection(db, COLLECTION), {
      question: question.trim(),
      answer: answer.trim(),
      order,
      createdAt: Date.now(),
    });
    toast.success("FAQ item added.");
  }, [items]);

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<FAQItem, "id">>) => {
    // If updating string fields, trim them
    const cleanedUpdates: any = { ...updates };
    if (cleanedUpdates.question !== undefined) cleanedUpdates.question = cleanedUpdates.question.trim();
    if (cleanedUpdates.answer !== undefined) cleanedUpdates.answer = cleanedUpdates.answer.trim();

    await updateDoc(doc(db, COLLECTION, id), cleanedUpdates);
    toast.success("FAQ item updated.");
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
    toast.success("FAQ item removed.");
  }, []);

  const moveItem = useCallback(
    async (itemId: string, direction: "up" | "down") => {
      const index = items.findIndex((item) => item.id === itemId);
      if (index === -1) return;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return;
      const batch = writeBatch(db);
      const current = items[index];
      const target = items[targetIndex];
      batch.update(doc(db, COLLECTION, current.id), { order: target.order });
      batch.update(doc(db, COLLECTION, target.id), { order: current.order });
      await batch.commit();
      toast.success(`Moved FAQ item ${direction}.`);
    },
    [items]
  );

  const value = useMemo<FAQContextValue>(
    () => ({
      items,
      loading,
      error,
      addItem,
      updateItem,
      deleteItem,
      moveItem,
    }),
    [items, loading, error, addItem, updateItem, deleteItem, moveItem]
  );

  return <FAQContext.Provider value={value}>{children}</FAQContext.Provider>;
};

export const useFAQ = () => {
  const ctx = useContext(FAQContext);
  if (!ctx) {
    throw new Error("useFAQ must be used within a FAQProvider");
  }
  return ctx;
};
