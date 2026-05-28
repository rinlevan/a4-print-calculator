import * as pdfjs from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker to use the local bundled worker URL from Vite
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * Reads a PDF file and returns its total page count.
 * Operates entirely client-side.
 */
export async function readPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    if (pdf && typeof pdf.numPages === 'number') {
      return pdf.numPages;
    }
    
    throw new Error('Invalid PDF structure or pages field missing');
  } catch (error) {
    console.error('PDF Page count error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to read PDF pages');
  }
}
