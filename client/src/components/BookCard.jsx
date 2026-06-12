import { Link } from 'react-router-dom';

function BookCard({
  book,
  to,
  actionLabel = 'View details',
  showProgress = false,
  currentChapter = 0,
  totalChapters = 0,
  onProgressChange,
}) {
  const hasCover = Boolean(book.coverUrl);

  const progressPercent =
    totalChapters > 0
      ? Math.min(Math.round((currentChapter / totalChapters) * 100), 100)
      : 0;

  const handleProgressChange = (e) => {
    const newChapter = Number(e.target.value);

    if (onProgressChange) {
      onProgressChange(newChapter);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-stone-200/70 shadow-sm hover:shadow-md hover:border-accent/70 transition overflow-hidden group">
      <div className="flex gap-5 p-5">
        <div className="shrink-0">
          {hasCover ? (
            <img
              src={book.coverUrl}
              alt={`${book.title} cover`}
              className="w-24 h-36 object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className="w-24 h-36 bg-ink rounded-xl shadow-sm flex items-center justify-center p-3 text-center">
              <span className="font-serif text-base italic text-cream leading-tight">
                {book.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            {book.genre && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">
                {book.genre}
              </span>
            )}

            <h3 className="font-serif text-2xl text-ink mb-1 group-hover:text-accent transition leading-tight">
              {book.title}
            </h3>

            {book.author && (
              <p className="text-sm text-stone-500 mb-3">
                by {book.author}
              </p>
            )}

            {book.description && (
              <p className="text-sm text-stone-500 leading-relaxed line-clamp-3">
                {book.description}
              </p>
            )}
          </div>

          {showProgress && totalChapters > 0 && (
            <div className="mt-5 bg-cream rounded-xl p-4 border border-stone-100">
              <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
                <span>
                  Chapter {currentChapter} of {totalChapters}
                </span>
                <span>{progressPercent}%</span>
              </div>

              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {onProgressChange && (
                <input
                  type="range"
                  min="0"
                  max={totalChapters}
                  value={currentChapter}
                  onChange={handleProgressChange}
                  className="w-full accent-[#7D6E5D]"
                />
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            {book.totalChapters ? (
              <span className="text-xs text-stone-400">
                {book.totalChapters} chapters
              </span>
            ) : (
              <span className="text-xs text-stone-400">
                Book
              </span>
            )}

            {to && (
              <Link
                to={to}
                className="text-sm font-medium text-accent hover:underline"
              >
                {actionLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default BookCard;