import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  FileCheck2, 
  FileWarning, 
  Loader2, 
  FileCode,
  LayoutTemplate
} from 'lucide-react';
import type { DirectoryItem, FileItem } from '../types';
import { usePrintStore } from '../store/usePrintStore';
import { formatBytes } from '../lib/utils';

interface FolderCardProps {
  directory: DirectoryItem;
}

export function FolderCard({ directory }: FolderCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { 
    updateDirectoryOrientation, 
    updateDirectoryCopies,
    updateFileCopies,
    updateFileSides,
    removeDirectory, 
    updateFilePages, 
    removeFile 
  } = usePrintStore();

  const totalFiles = directory.files.length;
  const totalPages = directory.files.reduce((acc, f) => acc + (f.status === 'error' ? 0 : f.pageCount), 0);
  const totalSheets = directory.files.reduce((acc, f) => acc + f.calculatedSheets, 0);

  // File type helper rendering
  const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
      case 'pdf':
        return <div className="text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded-xl"><FileText size={18} /></div>;
      case 'docx':
        return <div className="text-blue-500 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-xl"><FileText size={18} /></div>;
      case 'doc':
        return <div className="text-sky-500 bg-sky-50 dark:bg-sky-950/30 p-2 rounded-xl"><FileText size={18} /></div>;
      default:
        return <div className="text-zinc-500 bg-zinc-50 dark:bg-zinc-950/30 p-2 rounded-xl"><FileCode size={18} /></div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      layout
      className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800/80">
        
        {/* Title and stats */}
        <div className="flex items-start gap-3 flex-grow cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="text-violet-600 dark:text-violet-400 p-2.5 bg-violet-50 dark:bg-violet-950/40 rounded-xl mt-0.5">
            <FolderOpen size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              {directory.name}
              {isOpen ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
              <span>{totalFiles} file</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span>{totalPages} trang</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span className="text-violet-600 dark:text-violet-400">{totalSheets} tờ A4</span>
            </div>
          </div>
        </div>

        {/* Orientation Selector and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Orientation switch */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
            <button
              onClick={() => updateDirectoryOrientation(directory.id, 'portrait')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
                directory.printOrientation === 'portrait'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350'
              }`}
            >
              <LayoutTemplate size={13} className="rotate-90" />
              In Dọc
            </button>
            <button
              onClick={() => updateDirectoryOrientation(directory.id, 'landscape')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
                directory.printOrientation === 'landscape'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350'
              }`}
            >
              <LayoutTemplate size={13} />
              In Ngang
            </button>
          </div>

          {/* Copies Input */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Bản in:</span>
            <input
              type="number"
              min="1"
              value={directory.copies || 1}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                updateDirectoryCopies(directory.id, val);
              }}
              className="w-10 text-center bg-transparent border-none font-bold text-xs text-zinc-800 dark:text-zinc-200 outline-none p-0 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Delete folder */}
          <button
            onClick={() => removeDirectory(directory.id)}
            title="Xóa thư mục"
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-950/50 transition-all select-none"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* File list accordion content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 md:p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên file</th>
                    <th className="py-3 px-4">Dung lượng</th>
                    <th className="py-3 px-4 w-28 text-center">Số trang</th>
                    <th className="py-3 px-4 w-24 text-center">Bản in</th>
                    <th className="py-3 px-4 w-24 text-center">Mặt</th>
                    <th className="py-3 px-4 w-32 text-center">Số tờ A4</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 w-16 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                  {directory.files.map((file) => (
                    <tr key={file.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-all">
                      {/* Name & Icon */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div className="truncate">
                            <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">
                              {file.type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {formatBytes(file.size)}
                      </td>

                      {/* Page Count Input */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            disabled={file.status === 'loading'}
                            value={file.pageCount || ''}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              updateFilePages(directory.id, file.id, val, true);
                            }}
                            className={`w-20 px-2 py-1.5 text-center font-semibold rounded-lg border text-sm outline-none transition-all ${
                              file.isEdited
                                ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500'
                            }`}
                          />
                          {file.isEdited && (
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                              Đã chỉnh sửa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Copies Count Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          disabled={file.status === 'loading'}
                          value={file.copies || 1}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            updateFileCopies(directory.id, file.id, val);
                          }}
                          className="w-16 px-2 py-1.5 text-center font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 text-sm outline-none transition-all"
                        />
                      </td>

                      {/* Sides (1-sided or 2-sided) Toggle */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200/50 dark:border-zinc-850">
                          <button
                            type="button"
                            disabled={file.status === 'loading'}
                            onClick={() => updateFileSides(directory.id, file.id, 1)}
                            className={`w-6 h-6 rounded-md text-xs font-bold transition-all cursor-pointer select-none disabled:opacity-50 ${
                              file.sides === 1
                                ? 'bg-white dark:bg-zinc-805 text-zinc-900 dark:text-zinc-100 shadow-xs font-black'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350'
                            }`}
                            title="In 1 mặt"
                          >
                            1
                          </button>
                          <button
                            type="button"
                            disabled={file.status === 'loading'}
                            onClick={() => updateFileSides(directory.id, file.id, 2)}
                            className={`w-6 h-6 rounded-md text-xs font-bold transition-all cursor-pointer select-none disabled:opacity-50 ${
                              file.sides === 2 || !file.sides
                                ? 'bg-white dark:bg-zinc-805 text-zinc-900 dark:text-zinc-100 shadow-xs font-black'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350'
                            }`}
                            title="In 2 mặt"
                          >
                            2
                          </button>
                        </div>
                      </td>

                      {/* Calculated Sheets */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            {file.status === 'error' ? 0 : file.calculatedSheets * (file.copies || 1)}
                          </span>
                          {file.status !== 'error' && (file.copies || 1) > 1 && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                              ({file.calculatedSheets} × {file.copies})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-3 px-4">
                        {file.status === 'loading' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-950/20">
                            <Loader2 className="animate-spin" size={13} />
                            Đang đọc...
                          </span>
                        )}

                        {file.status === 'success' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
                            <FileCheck2 size={13} />
                            Đọc thành công
                          </span>
                        )}

                        {file.status === 'error' && (
                          <span 
                            title={file.errorMsg}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 cursor-help"
                          >
                            <FileWarning size={13} />
                            Lỗi: {file.errorMsg || 'Không xác định'}
                          </span>
                        )}
                      </td>

                      {/* Action Delete */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => removeFile(directory.id, file.id)}
                          title="Xóa file"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all select-none"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
