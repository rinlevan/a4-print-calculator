/**
 * Safely joins class names together.
 */
export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats a number into Vietnamese Dong (e.g. 1.250.000 VND).
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null) return '0 VND';
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return `${formatted} VND`;
}

/**
 * Formats bytes into human-readable size.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
