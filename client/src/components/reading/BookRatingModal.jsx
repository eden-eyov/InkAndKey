function BookRatingModal({
  isOpen,
  bookTitle,
  loading = false,
  error = '',
  onRate,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-md p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
          Book completed
        </p>

        <h2 className="font-serif text-3xl text-ink mb-2">
          Rate your read
        </h2>

        <p className="text-sm text-stone-500 mb-5">
          You finished{' '}
          <span className="font-semibold text-ink">
            {bookTitle || 'this book'}
          </span>
          . How would you rate it?
        </p>

        {error && (
          <p className="text-sm text-red-500 mb-4">
            {error}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((ratingValue) => (
            <button
              key={ratingValue}
              type="button"
              onClick={() => onRate(ratingValue)}
              disabled={loading}
              className={`text-4xl leading-none transition ${
                loading
                  ? 'text-stone-300 cursor-not-allowed'
                  : 'text-stone-300 hover:text-accent cursor-pointer'
              }`}
              aria-label={`Rate ${ratingValue} out of 5`}
              title={`Rate ${ratingValue}/5`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full border border-stone-200 text-sm font-semibold text-stone-500 hover:border-accent hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Later
          </button>
        </div>

        {loading && (
          <p className="text-xs text-stone-400 mt-3 text-center">
            Saving rating...
          </p>
        )}
      </div>
    </div>
  );
}

export default BookRatingModal;