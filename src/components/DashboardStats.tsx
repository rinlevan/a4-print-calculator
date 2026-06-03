import { motion } from 'framer-motion';
import {
  Coins,
  FileText,
  Layers,
  BookOpen,
  Info
} from 'lucide-react';
import { usePrintStore, selectTotalPages, selectTotalSheets, selectPrintCost, selectBindingCost, selectGrandTotal, selectTotalBooksCount } from '../store/usePrintStore';
import { formatVND } from '../lib/utils';

export function DashboardStats() {
  const totalPages = usePrintStore(selectTotalPages);
  const totalSheets = usePrintStore(selectTotalSheets);
  const printCost = usePrintStore(selectPrintCost);
  const bindingCost = usePrintStore(selectBindingCost);
  const grandTotal = usePrintStore(selectGrandTotal);
  const totalBooks = usePrintStore(selectTotalBooksCount);
  const directories = usePrintStore((state) => state.directories);

  const totalFiles = directories.reduce((acc, dir) => acc + dir.files.length, 0);

  return (
    <div className="space-y-6 w-full">
      {/* Hero Grand Total Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-violet-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-8 text-center shadow-xl shadow-violet-100/20 dark:shadow-none"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-violet-400/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-indigo-400/10 blur-3xl"></div>

        <span className="text-sm font-semibold tracking-wider text-violet-600 dark:text-violet-400 uppercase">
          Thành Tiền Cuối Cùng
        </span>

        <motion.h1
          key={grandTotal}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mt-2 text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent drop-shadow-sm"
        >
          {formatVND(grandTotal)}
        </motion.h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
          <Info size={14} /> Tổng chi phí bao gồm tiền in giấy và đóng bìa
        </p>
      </motion.div>

      {/* Grid of secondary statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sheets */}
        <motion.div
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tổng Số Tờ (A4)</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">{totalSheets} tờ</h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{totalFiles} file in / {totalPages} trang</span>
          </div>
        </motion.div>

        {/* Print Cost */}
        <motion.div
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tiền In Giấy</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">{formatVND(printCost)}</h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Dựa trên đơn giá in</span>
          </div>
        </motion.div>

        {/* Binding Cost */}
        <motion.div
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tiền Đóng Bìa</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">{formatVND(bindingCost)}</h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Dựa trên bìa & số sách</span>
          </div>
        </motion.div>

        {/* Total Book Quantity */}
        <motion.div
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Số Sách Đóng</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              {totalBooks} quyển
            </h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Số lượng bìa cần đóng</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
