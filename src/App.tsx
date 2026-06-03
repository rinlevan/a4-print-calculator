import { useState, useRef } from 'react';
import {
  Printer,
  FolderPlus,
  Trash2,
  Sun,
  Moon,
  AlertTriangle,
  UploadCloud,
  FilePlus,
  FolderOpen,
  RotateCw
} from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { usePrintStore, selectGrandTotal } from './store/usePrintStore';
import { DashboardStats } from './components/DashboardStats';
import { SidebarConfig } from './components/SidebarConfig';
import { FolderCard } from './components/FolderCard';
import { InvoiceModal } from './components/InvoiceModal';
import { readDroppedFolders, readInputFolders, getFileType } from './utils/folderReader';
import { readPdfPageCount } from './utils/pdfParser';
import { readDocxPageCount } from './utils/docxParser';
import { readDocPageCount } from './utils/docParser';
import { formatVND } from './lib/utils';
import type { DirectoryItem, FileItem } from './types';

// Helper to generate safe IDs offline
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export default function App() {
  const { toggleTheme, isDark } = useTheme();
  const { directories, addDirectories, updateFilePages, updateFileStatus, clearAllData, resetAllToDefault } = usePrintStore();

  const grandTotal = usePrintStore(selectGrandTotal);

  const [isDragging, setIsDragging] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearTimer, setClearTimer] = useState<any>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetTimer, setResetTimer] = useState<any>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Triggered when clear is clicked (two-step confirmation)
  const handleClearClick = () => {
    if (confirmClear) {
      clearAllData();
      setConfirmClear(false);
      if (clearTimer) clearTimeout(clearTimer);
    } else {
      setConfirmClear(true);
      const timer = setTimeout(() => {
        setConfirmClear(false);
      }, 3000);
      setClearTimer(timer);
    }
  };

  // Triggered when reset is clicked (two-step confirmation)
  const handleResetClick = () => {
    if (confirmReset) {
      resetAllToDefault();
      setConfirmReset(false);
      if (resetTimer) clearTimeout(resetTimer);
    } else {
      setConfirmReset(true);
      const timer = setTimeout(() => {
        setConfirmReset(false);
      }, 3000);
      setResetTimer(timer);
    }
  };

  // Async file parser task runner
  const parseFilePagesTask = async (dirId: string, fileId: string, file: File) => {
    // Force async execution so store has time to register new directory and files
    await Promise.resolve();

    const fileType = getFileType(file.name);
    try {
      if (fileType === 'pdf') {
        const pages = await readPdfPageCount(file);
        updateFilePages(dirId, fileId, pages, false);
        updateFileStatus(dirId, fileId, 'success');
      } else if (fileType === 'docx') {
        const pages = await readDocxPageCount(file);
        updateFilePages(dirId, fileId, pages, false);
        updateFileStatus(dirId, fileId, 'success');
      } else if (fileType === 'doc') {
        try {
          const pages = await readDocPageCount(file);
          updateFilePages(dirId, fileId, pages, false);
          updateFileStatus(dirId, fileId, 'success');
        } catch (docErr: any) {
          updateFilePages(dirId, fileId, 1, false);
          updateFileStatus(
            dirId,
            fileId,
            'error',
            docErr.message || 'Không thể tự động đọc file .doc cũ. Vui lòng tự nhập số trang.'
          );
        }
      } else {
        // Unrecognized format
        updateFilePages(dirId, fileId, 1, false);
        updateFileStatus(
          dirId,
          fileId,
          'error',
          'Định dạng không hỗ trợ (chỉ nhận PDF, DOCX, DOC).'
        );
      }
    } catch (err: any) {
      updateFilePages(dirId, fileId, 1, false);
      updateFileStatus(
        dirId,
        fileId,
        'error',
        err.message || 'Lỗi khi đọc file'
      );
    }
  };

  // Processes directories of files
  const processUploadedFolders = (folders: { folderName: string; files: File[] }[]) => {
    const tasks: (() => void)[] = [];

    const newDirs: DirectoryItem[] = folders.map((folder) => {
      const dirId = generateId();

      const files: FileItem[] = folder.files.map((file) => {
        const fileId = generateId();

        // Queue the async parser task to run after store updates
        tasks.push(() => parseFilePagesTask(dirId, fileId, file));

        return {
          id: fileId,
          name: file.name,
          size: file.size,
          type: getFileType(file.name),
          pageCount: 0,
          calculatedSheets: 0,
          copies: 1,
          sides: 2,
          status: 'loading'
        };
      });

      return {
        id: dirId,
        name: folder.folderName,
        printOrientation: 'portrait',
        copies: 1,
        files
      };
    });

    addDirectories(newDirs);

    // Execute all queued tasks now that state is updated
    tasks.forEach((task) => task());
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items) {
      const folders = await readDroppedFolders(e.dataTransfer.items);
      if (folders.length > 0) {
        processUploadedFolders(folders);
      }
    }
  };

  // File and Folder Selection triggers
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const folders = readInputFolders(e.target.files);
      processUploadedFolders(folders);
      // Reset input value so same selection triggers event again
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors duration-300">

      {/* Header Bar */}
      <header className="no-print bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-600 rounded-xl text-white shadow-md shadow-violet-500/20">
              <Printer size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-950 dark:text-white leading-none">
                A4 Print Calculator
              </h1>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Ứng dụng tính tiền in local-first
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode switcher */}
            <button
              onClick={toggleTheme}
              title="Chuyển chế độ sáng/tối"
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all cursor-pointer select-none"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Reset all button (two-step) */}
            <button
              onClick={handleResetClick}
              title="Đặt lại toàn bộ ứng dụng (giá tiền, thông tin, dữ liệu) về mặc định"
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all select-none border cursor-pointer ${confirmReset
                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 dark:text-zinc-450 hover:text-red-500 dark:hover:text-red-450'
                }`}
            >
              {confirmReset ? (
                <>
                  <AlertTriangle size={14} />
                  Xác nhận Reset?
                </>
              ) : (
                <>
                  <RotateCw size={14} />
                  Reset thiết lập
                </>
              )}
            </button>

            {/* Clear state button (two-step) */}
            {directories.length > 0 && (
              <button
                onClick={handleClearClick}
                className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all select-none border cursor-pointer ${confirmClear
                  ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-red-500'
                  }`}
              >
                {confirmClear ? (
                  <>
                    <AlertTriangle size={14} />
                    Xác nhận xóa?
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Xóa tất cả
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="no-print flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">

        {/* Workspace panel (Top) */}
        <div className="flex-grow flex flex-col space-y-6">

          {/* Top statistics hero dashboard */}
          <DashboardStats />

          {/* Upload files input controls (Hidden inputs) */}
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderSelect}
            className="hidden"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFolderSelect}
            className="hidden"
            multiple
            accept=".pdf,.docx,.doc"
          />

          {directories.length === 0 ? (
            /* Drag and Drop Central Upload Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-grow border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] transition-all bg-white dark:bg-zinc-900/40 ${isDragging
                ? 'border-violet-500 bg-violet-50/20 dark:bg-violet-950/10 scale-[0.99] shadow-inner shadow-violet-500/5'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-750'
                }`}
            >
              <div className={`p-4 rounded-2xl mb-4 transition-all ${isDragging
                ? 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 scale-110'
                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600'
                }`}>
                <UploadCloud size={40} className={isDragging ? 'animate-bounce' : ''} />
              </div>

              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                Thêm tài liệu để bắt đầu
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-550 max-w-sm mt-1 mb-8 leading-relaxed">
                Kéo thả các thư mục chứa file in hoặc nhấp chọn các nút tải bên dưới để quét tài liệu tự động.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 flex items-center gap-2 transition-all select-none cursor-pointer"
                >
                  <FolderPlus size={16} />
                  Chọn thư mục
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-all select-none cursor-pointer"
                >
                  <FilePlus size={16} />
                  Chọn file lẻ
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                <span>PDF</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></span>
                <span>DOCX</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></span>
                <span>DOC</span>
              </div>
            </div>
          ) : (
            /* Active Directories Board view */
            <div className="space-y-6 flex-grow flex flex-col justify-between">

              {/* Quick Bar to drop or append more files */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all bg-white dark:bg-zinc-900/40 ${isDragging
                  ? 'border-violet-500 bg-violet-50/20 dark:bg-violet-950/10'
                  : 'border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-750'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl">
                    <FolderOpen size={18} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {isDragging ? 'Thả để thêm folder...' : 'Thả thêm thư mục hoặc nhấp nút để thêm file:'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5 transition-all select-none cursor-pointer"
                  >
                    <FolderPlus size={13} />
                    Thêm thư mục
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5 transition-all select-none cursor-pointer"
                  >
                    <FilePlus size={13} />
                    Thêm file lẻ
                  </button>
                </div>
              </div>

              {/* Folders List Layout */}
              <div className="space-y-4 flex-grow">
                {directories.map((dir) => (
                  <FolderCard key={dir.id} directory={dir} />
                ))}
              </div>

              {/* Float invoice triggers */}
              <div className="sticky bottom-4 z-30 pt-4 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-50 dark:via-zinc-950 to-transparent">
                <div className="bg-white dark:bg-zinc-900 border border-violet-100 dark:border-zinc-800 p-4 rounded-2xl shadow-lg shadow-violet-100/10 dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">TỔNG THANH TOÁN TẠM TÍNH</p>
                    <h2 className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                      {formatVND(grandTotal)}
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowInvoice(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/20 cursor-pointer select-none"
                  >
                    <Printer size={16} />
                    Xuất hóa đơn A6
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Divider line between workspace and configuration */}
        <hr className="border-zinc-200 dark:border-zinc-850 my-4" />

        {/* Configuration panel (Bottom, grid 2x2) */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-zinc-850 dark:text-zinc-100 tracking-tight">
            Cấu hình & Thiết lập dịch vụ
          </h2>
          <SidebarConfig />
        </div>

      </main>

      {/* Invoice Modal Overlay */}
      {showInvoice && (
        <InvoiceModal onClose={() => setShowInvoice(false)} />
      )}

    </div>
  );
}
