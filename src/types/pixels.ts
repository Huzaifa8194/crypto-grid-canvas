export interface SelectionRect {
  i0: number;
  j0: number;
  i1: number;
  j1: number;
  width: number;
  height: number;
  blockCount: number;
  pixelCount: number;
}

export interface PixelRegionMetadata {
  title: string;
  description: string;
  link?: string;
}

export interface PixelRegion extends PixelRegionMetadata {
  id: string;
  bounds: SelectionRect;
  imageUrl?: string;
  imageStoragePath?: string;
  imageDataUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BlockCoordinate {
  i: number;
  j: number;
}

