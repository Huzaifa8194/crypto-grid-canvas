import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type BuyRequest } from "@/types/buy";

export const useBuyRequest = (requestId: string | null) => {
  const [request, setRequest] = useState<BuyRequest | null>(null);
  const [loading, setLoading] = useState(Boolean(requestId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setRequest(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, "buyRequests", requestId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setRequest(null);
          setError("Order not found");
        } else {
          setRequest({
            id: snapshot.id,
            ...(snapshot.data() as Omit<BuyRequest, "id">),
          });
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load buy request", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  return { request, loading, error };
};
