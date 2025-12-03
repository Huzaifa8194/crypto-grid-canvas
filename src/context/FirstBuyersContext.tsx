import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { type CreateFirstBuyerInput, type FirstBuyer } from "@/types/firstBuyer";
import { toast } from "sonner";

interface FirstBuyersContextValue {
  buyers: FirstBuyer[];
  loading: boolean;
  error: string | null;
  addBuyer: (input: CreateFirstBuyerInput) => Promise<void>;
  deleteBuyer: (buyer: FirstBuyer) => Promise<void>;
  moveBuyer: (buyerId: string, direction: "up" | "down") => Promise<void>;
}

const FirstBuyersContext = createContext<FirstBuyersContextValue | undefined>(undefined);
const COLLECTION = "firstBuyers";

export const FirstBuyersProvider = ({ children }: { children: ReactNode }) => {
  const [buyers, setBuyers] = useState<FirstBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBuyers(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FirstBuyer, "id">),
          }))
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load first buyers", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addBuyer = useCallback(async ({ title, description, link, file }: CreateFirstBuyerInput) => {
    const storagePath = `first-buyers/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    const order = (buyers[buyers.length - 1]?.order ?? 0) + 1;
    await addDoc(collection(db, COLLECTION), {
      title: title.trim(),
      description: description.trim(),
      link: link?.trim() || null,
      imageUrl,
      imageStoragePath: storagePath,
      order,
      createdAt: Date.now(),
    });
    toast.success("First buyer added.");
  }, [buyers]);

  const deleteBuyer = useCallback(async (buyer: FirstBuyer) => {
    await deleteDoc(doc(db, COLLECTION, buyer.id));
    try {
      await deleteObject(ref(storage, buyer.imageStoragePath));
    } catch (err) {
      console.warn("Failed to delete first buyer image", err);
    }
    toast.success("First buyer removed.");
  }, []);

  const moveBuyer = useCallback(
    async (buyerId: string, direction: "up" | "down") => {
      const index = buyers.findIndex((buyer) => buyer.id === buyerId);
      if (index === -1) return;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= buyers.length) return;
      const batch = writeBatch(db);
      const current = buyers[index];
      const target = buyers[targetIndex];
      batch.update(doc(db, COLLECTION, current.id), { order: target.order });
      batch.update(doc(db, COLLECTION, target.id), { order: current.order });
      await batch.commit();
      toast.success(`Moved ${current.title} ${direction === "up" ? "up" : "down"}.`);
    },
    [buyers]
  );

  const value = useMemo<FirstBuyersContextValue>(
    () => ({
      buyers,
      loading,
      error,
      addBuyer,
      deleteBuyer,
      moveBuyer,
    }),
    [buyers, loading, error, addBuyer, deleteBuyer, moveBuyer]
  );

  return <FirstBuyersContext.Provider value={value}>{children}</FirstBuyersContext.Provider>;
};

export const useFirstBuyers = () => {
  const ctx = useContext(FirstBuyersContext);
  if (!ctx) {
    throw new Error("useFirstBuyers must be used within a FirstBuyersProvider");
  }
  return ctx;
};




