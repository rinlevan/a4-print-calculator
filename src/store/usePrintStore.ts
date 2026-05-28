import { create } from 'zustand';
import type { DirectoryItem, FileItem, PrintSettings, CustomerInfo, BindingSettings } from '../types';

interface PrintState {
  settings: PrintSettings;
  customer: CustomerInfo;
  binding: BindingSettings;
  directories: DirectoryItem[];

  // Actions
  updateSettings: (settings: Partial<PrintSettings>) => void;
  updateTierPrice: (index: number, price: number) => void;
  updateBindingPrices: (prices: Partial<PrintSettings['bindingPrices']>) => void;
  updateCustomer: (customer: Partial<CustomerInfo>) => void;
  updateBinding: (binding: Partial<BindingSettings>) => void;

  // Folder & File Actions
  addDirectories: (newDirs: DirectoryItem[]) => void;
  updateFilePages: (dirId: string, fileId: string, pageCount: number, isEdited?: boolean) => void;
  updateFileStatus: (dirId: string, fileId: string, status: FileItem['status'], errorMsg?: string) => void;
  updateDirectoryOrientation: (dirId: string, orientation: 'portrait' | 'landscape') => void;
  updateDirectoryCopies: (dirId: string, copies: number) => void;
  updateFileCopies: (dirId: string, fileId: string, copies: number) => void;
  updateFileSides: (dirId: string, fileId: string, sides: 1 | 2) => void;
  removeDirectory: (dirId: string) => void;
  removeFile: (dirId: string, fileId: string) => void;
  clearAllData: () => void;
  resetAllToDefault: () => void;
}

const DEFAULT_SETTINGS: PrintSettings = {
  pricePerSheet: 330,
  useTieredPricing: true,
  priceTiers: [
    { min: 1, max: 20, price: 500 },
    { min: 21, max: 50, price: 400 },
    { min: 51, max: 99, price: 350 },
    { min: 100, max: 999999, price: 330 }
  ],
  bindingPrices: {
    thinCover: 2000,
    thickCover: 4000,
    clearCover: 3000
  },
  shopName: 'TIỆM IN MÂY TRẮNG',
  shopPhone: '0764810172',
  shopAddress: 'Tân Phú - Phú Vang - TP Huế'
};

const DEFAULT_CUSTOMER: CustomerInfo = {
  name: 'Khách lẻ',
  notes: ''
};

const DEFAULT_BINDING: BindingSettings = {
  thinCoverCount: 0,
  thickCoverCount: 0,
  clearCoverCount: 0,
  thinCoverAddClear: false,
  thickCoverAddClear: false
};

const loadSettings = (): PrintSettings => {
  try {
    const saved = localStorage.getItem('print_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate schema matches and merge with default values
      if (parsed.pricePerSheet && parsed.bindingPrices) {
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
};

const loadCustomer = (): CustomerInfo => {
  try {
    const saved = localStorage.getItem('print_customer');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading customer from localStorage', e);
  }
  return DEFAULT_CUSTOMER;
};

// Helper to compute sheets
const getSheetsCount = (pages: number, orientation: 'portrait' | 'landscape', sides: 1 | 2 = 2): number => {
  if (pages <= 0) return 0;
  if (sides === 1) {
    return orientation === 'portrait' ? pages : Math.ceil(pages / 2);
  } else {
    return orientation === 'portrait' ? Math.ceil(pages / 2) : Math.ceil(pages / 4);
  }
};

export const usePrintStore = create<PrintState>((set) => ({
  settings: loadSettings(),
  customer: loadCustomer(),
  binding: DEFAULT_BINDING,
  directories: [],

  updateSettings: (newSettings) => set((state) => {
    const updated = { ...state.settings, ...newSettings };
    localStorage.setItem('print_settings', JSON.stringify(updated));
    return { settings: updated };
  }),

  updateTierPrice: (index, price) => set((state) => {
    const updatedTiers = state.settings.priceTiers.map((tier, idx) =>
      idx === index ? { ...tier, price } : tier
    );
    const updated = { ...state.settings, priceTiers: updatedTiers };
    localStorage.setItem('print_settings', JSON.stringify(updated));
    return { settings: updated };
  }),

  updateBindingPrices: (newBindingPrices) => set((state) => {
    const updated = {
      ...state.settings,
      bindingPrices: { ...state.settings.bindingPrices, ...newBindingPrices }
    };
    localStorage.setItem('print_settings', JSON.stringify(updated));
    return { settings: updated };
  }),

  updateCustomer: (newCustomer) => set((state) => {
    const updated = { ...state.customer, ...newCustomer };
    localStorage.setItem('print_customer', JSON.stringify(updated));
    return { customer: updated };
  }),

  updateBinding: (newBinding) => set((state) => ({
    binding: { ...state.binding, ...newBinding }
  })),

  addDirectories: (newDirs) => set((state) => {
    // Prevent duplicate directories by merging or adding
    const updatedDirs = [...state.directories];

    newDirs.forEach((newDir) => {
      const existingIdx = updatedDirs.findIndex(d => d.name === newDir.name);
      if (existingIdx !== -1) {
        // Merge files into existing directory
        const existingDir = updatedDirs[existingIdx];
        newDir.files.forEach((newFile) => {
          if (!existingDir.files.some(f => f.name === newFile.name)) {
            existingDir.files.push({
              ...newFile,
              copies: newFile.copies || 1,
              sides: newFile.sides || 2
            });
          }
        });
      } else {
        updatedDirs.push({
          ...newDir,
          copies: newDir.copies || 1,
          files: newDir.files.map(f => ({
            ...f,
            copies: f.copies || 1,
            sides: f.sides || 2
          }))
        });
      }
    });

    return { directories: updatedDirs };
  }),

  updateFilePages: (dirId, fileId, pageCount, isEdited = true) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      return {
        ...dir,
        files: dir.files.map((file) => {
          if (file.id !== fileId) return file;
          return {
            ...file,
            pageCount,
            isEdited,
            status: file.status === 'loading' ? 'success' : file.status,
            calculatedSheets: getSheetsCount(pageCount, dir.printOrientation, file.sides || 2)
          };
        })
      };
    })
  })),

  updateFileStatus: (dirId, fileId, status, errorMsg) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      return {
        ...dir,
        files: dir.files.map((file) => {
          if (file.id !== fileId) return file;
          return {
            ...file,
            status,
            errorMsg: status === 'error' ? errorMsg : undefined,
            // Reset page count to 0 or 1 on error
            pageCount: status === 'error' ? 0 : file.pageCount,
            calculatedSheets: status === 'error' ? 0 : file.calculatedSheets
          };
        })
      };
    })
  })),

  updateDirectoryOrientation: (dirId, orientation) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      return {
        ...dir,
        printOrientation: orientation,
        files: dir.files.map((file) => ({
          ...file,
          calculatedSheets: file.status === 'error' ? 0 : getSheetsCount(file.pageCount, orientation, file.sides || 2)
        }))
      };
    })
  })),

  updateDirectoryCopies: (dirId, copies) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      return {
        ...dir,
        copies,
        files: dir.files.map((file) => ({
          ...file,
          copies
        }))
      };
    })
  })),

  updateFileCopies: (dirId, fileId, copies) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      const updatedFiles = dir.files.map((file) => {
        if (file.id !== fileId) return file;
        return {
          ...file,
          copies
        };
      });
      // Check if all files in the directory now have the same number of copies
      const firstCopies = updatedFiles[0]?.copies || 1;
      const allSame = updatedFiles.every(f => f.copies === firstCopies);
      return {
        ...dir,
        copies: allSame ? firstCopies : dir.copies,
        files: updatedFiles
      };
    })
  })),

  updateFileSides: (dirId, fileId, sides) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      return {
        ...dir,
        files: dir.files.map((file) => {
          if (file.id !== fileId) return file;
          return {
            ...file,
            sides,
            calculatedSheets: file.status === 'error' ? 0 : getSheetsCount(file.pageCount, dir.printOrientation, sides)
          };
        })
      };
    })
  })),

  removeDirectory: (dirId) => set((state) => ({
    directories: state.directories.filter(d => d.id !== dirId)
  })),

  removeFile: (dirId, fileId) => set((state) => ({
    directories: state.directories.map((dir) => {
      if (dir.id !== dirId) return dir;
      return {
        ...dir,
        files: dir.files.filter(f => f.id !== fileId)
      };
    }).filter(dir => dir.files.length > 0) // Remove directory if it becomes empty
  })),

  clearAllData: () => set({
    directories: [],
    binding: DEFAULT_BINDING
  }),

  resetAllToDefault: () => {
    localStorage.removeItem('print_settings');
    localStorage.removeItem('print_customer');
    set({
      settings: DEFAULT_SETTINGS,
      customer: DEFAULT_CUSTOMER,
      binding: DEFAULT_BINDING,
      directories: []
    });
  }
}));

// State selectors for totals calculations
export const selectTotalFilesCount = (state: PrintState) =>
  state.directories.reduce((acc, dir) => acc + dir.files.length, 0);

export const selectTotalPages = (state: PrintState) =>
  state.directories.reduce((acc, dir) =>
    acc + dir.files.reduce((fAcc, f) => fAcc + (f.status === 'error' ? 0 : f.pageCount * (f.copies || 1)), 0), 0
  );

export const selectTotalSheets = (state: PrintState) =>
  state.directories.reduce((acc, dir) =>
    acc + dir.files.reduce((fAcc, f) => fAcc + (f.status === 'error' ? 0 : f.calculatedSheets * (f.copies || 1)), 0), 0
  );

export const selectActiveUnitPrice = (state: PrintState) => {
  const { useTieredPricing, priceTiers, pricePerSheet } = state.settings;
  if (!useTieredPricing || !priceTiers || priceTiers.length === 0) {
    return pricePerSheet;
  }
  const totalSheets = selectTotalSheets(state);
  const activeTier = priceTiers.find(tier => totalSheets >= tier.min && totalSheets <= tier.max);
  if (activeTier) return activeTier.price;
  return priceTiers[0].price;
};

export const selectPrintCost = (state: PrintState) =>
  selectTotalSheets(state) * selectActiveUnitPrice(state);

export const selectBindingCost = (state: PrintState) => {
  const { thinCoverCount, thickCoverCount, clearCoverCount, thinCoverAddClear, thickCoverAddClear } = state.binding;
  const { thinCover, thickCover, clearCover } = state.settings.bindingPrices;

  let cost = (thinCoverCount * thinCover) + (thickCoverCount * thickCover) + (clearCoverCount * clearCover);
  if (thinCoverAddClear) {
    cost += thinCoverCount * clearCover;
  }
  if (thickCoverAddClear) {
    cost += thickCoverCount * clearCover;
  }
  return cost;
};

export const selectTotalBooksCount = (state: PrintState) => {
  const { thinCoverCount, thickCoverCount, clearCoverCount } = state.binding;
  return thinCoverCount + thickCoverCount + clearCoverCount;
};

export const selectGrandTotal = (state: PrintState) =>
  selectPrintCost(state) + selectBindingCost(state);
