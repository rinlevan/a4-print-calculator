export interface BindingPrices {
  thinCover: number;
  thickCover: number;
  clearCover: number;
}

export interface PriceTier {
  min: number;
  max: number; // Use Infinity or a high number (like 999999) for the last tier
  price: number;
}

export interface PrintSettings {
  pricePerSheet: number;
  useTieredPricing: boolean;
  priceTiers: PriceTier[];
  bindingPrices: BindingPrices;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
}

export interface CustomerInfo {
  name: string;
  notes: string;
}

export interface BindingSettings {
  thinCoverCount: number;
  thickCoverCount: number;
  clearCoverCount: number;
  thinCoverAddClear: boolean;
  thickCoverAddClear: boolean;
}

export type FileType = 'pdf' | 'docx' | 'doc' | 'unknown';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: FileType;
  pageCount: number;
  calculatedSheets: number;
  copies: number;
  sides: 1 | 2;
  status: 'loading' | 'success' | 'error';
  errorMsg?: string;
  isEdited?: boolean;
}

export interface DirectoryItem {
  id: string;
  name: string;
  printOrientation: 'portrait' | 'landscape';
  copies: number;
  files: FileItem[];
}
