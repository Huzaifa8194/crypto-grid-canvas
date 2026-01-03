export interface FirstBuyer {
  id: string;
  title: string;
  description: string;
  link?: string;
  imageUrl: string;
  imageStoragePath: string;
  order: number;
  createdAt: number;
}

export interface CreateFirstBuyerInput {
  title: string;
  description: string;
  link?: string;
  file: File;
}











