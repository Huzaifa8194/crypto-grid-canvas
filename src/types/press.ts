export interface PressItem {
  id: string;
  title: string;
  outlet: string;
  date: number;
  excerpt?: string;
  link: string;
  imageUrl?: string;
  imageStoragePath?: string;
  featured: boolean;
  order: number;
  createdAt: number;
}

export interface CreatePressItemInput {
  title: string;
  outlet: string;
  date: number;
  excerpt?: string;
  link: string;
  featured?: boolean;
  file?: File;
}




