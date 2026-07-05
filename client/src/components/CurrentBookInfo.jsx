function CurrentBookInfo({
  currentBook,
  userReadingProgress,
  userCanRateCurrentBook,
  userRatedCurrentBook,
  onOpenRatingModal,
  renderDescriptionPreview,
}) {
  const currentBookTitle = currentBook?.title || 'No active book yet';
  const currentBookAuthor = currentBook?.author || '';
  const currentBookHasRatings = Number(currentBook?.ratingsCount) > 0;

  return (
    <div className="bg-cream rounded-2xl p-5 border border-stone-100 mb-6">
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
        Currently reading
      </span>

      <h2 className="font-serif text-2xl mb-1">
        {currentBookTitle}
      </h2>

      {currentBookAuthor && (
        <p className="text-sm text-stone-500">
          by {currentBookAuthor}
        </p>
      )}

      {renderDescriptionPreview(
        currentBook?.description,
        'current-book-description',
        { className: 'mt-3 max-w-3xl' }
      )}

      {currentBook && (
        <div className="flex flex-wrap gap-2 mt-4">
          {currentBookHasRatings ? (
            <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-accent">
              Avg {currentBook.averageRating}/5 · {currentBook.ratingsCount}{' '}
              {currentBook.ratingsCount === 1 ? 'rating' : 'ratings'}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              No ratings yet
            </span>
          )}

          {userRatedCurrentBook && (
            <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-accent">
              Your rating: {userReadingProgress.rating}/5
            </span>
          )}
        </div>
      )}

      {userCanRateCurrentBook && (
        <button
          type="button"
          onClick={onOpenRatingModal}
          className="mt-4 inline-flex px-4 py-2 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-ink transition"
        >
          Rate this book
        </button>
      )}
    </div>
  );
}

export default CurrentBookInfo;