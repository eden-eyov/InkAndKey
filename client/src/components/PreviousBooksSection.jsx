function PreviousBooksSection({
  previousBooks = [],
  user,
  isMember,
  ratingError,
  ratingMessage,
  ratingLoadingId,
  onRatePreviousBook,
}) {
  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
        <div>
          <h2 className="font-serif text-3xl mb-1">Previous books</h2>

          <p className="text-sm text-stone-500">
            Books this club has already read together.
          </p>
        </div>
      </div>

      {previousBooks.length > 0 ? (
        <div className="space-y-4">
          {(ratingError || ratingMessage) && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
              {ratingError && (
                <p className="text-sm text-red-500">{ratingError}</p>
              )}

              {ratingMessage && (
                <p className="text-sm text-accent">{ratingMessage}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousBooks.map((book) => (
              <PreviousBookCard
                key={book._id}
                book={book}
                user={user}
                isMember={isMember}
                ratingLoadingId={ratingLoadingId}
                onRatePreviousBook={onRatePreviousBook}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
          <p className="text-stone-500 text-sm">
            This club does not have previous books yet.
          </p>
        </div>
      )}
    </section>
  );
}

function PreviousBookCard({
  book,
  user,
  isMember,
  ratingLoadingId,
  onRatePreviousBook,
}) {
  const progress = book.userReadingProgress;
  const userCompletedThisBook =
    progress?.status === 'completed' && progress?.isCompleted;

  const userRating = progress?.rating || null;
  const canRate = isMember && userCompletedThisBook;
  const isSavingRating = ratingLoadingId === progress?._id;

  return (
    <article className="bg-white rounded-2xl border border-stone-200/70 shadow-sm hover:shadow-md hover:border-accent/70 transition overflow-hidden">
      <div className="flex gap-5 p-5">
        <BookCover book={book} />

        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">
              Previous club book
            </span>

            <h3 className="font-serif text-2xl text-ink mb-1 leading-tight">
              {book.title || 'Untitled book'}
            </h3>

            {book.author && (
              <p className="text-sm text-stone-500 mb-3">
                by {book.author}
              </p>
            )}

            {book.description && (
              <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 mb-4">
                {book.description}
              </p>
            )}

            <BookBadges book={book} />
          </div>

          <div className="pt-4 border-t border-stone-100">
            <PreviousBookRatingStatus
              book={book}
              user={user}
              isMember={isMember}
              progress={progress}
              canRate={canRate}
              userRating={userRating}
              isSavingRating={isSavingRating}
              onRatePreviousBook={onRatePreviousBook}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function BookCover({ book }) {
  if (book.coverImage) {
    return (
      <div className="shrink-0">
        <img
          src={book.coverImage}
          alt={`${book.title} cover`}
          className="w-24 h-36 object-cover rounded-xl shadow-sm"
        />
      </div>
    );
  }

  return (
    <div className="shrink-0">
      <div className="w-24 h-36 bg-ink rounded-xl shadow-sm flex items-center justify-center p-3 text-center">
        <span className="font-serif text-base italic text-cream leading-tight">
          {book.title}
        </span>
      </div>
    </div>
  );
}

function BookBadges({ book }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {book.totalChapters ? (
        <span className="px-3 py-1 rounded-full bg-cream border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {book.totalChapters} chapters
        </span>
      ) : (
        <span className="px-3 py-1 rounded-full bg-cream border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Book
        </span>
      )}

      {Number(book.ratingsCount) > 0 ? (
        <span className="px-3 py-1 rounded-full bg-cream border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-accent">
          Avg {book.averageRating}/5 · {book.ratingsCount}{' '}
          {book.ratingsCount === 1 ? 'rating' : 'ratings'}
        </span>
      ) : (
        <span className="px-3 py-1 rounded-full bg-cream border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          No ratings yet
        </span>
      )}
    </div>
  );
}

function PreviousBookRatingStatus({
  book,
  user,
  isMember,
  progress,
  canRate,
  userRating,
  isSavingRating,
  onRatePreviousBook,
}) {
  if (!user) {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
        Log in to rate completed books
      </p>
    );
  }

  if (canRate) {
    return (
      <>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((ratingValue) => {
            const isSelected = Number(userRating) >= ratingValue;

            return (
              <button
                key={ratingValue}
                type="button"
                onClick={() => onRatePreviousBook(book, ratingValue)}
                disabled={isSavingRating}
                className={`text-xl leading-none transition ${
                  isSelected ? 'text-accent' : 'text-stone-300'
                } ${
                  isSavingRating
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:text-accent cursor-pointer'
                }`}
                aria-label={`Rate ${book.title || 'book'} ${ratingValue} out of 5`}
                title={`Rate ${ratingValue}/5`}
              >
                ★
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
          {isSavingRating
            ? 'Saving rating...'
            : userRating
              ? `Your rating: ${userRating}/5`
              : 'Add your rating'}
        </p>
      </>
    );
  }

  if (progress?.status === 'dnf') {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
        You marked this book as DNF
      </p>
    );
  }

  if (progress) {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
        Finish the book to rate it
      </p>
    );
  }

  if (isMember) {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
        No reading progress for this book
      </p>
    );
  }

  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
      Join the club to track and rate books
    </p>
  );
}

export default PreviousBooksSection;