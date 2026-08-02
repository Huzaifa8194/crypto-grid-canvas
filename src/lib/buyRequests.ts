import { collection, addDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { type SelectionRect } from "@/types/pixels";
import { type BuyRequestPayload } from "@/types/buy";

export interface SubmitBuyRequestInput {
  companyName: string;
  email: string;
  tagline?: string;
  xHandle?: string;
  telegram?: string;
  logoUrl?: string;
  targetUrl?: string;
  promoCode?: string | null;
  selectionRect?: SelectionRect | null;
  selectedPixels: number;
  selectedBlocks: number;
  file?: File | null;
}

export const submitBuyRequest = async ({
  companyName,
  email,
  tagline,
  xHandle,
  telegram,
  logoUrl,
  targetUrl,
  promoCode,
  selectionRect,
  selectedPixels,
  selectedBlocks,
  file,
}: SubmitBuyRequestInput) => {
  let logoFileUrl: string | undefined;
  let logoStoragePath: string | undefined;

  if (file) {
    const storagePath = `buy-requests/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    logoFileUrl = await getDownloadURL(storageRef);
    logoStoragePath = storagePath;
  }

  const payload: BuyRequestPayload = {
    companyName,
    email,
    tagline: tagline ?? null,
    xHandle: xHandle ?? null,
    telegram: telegram ?? null,
    logoUrl: logoUrl ?? logoFileUrl ?? null,
    targetUrl: targetUrl ?? null,
    promoCode: promoCode ?? null,
    selectionRect: selectionRect ?? null,
    selectedPixels,
    selectedBlocks,
    logoFileUrl: logoFileUrl ?? null,
    logoStoragePath: logoStoragePath ?? null,
    createdAt: Date.now(),
    paid: false,
  };

  // Remove null optional fields for cleaner documents
  const sanitized = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null)
  ) as BuyRequestPayload;

  const docRef = await addDoc(collection(db, "buyRequests"), sanitized);
  return { id: docRef.id, logoFileUrl };
};

