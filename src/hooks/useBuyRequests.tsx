import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type BuyRequest } from "@/types/buy";

export const useBuyRequests = () => {
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "buyRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRequests(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<BuyRequest, "id">),
          }))
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load buy requests", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { requests, loading, error };
};

