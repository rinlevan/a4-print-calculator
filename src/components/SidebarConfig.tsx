import {
  User,
  Settings,
  BookOpen,
  BadgeDollarSign,
  Store
} from 'lucide-react';
import { usePrintStore, selectTotalSheets } from '../store/usePrintStore';

export function SidebarConfig() {
  const { settings, customer, binding, updateSettings, updateBindingPrices, updateCustomer, updateBinding, updateTierPrice } = usePrintStore();
  const totalSheets = usePrintStore(selectTotalSheets);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Customer Info Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <User className="text-violet-600 dark:text-violet-400" size={20} />
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Thông Tin Khách Hàng</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="customer-name" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Tên khách hàng
            </label>
            <input
              id="customer-name"
              type="text"
              value={customer.name}
              onChange={(e) => updateCustomer({ name: e.target.value })}
              placeholder="Nhập tên khách hàng..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          <div>
            <label htmlFor="customer-notes" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Ghi chú đơn hàng (Tùy chọn)
            </label>
            <textarea
              id="customer-notes"
              value={customer.notes}
              onChange={(e) => updateCustomer({ notes: e.target.value })}
              placeholder="Thêm ghi chú đặc biệt..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Store Info Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <Store className="text-violet-600 dark:text-violet-400" size={20} />
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Cấu Hàng Cửa Hàng</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="shop-name" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Tên cửa hàng
            </label>
            <input
              id="shop-name"
              type="text"
              value={settings.shopName}
              onChange={(e) => updateSettings({ shopName: e.target.value })}
              placeholder="Nhập tên cửa hàng..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          <div>
            <label htmlFor="shop-phone" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Số điện thoại
            </label>
            <input
              id="shop-phone"
              type="text"
              value={settings.shopPhone}
              onChange={(e) => updateSettings({ shopPhone: e.target.value })}
              placeholder="Nhập số điện thoại..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          <div>
            <label htmlFor="shop-address" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Địa chỉ cửa hàng
            </label>
            <input
              id="shop-address"
              type="text"
              value={settings.shopAddress}
              onChange={(e) => updateSettings({ shopAddress: e.target.value })}
              placeholder="Nhập địa chỉ..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>
        </div>
      </div>

      {/* Printing Config Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <Settings className="text-violet-600 dark:text-violet-400" size={20} />
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Cấu Hình Đơn Giá In</h2>
        </div>

        {/* Pricing Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl">
          <button
            type="button"
            onClick={() => updateSettings({ useTieredPricing: false })}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${!settings.useTieredPricing
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
          >
            Đơn giá cố định
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ useTieredPricing: true })}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${settings.useTieredPricing
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
          >
            Bậc theo số lượng
          </button>
        </div>

        {!settings.useTieredPricing ? (
          <div>
            <label htmlFor="price-per-sheet" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Đơn giá / tờ A4 (VND)
            </label>
            <div className="relative">
              <input
                id="price-per-sheet"
                type="number"
                min="0"
                step="10"
                value={settings.pricePerSheet}
                onChange={(e) => updateSettings({ pricePerSheet: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold"
              />
              <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" size={16} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Cấu hình các bậc giá (VND)
            </span>
            {(settings.priceTiers || []).map((tier, idx) => {
              const isTierActive = settings.useTieredPricing && (
                (totalSheets >= tier.min && totalSheets <= tier.max) ||
                (totalSheets === 0 && idx === 0)
              );

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${isTierActive
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/10'
                    : 'bg-zinc-50/30 dark:bg-zinc-950/30 border-zinc-100 dark:border-zinc-850'
                    }`}
                >
                  <span
                    className={`text-xs transition-all flex items-center ${isTierActive
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-zinc-650 dark:text-zinc-400 font-medium'
                      }`}
                  >
                    {tier.max >= 999999 ? `Từ ${tier.min} tờ` : `${tier.min} - ${tier.max} tờ`}
                    {isTierActive && (
                      <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider animate-pulse">
                        Đang chọn
                      </span>
                    )}
                  </span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tier.price}
                      onChange={(e) => updateTierPrice(idx, Math.max(0, parseInt(e.target.value) || 0))}
                      className={`w-full pl-7 pr-2.5 py-1 rounded-lg border bg-white dark:bg-zinc-900 outline-none text-right font-bold text-sm transition-all ${isTierActive
                        ? 'border-emerald-450 dark:border-emerald-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-emerald-850 dark:text-emerald-350'
                        : 'border-zinc-250 dark:border-zinc-800 focus:border-violet-500 text-zinc-800 dark:text-zinc-250'
                        }`}
                    />
                    <span
                      className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold transition-all ${isTierActive
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-zinc-450 dark:text-zinc-550'
                        }`}
                    >
                      đ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Binding Config Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <BookOpen className="text-violet-600 dark:text-violet-400" size={20} />
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Cấu Hình Đóng Bìa</h2>
        </div>

        <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {/* Thin cover */}
          <div className="pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">Bìa trắng mỏng</span>
              <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={binding.thinCoverAddClear || false}
                  onChange={(e) => updateBinding({ thinCoverAddClear: e.target.checked })}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 w-3 h-3"
                />
                + Bìa kiếng
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="thin-cover-count" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Số quyển
                </label>
                <input
                  id="thin-cover-count"
                  type="number"
                  min="0"
                  value={binding.thinCoverCount || ''}
                  onChange={(e) => updateBinding({ thinCoverCount: Math.max(0, parseInt(e.target.value) || 0) })}
                  placeholder="0 quyển"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="thin-cover-price" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Đơn giá (đ)
                </label>
                <input
                  id="thin-cover-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={settings.bindingPrices.thinCover}
                  onChange={(e) => updateBindingPrices({ thinCover: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-550 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Thick cover */}
          <div className="pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">Bìa dày</span>
              <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={binding.thickCoverAddClear || false}
                  onChange={(e) => updateBinding({ thickCoverAddClear: e.target.checked })}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 w-3 h-3"
                />
                + Bìa kiếng
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="thick-cover-count" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Số quyển
                </label>
                <input
                  id="thick-cover-count"
                  type="number"
                  min="0"
                  value={binding.thickCoverCount || ''}
                  onChange={(e) => updateBinding({ thickCoverCount: Math.max(0, parseInt(e.target.value) || 0) })}
                  placeholder="0 quyển"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="thick-cover-price" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Đơn giá (đ)
                </label>
                <input
                  id="thick-cover-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={settings.bindingPrices.thickCover}
                  onChange={(e) => updateBindingPrices({ thickCover: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-550 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Clear cover */}
          <div className="pt-3 space-y-2">
            <span className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">Bìa trong suốt</span>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="clear-cover-count" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Số quyển
                </label>
                <input
                  id="clear-cover-count"
                  type="number"
                  min="0"
                  value={binding.clearCoverCount || ''}
                  onChange={(e) => updateBinding({ clearCoverCount: Math.max(0, parseInt(e.target.value) || 0) })}
                  placeholder="0 quyển"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="clear-cover-price" className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Đơn giá (đ)
                </label>
                <input
                  id="clear-cover-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={settings.bindingPrices.clearCover}
                  onChange={(e) => updateBindingPrices({ clearCover: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 focus:border-violet-500 outline-none text-zinc-800 dark:text-zinc-200 transition-all font-semibold text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
