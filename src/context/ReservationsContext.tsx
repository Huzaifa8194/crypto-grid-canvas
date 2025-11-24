import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type BuyRequest } from "@/types/buy";
import { type BlockCoordinate, type SelectionRect } from "@/types/pixels";
import { rectToBlocks } from "@/lib/pixelMath";

interface ReservationsContextValue {
  requests: BuyRequest[];
  loading: boolean;
  error: string | null;
  reservedRects: SelectionRect[];
  reservedBlocks: BlockCoordinate[];
  addPendingReservation: (rect: SelectionRect) => void;
}

const defaultValue: ReservationsContextValue = {
  requests: [],
  loading: false,
  error: null,
  reservedRects: [],
  reservedBlocks: [],
  addPendingReservation: () => undefined,
};

const ReservationsContext = createContext<ReservationsContextValue | undefined>(undefined);

const rectKey = (rect: SelectionRect) => `${rect.i0}:${rect.j0}:${rect.i1}:${rect.j1}`;

export const ReservationsProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRects, setPendingRects] = useState<SelectionRect[]>([]);

  useEffect(() => {
    const q = query(collection(db, "buyRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<BuyRequest, "id">),
        }));
        const snapshotRectKeys = new Set(
          nextRequests
            .map((request) => request.selectionRect)
            .filter((rect): rect is SelectionRect => Boolean(rect))
            .map(rectKey)
        );
        setRequests(nextRequests);
        setPendingRects((prev) => prev.filter((rect) => !snapshotRectKeys.has(rectKey(rect))));
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

  const requestRects = useMemo(
    () => requests.map((request) => request.selectionRect).filter((rect): rect is SelectionRect => Boolean(rect)),
    [requests]
  );

  const reservedRects = useMemo(
    () => [...requestRects, ...pendingRects],
    [requestRects, pendingRects]
  );

  const reservedBlocks = useMemo(() => reservedRects.flatMap(rectToBlocks), [reservedRects]);

  const addPendingReservation = useCallback((rect: SelectionRect) => {
    setPendingRects((prev) => {
      const key = rectKey(rect);
      if (prev.some((existing) => rectKey(existing) === key)) {
        return prev;
      }
      return [...prev, rect];
    });
  }, []);

  const value: ReservationsContextValue = {
    requests,
    loading,
    error,
    reservedRects,
    reservedBlocks,
    addPendingReservation,
  };

  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
};

export const useReservations = () => {
  const ctx = useContext(ReservationsContext);
  if (!ctx) {
    console.warn("useReservations called outside of ReservationsProvider. Falling back to default value.");
    return defaultValue;
  }
  return ctx;
};

