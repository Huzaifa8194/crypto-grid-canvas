import { type BlockCoordinate, type PixelRegion, type SelectionRect } from "@/types/pixels";

export const PIXELS_PER_BLOCK = 100;
export const BLOCKS_PER_SIDE = 100;

export const buildSelectionRect = (i0: number, j0: number, i1: number, j1: number): SelectionRect => {
  const minI = Math.min(i0, i1);
  const minJ = Math.min(j0, j1);
  const maxI = Math.max(i0, i1);
  const maxJ = Math.max(j0, j1);
  const width = maxI - minI + 1;
  const height = maxJ - minJ + 1;
  const blockCount = Math.max(0, width * height);
  return {
    i0: minI,
    j0: minJ,
    i1: maxI,
    j1: maxJ,
    width,
    height,
    blockCount,
    pixelCount: blockCount * PIXELS_PER_BLOCK,
  };
};

export const rectToBlocks = (rect: SelectionRect): BlockCoordinate[] => {
  const blocks: BlockCoordinate[] = [];
  for (let j = rect.j0; j <= rect.j1; j++) {
    for (let i = rect.i0; i <= rect.i1; i++) {
      blocks.push({ i, j });
    }
  }
  return blocks;
};

export const rectsOverlap = (a: SelectionRect, b: SelectionRect) => {
  return !(a.i1 < b.i0 || a.i0 > b.i1 || a.j1 < b.j0 || a.j0 > b.j1);
};

export const expandRegionsToBlocks = (regions: PixelRegion[]) => {
  return regions.flatMap((region) => rectToBlocks(region.bounds));
};

