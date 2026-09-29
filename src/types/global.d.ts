export {};

export interface XLSXWorkSheet {
  [key: string]: unknown;
}

export interface XLSXWorkBook {
  SheetNames: string[];
  Sheets: Record<string, XLSXWorkSheet>;
}

export interface XLSXStatic {
  utils: {
    book_new: () => XLSXWorkBook;
    aoa_to_sheet: (data: (string | number | boolean | null | undefined)[][]) => XLSXWorkSheet;
    book_append_sheet: (wb: XLSXWorkBook, ws: XLSXWorkSheet, name: string) => void;
  };
  writeFile: (wb: XLSXWorkBook, filename: string) => void;
}

declare global {
  interface Window {
    XLSX?: XLSXStatic;
  }
}
