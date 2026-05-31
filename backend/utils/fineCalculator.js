const DEFAULT_FINE_PER_DAY = 5000;

function calculateFine(dueDate, returnDate) {
  const today = new Date();
  const effectiveReturnDate = returnDate ? new Date(returnDate) : today;
  const due = new Date(dueDate);

  if (Number.isNaN(due.getTime()) || Number.isNaN(effectiveReturnDate.getTime())) {
    return 0;
  }

  if (effectiveReturnDate > due) {
    const diffTime = effectiveReturnDate - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * DEFAULT_FINE_PER_DAY;
  }
  return 0;
}

module.exports = calculateFine;