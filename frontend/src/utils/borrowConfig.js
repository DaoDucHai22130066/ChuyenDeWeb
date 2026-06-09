export const DEFAULT_SHIPPING_FEE = Number(import.meta.env.VITE_SHIPPING_FEE || 15000);

export const estimateDeposit = (books = []) => {
  return books.reduce((total, book) => {
    const price = Number(book?.price);
    return total + (Number.isFinite(price) && price > 0 ? price : 0);
  }, 0);
};
