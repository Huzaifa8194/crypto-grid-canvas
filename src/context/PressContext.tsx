import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { type CreatePressItemInput, type PressItem } from "@/types/press";
import { toast } from "sonner";

interface PressContextValue {
  items: PressItem[];
  loading: boolean;
  error: string | null;
  addItem: (input: CreatePressItemInput) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<PressItem, "id">>) => Promise<void>;
  deleteItem: (item: PressItem) => Promise<void>;
  moveItem: (itemId: string, direction: "up" | "down") => Promise<void>;
  toggleFeatured: (itemId: string) => Promise<void>;
}

const PressContext = createContext<PressContextValue | undefined>(undefined);
const COLLECTION = "pressItems";

export const PressProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<PressItem[]>([]);
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
            ...(docSnap.data() as Omit<PressItem, "id">),
          }))
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load press items", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addItem = useCallback(async ({ title, outlet, date, excerpt, link, featured, file }: CreatePressItemInput) => {
    let imageUrl: string | undefined;
    let imageStoragePath: string | undefined;

    if (file) {
      imageStoragePath = `press/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, imageStoragePath);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    const order = (items[items.length - 1]?.order ?? 0) + 1;
    await addDoc(collection(db, COLLECTION), {
      title: title.trim(),
      outlet: outlet.trim(),
      date,
      excerpt: excerpt?.trim() || null,
      link: link.trim(),
      imageUrl: imageUrl || null,
      imageStoragePath: imageStoragePath || null,
      featured: featured ?? false,
      order,
      createdAt: Date.now(),
    });
    toast.success("Press item added.");
  }, [items]);

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<PressItem, "id">>) => {
    await updateDoc(doc(db, COLLECTION, id), updates);
    toast.success("Press item updated.");
  }, []);

  const deleteItem = useCallback(async (item: PressItem) => {
    await deleteDoc(doc(db, COLLECTION, item.id));
    if (item.imageStoragePath) {
      try {
        await deleteObject(ref(storage, item.imageStoragePath));
      } catch (err) {
        console.warn("Failed to delete press item image", err);
      }
    }
    toast.success("Press item removed.");
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
      toast.success(`Moved "${current.title}" ${direction}.`);
    },
    [items]
  );

  const toggleFeatured = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    await updateDoc(doc(db, COLLECTION, itemId), { featured: !item.featured });
    toast.success(item.featured ? "Removed from featured." : "Marked as featured.");
  }, [items]);

  const value = useMemo<PressContextValue>(
    () => ({
      items,
      loading,
      error,
      addItem,
      updateItem,
      deleteItem,
      moveItem,
      toggleFeatured,
    }),
    [items, loading, error, addItem, updateItem, deleteItem, moveItem, toggleFeatured]
  );

  return <PressContext.Provider value={value}>{children}</PressContext.Provider>;
};

export const usePress = () => {
  const ctx = useContext(PressContext);
  if (!ctx) {
    throw new Error("usePress must be used within a PressProvider");
  }
  return ctx;
};




