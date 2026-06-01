export const DEFAULT_DEPOSIT_PER_BOOK = Number(import.meta.env.VITE_DEPOSIT_PER_BOOK || 50000);
export const DEFAULT_SHIPPING_FEE = Number(import.meta.env.VITE_SHIPPING_FEE || 15000);

export const estimateDeposit = (books = []) => {
  return books.reduce((total, book) => {
    const price = book?.price === null || book?.price === undefined ? null : Number(book.price);
    const fallback = Number.isFinite(price) && price > 0 ? price : DEFAULT_DEPOSIT_PER_BOOK;
    return total + fallback;
  }, 0);
};