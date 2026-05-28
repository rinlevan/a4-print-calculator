import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  Download,
  X,
  Receipt,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  usePrintStore,
  selectTotalPages,
  selectTotalSheets,
  selectPrintCost,
  selectBindingCost,
  selectGrandTotal,
  selectTotalBooksCount,
  selectActiveUnitPrice
} from '../store/usePrintStore';
import { formatVND } from '../lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

// Helper to strip Vietnamese accents for Courier font compatibility in standard PDFs
function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Helper to truncate long file names for invoice display
// Using JS truncation instead of CSS truncate/overflow:hidden
// because html2canvas incorrectly clips text with overflow:hidden
function truncateFileName(name: string, maxLen = 28): string {
  if (!name || name.length <= maxLen) return name;
  return name.substring(0, maxLen - 3) + '...';
}

function getActivePriceLabel(useTieredPricing: boolean, priceTiers: any[], totalSheets: number): string {
  if (!useTieredPricing || !priceTiers || priceTiers.length === 0) {
    return 'Đơn giá in:';
  }
  const activeTier = priceTiers.find(
    (tier) => totalSheets >= tier.min && totalSheets <= tier.max
  );
  if (activeTier) {
    const tierName = activeTier.max >= 999999 ? `từ ${activeTier.min}` : `${activeTier.min}-${activeTier.max}`;
    return `Đơn giá in (bậc ${tierName} tờ):`;
  }
  const firstTier = priceTiers[0];
  const firstTierName = firstTier.max >= 999999 ? `từ ${firstTier.min}` : `${firstTier.min}-${firstTier.max}`;
  return `Đơn giá in (bậc ${firstTierName} tờ):`;
}

interface InvoiceModalProps {
  onClose: () => void;
}

export function InvoiceModal({ onClose }: InvoiceModalProps) {
  const { customer, binding, settings, directories } = usePrintStore();
  const totalPages = usePrintStore(selectTotalPages);
  const totalSheets = usePrintStore(selectTotalSheets);
  const printCost = usePrintStore(selectPrintCost);
  const bindingCost = usePrintStore(selectBindingCost);
  const grandTotal = usePrintStore(selectGrandTotal);
  const totalBooks = usePrintStore(selectTotalBooksCount);
  const activeUnitPrice = usePrintStore(selectActiveUnitPrice);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingJPG, setIsExportingJPG] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  const timestamp = new Date().toLocaleString('vi-VN');

  // Trigger browser native print
  const handlePrint = () => {
    window.print();
  };

  // Extract and sanitize CSS from the parent document to avoid CORS issues inside the cloned iframe
  const getSanitizedStylesheets = (): string => {
    const styleRules: string[] = [];
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i] as CSSStyleSheet;
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            for (let j = 0; j < rules.length; j++) {
              styleRules.push(rules[j].cssText);
            }
          }
        } catch (sheetErr) {
          // Ignore stylesheet rules if they are not accessible (e.g. cross-origin font CDNs)
          console.warn('Could not read cssRules from document stylesheet:', sheetErr);
        }
      }
    } catch (err) {
      console.error('Error reading stylesheets:', err);
    }
    const fullCss = styleRules.join('\n');
    // Replace all oklch color references with standard fallback color hex (#000000)
    return fullCss.replace(/oklch\([^)]+\)/g, '#000000');
  };

  // Shared helper: render the invoice preview element to a high-quality canvas
  const renderInvoiceCanvas = async (): Promise<HTMLCanvasElement> => {
    const element = document.getElementById('thermal-invoice-content');
    if (!element) {
      throw new Error('Invoice container element not found.');
    }

    // Safe default import resolution for CommonJS / ESM bundle differences in Vite/Rolldown
    const html2canvasFn = (html2canvas as unknown as { default?: typeof html2canvas }).default || html2canvas;

    const canvas = await html2canvasFn(element, {
      scale: 3, // High-DPI scaling for clear text rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc: Document) => {
        // Ensure parent container limits in the cloned DOM don't clip content
        const clonedElement = clonedDoc.getElementById('thermal-invoice-content');
        if (clonedElement) {
          let parent = clonedElement.parentElement;
          while (parent && parent !== clonedDoc.documentElement) {
            parent.style.overflow = 'visible';
            parent.style.height = 'auto';
            parent.style.maxHeight = 'none';
            parent = parent.parentElement;
          }
        }

        // Inline and sanitize stylesheets to prevent CORS and oklch parsing crashes in html2canvas
        try {
          const sanitizedCss = getSanitizedStylesheets();

          // Remove all existing link tags to prevent html2canvas from making network requests
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(link => link.remove());

          // Remove all existing style tags in clone to avoid duplication
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(style => style.remove());

          // Append single sanitized style block
          const styleTag = clonedDoc.createElement('style');
          styleTag.textContent = sanitizedCss;
          clonedDoc.head.appendChild(styleTag);
        } catch (err) {
          console.error('Error inlining sanitized CSS in onclone:', err);
        }
      }
    });

    return canvas;
  };

  // Generate PDF from the preview DOM (matches preview exactly)
  const handleExportPDF = async () => {
    setIsExportingPDF(true);

    try {
      const canvas = await renderInvoiceCanvas();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Calculate PDF page dimensions from canvas aspect ratio
      // Width fixed at 100mm (~10cm), height scales proportionally
      const pdfWidthMm = 100;
      const aspectRatio = canvas.height / canvas.width;
      const pdfHeightMm = Math.max(150, pdfWidthMm * aspectRatio); // min 150mm (~15cm)

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidthMm, pdfHeightMm]
      });

      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, pdfWidthMm * aspectRatio);

      const fileName = `hoadon_${customer.name ? removeAccents(customer.name.toLowerCase()).replace(/\s+/g, '_') : 'a4_print'}.pdf`;
      doc.save(fileName);

      // Show success toast
      setToastMessage('Đã xuất hóa đơn PDF thành công!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`Lỗi xuất PDF: ${message}`);
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Generate high-quality JPG using html2canvas
  const handleExportJPG = async () => {
    setIsExportingJPG(true);

    try {
      const canvas = await renderInvoiceCanvas();

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            reject(new Error('Canvas conversion to Blob failed.'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const fileName = `hoadon_${customer.name ? removeAccents(customer.name.toLowerCase()).replace(/\s+/g, '_') : 'a4_print'}.jpg`;

          link.download = fileName;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Revoke the object URL after a short delay
          setTimeout(() => URL.revokeObjectURL(url), 100);

          // Show success toast
          setToastMessage('Đã xuất hóa đơn JPG thành công!');
          setTimeout(() => setToastMessage(''), 3000);
          resolve();
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Failed to export JPG:', error);
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`Lỗi xuất JPG: ${message}`);
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setIsExportingJPG(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-sm no-print">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-0 z-55 bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
            >
              <CheckCircle size={18} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <Receipt className="text-violet-600 dark:text-violet-400" size={20} />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Hóa Đơn A6</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all select-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Content - Scrollable Invoice Container */}
          <div className="p-6 overflow-y-auto flex-grow flex justify-center bg-zinc-50 dark:bg-zinc-950">

            {/* Thermal Receipt Style Preview */}
            <div
              ref={invoiceRef}
              id="thermal-invoice-content"
              className="w-[378px] min-h-[567px] p-6 bg-white text-zinc-900 shadow-md border border-zinc-200 rounded-lg flex flex-col font-mono text-[11px] leading-normal select-text"
            >
              {/* Store Header */}
              <div className="text-center space-y-1 mb-4">
                <h3 className="text-sm font-bold tracking-wider uppercase border-b-2 border-zinc-900 pb-1">
                  {settings.shopName || 'CUA HANG IN AN'}
                </h3>
                <p className="text-[10px] text-zinc-500">Đ/C: {settings.shopAddress || 'Chạy Local trên Máy Người Dùng'}</p>
                {settings.shopPhone && <p className="text-[10px] text-zinc-500">SĐT: {settings.shopPhone || ''}</p>}
                <p className="text-[10px] text-zinc-500">HÓA ĐƠN DỊCH VỤ IN ẤN</p>
              </div>

              {/* Dotted divider */}
              <div className="border-t border-dashed border-zinc-400 my-2"></div>

              {/* Customer & Time Info */}
              <div className="space-y-1 my-2">
                <p><span className="font-bold">Khách hàng:</span> {customer.name || 'Khách vãng lai'}</p>
                <p><span className="font-bold">Ngày giờ:</span> {timestamp}</p>
                {customer.notes && (
                  <p className="italic text-zinc-600 mt-1">
                    <span className="font-bold not-italic text-zinc-900">Ghi chú:</span> {customer.notes}
                  </p>
                )}
              </div>

              {/* Dotted divider */}
              <div className="border-t border-dashed border-zinc-400 my-2"></div>

              {/* Files & Folder Listing */}
              <div className="flex-grow">
                <div className="flex font-bold mb-1 border-b border-zinc-900 pb-1 text-center">
                  <div className="w-[41.67%] text-left">Tên Folder/File</div>
                  <div className="w-[16.67%] text-right">Trang</div>
                  <div className="w-[8.33%] text-right">Bản</div>
                  <div className="w-[16.67%] text-right">H.Thức</div>
                  <div className="w-[16.67%] text-right">Số tờ</div>
                </div>

                {directories.map((dir) => (
                  <div key={dir.id} className="mb-2">
                    <p className="font-bold text-zinc-900 uppercase underline mt-1">
                      Folder: {dir.name}
                    </p>

                    {dir.files.map((file) => (
                      <div key={file.id} className="flex text-zinc-700 py-[3px] items-center text-center">
                        <div className="w-[41.67%] text-left whitespace-nowrap pr-1" title={file.name}>
                          - {truncateFileName(file.name)}
                        </div>
                        <div className="w-[16.67%] text-right">
                          {file.status === 'error' ? 0 : file.pageCount}
                        </div>
                        <div className="w-[8.33%] text-right">
                          {file.status === 'error' ? 0 : (file.copies || 1)}
                        </div>
                        <div className="w-[16.67%] text-right text-[9px]">
                          {dir.printOrientation === 'portrait' ? 'Dọc' : 'Ngang'}-{file?.sides === 1 ? '1m' : '2m'}
                        </div>
                        <div className="w-[16.67%] text-right font-semibold text-zinc-900">
                          {file.status === 'error' ? 0 : file.calculatedSheets * (file.copies || 1)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Dotted divider */}
              <div className="border-t border-dashed border-zinc-400 my-3"></div>

              {/* Summary statistics */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Tổng số trang in:</span>
                  <span>{totalPages} trang</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng số tờ A4:</span>
                  <span className="font-bold">{totalSheets} tờ</span>
                </div>
                <div className="flex justify-between">
                   <span>{getActivePriceLabel(settings.useTieredPricing, settings.priceTiers, totalSheets)}</span>
                   <span>{formatVND(activeUnitPrice)}</span>
                 </div>

                <div className="flex justify-between">
                  <span>Tổng tiền in:</span>
                  <span>{formatVND(printCost)}</span>
                </div>

                {totalBooks > 0 && (
                  <>
                    <div className="border-t border-zinc-200 my-1"></div>
                    <div className="text-zinc-550 font-semibold text-[10px] uppercase tracking-wider mt-1">Chi tiết đóng bìa:</div>
                    {binding.thinCoverCount > 0 && (
                      <div className="flex justify-between pl-2 text-zinc-700">
                        <span>- Bìa trắng mỏng:</span>
                        <span>{binding.thinCoverCount} quyển × {formatVND(settings.bindingPrices.thinCover)}</span>
                      </div>
                    )}
                    {binding.thickCoverCount > 0 && (
                      <div className="flex justify-between pl-2 text-zinc-700">
                        <span>- Bìa dày:</span>
                        <span>{binding.thickCoverCount} quyển × {formatVND(settings.bindingPrices.thickCover)}</span>
                      </div>
                    )}
                    {binding.clearCoverCount > 0 && (
                      <div className="flex justify-between pl-2 text-zinc-700">
                        <span>- Bìa trong suốt:</span>
                        <span>{binding.clearCoverCount} quyển × {formatVND(settings.bindingPrices.clearCover)}</span>
                      </div>
                    )}
                    {binding.thinCoverAddClear && binding.thinCoverCount > 0 && (
                      <div className="flex justify-between pl-2 text-zinc-700 font-medium">
                        <span>- Bọc thêm bìa kiếng (bìa mỏng):</span>
                        <span>{binding.thinCoverCount} bộ × {formatVND(settings.bindingPrices.clearCover)}</span>
                      </div>
                    )}
                    {binding.thickCoverAddClear && binding.thickCoverCount > 0 && (
                      <div className="flex justify-between pl-2 text-zinc-700 font-medium">
                        <span>- Bọc thêm bìa kiếng (bìa dày):</span>
                        <span>{binding.thickCoverCount} bộ × {formatVND(settings.bindingPrices.clearCover)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold mt-1">
                      <span>Tổng tiền đóng bìa ({totalBooks} cuốn):</span>
                      <span>{formatVND(bindingCost)}</span>
                    </div>
                  </>
                )}

                {/* Dotted divider */}
                <div className="border-t border-dashed border-zinc-400 my-2"></div>

                {/* Final Payable */}
                <div className="flex justify-between text-xs font-bold pt-1 text-zinc-900 uppercase">
                  <span>Tổng thanh toán:</span>
                  <span className="text-sm underline decoration-double">{formatVND(grandTotal)}</span>
                </div>
              </div>

              {/* Store Footer Message */}
              <div className="text-center mt-6 pt-4 border-t border-zinc-900 border-double space-y-1">
                <p className="font-bold text-[10px]">CẢM ƠN QUÝ KHÁCH!</p>
                <p className="text-[9px] text-zinc-500">Vui lòng kiểm tra lại tài liệu trước khi rời quầy.</p>
              </div>
            </div>

          </div>

          {/* Modal Actions Footer */}
          <div className="flex justify-between gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none"
              >
                <Printer size={15} />
                In hóa đơn
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF || isExportingJPG}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Xuất PDF
                  </>
                )}
              </button>

              <button
                onClick={handleExportJPG}
                disabled={isExportingPDF || isExportingJPG}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
              >
                {isExportingJPG ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Xuất JPG
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all select-none cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>

      {/* Render print Portal as sibling */}
      <PrintAreaPortal />
    </>
  );
}

// Render duplicate print-only element directly on body using Portal to bypass print styling parent conflicts
function PrintAreaPortal() {
  const { customer, binding, settings, directories } = usePrintStore();
  const totalPages = usePrintStore(selectTotalPages);
  const totalSheets = usePrintStore(selectTotalSheets);
  const printCost = usePrintStore(selectPrintCost);
  const bindingCost = usePrintStore(selectBindingCost);
  const grandTotal = usePrintStore(selectGrandTotal);
  const totalBooks = usePrintStore(selectTotalBooksCount);
  const activeUnitPrice = usePrintStore(selectActiveUnitPrice);
  const timestamp = new Date().toLocaleString('vi-VN');

  return createPortal(
    <div className="print-area">
      <div className="w-full flex flex-col font-mono text-[10px] leading-tight text-black bg-white">
        {/* Store Header */}
        <div className="text-center mb-2">
          <h3 className="text-[12px] font-bold uppercase border-b-2 border-black pb-1">
            {settings.shopName || 'CUA HANG IN AN'}
          </h3>
          <p className="text-[9px]">Đ/C: {settings.shopAddress || 'HUE, VIET NAM'}</p>
          {settings.shopPhone && <p className="text-[9px]">SĐT: {settings.shopPhone || '0000000000'}</p>}
          <p className="text-[9px]">HÓA ĐƠN DỊCH VỤ IN ẤN</p>
        </div>

        <div className="border-t border-dashed border-black my-1"></div>

        {/* Info */}
        <div className="space-y-0.5 my-1 text-[9px]">
          <p><span className="font-bold">Khách hàng:</span> {customer.name || 'Khách vãng lai'}</p>
          <p><span className="font-bold">Thời gian:</span> {timestamp}</p>
          {customer.notes && <p><span className="font-bold">Ghi chú:</span> {customer.notes}</p>}
        </div>

        <div className="border-t border-dashed border-black my-1"></div>

        {/* Files */}
        <div className="my-1">
          <div className="flex font-bold mb-1 border-b border-black text-[9px] pb-0.5 text-center">
            <div className="w-[41.67%] text-left">Tên Folder/File</div>
            <div className="w-[16.67%] text-right">Trang</div>
            <div className="w-[8.33%] text-right">Bản</div>
            <div className="w-[16.67%] text-right">H.Thức</div>
            <div className="w-[16.67%] text-right">Tờ</div>
          </div>

          {directories.map((dir) => (
            <div key={dir.id} className="mb-1 text-[9px]">
              <p className="font-bold uppercase underline">Folder: {dir.name}</p>
              {dir.files.map((file) => (
                <div key={file.id} className="flex py-[2px] items-center text-center">
                  <div className="w-[41.67%] text-left whitespace-nowrap pr-1" title={file.name}>- {truncateFileName(file.name)}</div>
                  <div className="w-[16.67%] text-right">{file.status === 'error' ? 0 : file.pageCount}</div>
                  <div className="w-[8.33%] text-right">{file.status === 'error' ? 0 : (file.copies || 1)}</div>
                  <div className="w-[16.67%] text-right">{dir.printOrientation === 'portrait' ? 'Dọc' : 'Ngang'}-{file?.sides === 1 ? '1m' : '2m'}</div>
                  <div className="w-[16.67%] text-right font-semibold">{file.status === 'error' ? 0 : file.calculatedSheets * (file.copies || 1)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Sums */}
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between">
            <span>Tổng số trang:</span>
            <span>{totalPages} trang</span>
          </div>
          <div className="flex justify-between">
            <span>Tổng số tờ A4:</span>
            <span className="font-bold">{totalSheets} tờ</span>
          </div>
          <div className="flex justify-between">
             <span>{getActivePriceLabel(settings.useTieredPricing, settings.priceTiers, totalSheets)}</span>
             <span>{formatVND(activeUnitPrice)}</span>
           </div>
          <div className="flex justify-between">
            <span>Tiền in:</span>
            <span>{formatVND(printCost)}</span>
          </div>
          {totalBooks > 0 && (
            <>
              <div className="border-t border-black border-dotted my-0.5"></div>
              <div className="font-bold text-[9px] uppercase">Chi tiết đóng bìa:</div>
              {binding.thinCoverCount > 0 && (
                <div className="flex justify-between pl-1">
                  <span>- Bìa trắng mỏng:</span>
                  <span>{binding.thinCoverCount} quyển × {formatVND(settings.bindingPrices.thinCover)}</span>
                </div>
              )}
              {binding.thickCoverCount > 0 && (
                <div className="flex justify-between pl-1">
                  <span>- Bìa dày:</span>
                  <span>{binding.thickCoverCount} quyển × {formatVND(settings.bindingPrices.thickCover)}</span>
                </div>
              )}
              {binding.clearCoverCount > 0 && (
                <div className="flex justify-between pl-1">
                  <span>- Bìa trong suốt:</span>
                  <span>{binding.clearCoverCount} quyển × {formatVND(settings.bindingPrices.clearCover)}</span>
                </div>
              )}
              {binding.thinCoverAddClear && binding.thinCoverCount > 0 && (
                <div className="flex justify-between pl-1">
                  <span>- Bọc kiếng (bìa mỏng):</span>
                  <span>{binding.thinCoverCount} tờ × {formatVND(settings.bindingPrices.clearCover)}</span>
                </div>
              )}
              {binding.thickCoverAddClear && binding.thickCoverCount > 0 && (
                <div className="flex justify-between pl-1">
                  <span>- Bọc kiếng (bìa dày):</span>
                  <span>{binding.thickCoverCount} tờ × {formatVND(settings.bindingPrices.clearCover)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Tiền đóng bìa ({totalBooks} cuốn):</span>
                <span>{formatVND(bindingCost)}</span>
              </div>
            </>
          )}
          <div className="border-t border-black my-1"></div>
          <div className="flex justify-between text-xs font-bold pt-1 text-black uppercase">
            <span>Tổng thanh toán:</span>
            <span>{formatVND(grandTotal)}</span>
          </div>
        </div>

        <div className="text-center mt-4 pt-2 border-t border-black border-double text-[8px]">
          <p className="font-bold">CẢM ƠN QUÝ KHÁCH!</p>
          <p>Vui lòng kiểm tra lại tài liệu trước khi rời quầy.</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
