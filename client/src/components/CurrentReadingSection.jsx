import CurrentBookInfo from './CurrentBookInfo';
import ProgressTracker from './ProgressTracker';
import SetCurrentBookModal from './SetCurrentBookModal';

function CurrentReadingSection({
  currentBook,
  currentBookTitle,
  currentBookCover,
  hasCurrentBookCover,

  isGuest,
  isMember,
  isCreator,

  showSetBookForm,
  onToggleSetBookForm,
  removingCurrentBook,
  onRemoveCurrentBook,

  userReadingProgress,
  userCanRateCurrentBook,
  userRatedCurrentBook,
  onOpenRatingModal,

  hasMarkedCurrentBookAsDnf,
  userCurrentChapter,
  totalChapters,
  onUpdateProgress,

  dnfError,
  dnfMessage,
  canMarkCurrentBookAsDnf,
  dnfLoading,
  onMarkCurrentBookAsDnf,

  newBookData,
  setBookFormErrors,
  googleBooksLoading,
  googleBooksError,
  googleBookResults,
  newBookSuggestionsActive,
  settingCurrentBook,
  newBookCoverUploadLoading,
  newBookCoverUploadError,
  onSetCurrentBook,
  onCloseSetBookForm,
  onNewBookChange,
  onNewBookFieldsFocus,
  onNewBookFieldsBlur,
  onSelectGoogleBook,
  onNewBookCoverUpload,
  onNewBookGenreToggle,

  renderGoogleBookSuggestion,
  renderDescriptionPreview,
}) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0">
        <div className="bg-cream p-8 flex justify-center items-center border-b lg:border-b-0 lg:border-r border-stone-200/60">
          {hasCurrentBookCover ? (
            <img
              src={currentBookCover}
              alt={`${currentBookTitle} cover`}
              className="w-40 h-60 object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className="w-40 h-60 bg-ink rounded-xl shadow-sm flex items-center justify-center p-5 text-center">
              <span className="font-serif text-xl italic text-cream leading-tight">
                {currentBook ? currentBookTitle : 'No active book'}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1 inline-flex mb-3">
                Current read
              </span>

              <h2 className="font-serif text-3xl md:text-4xl text-ink">
                Reading together now
              </h2>

              <p className="text-sm text-stone-500 mt-1">
                Track your progress before joining chapter discussions.
              </p>
            </div>

            {isCreator && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onToggleSetBookForm}
                  disabled={removingCurrentBook}
                  className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showSetBookForm ? 'Close book form' : 'Set new current book'}
                </button>

                {currentBook && (
                  <button
                    type="button"
                    onClick={onRemoveCurrentBook}
                    disabled={removingCurrentBook}
                    className="px-5 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-full hover:border-red-400 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {removingCurrentBook
                      ? 'Removing...'
                      : 'Remove current book'}
                  </button>
                )}
              </div>
            )}
          </div>

          <CurrentBookInfo
            currentBook={currentBook}
            userReadingProgress={userReadingProgress}
            userCanRateCurrentBook={userCanRateCurrentBook}
            userRatedCurrentBook={userRatedCurrentBook}
            onOpenRatingModal={onOpenRatingModal}
            renderDescriptionPreview={renderDescriptionPreview}
          />

          {!isGuest && (
            <div className="space-y-5">
              {isMember && currentBook ? (
                <div className="space-y-4">
                  {hasMarkedCurrentBookAsDnf ? (
                    <div className="bg-cream border border-stone-100 rounded-xl p-4 text-sm text-stone-500">
                      You marked this book as DNF. It now appears in your previous books.
                    </div>
                  ) : (
                    <>
                      <ProgressTracker
                        currentChapter={userCurrentChapter}
                        totalChapters={totalChapters}
                        onUpdateProgress={onUpdateProgress}
                      />

                      {dnfError && (
                        <p className="text-sm text-red-500">{dnfError}</p>
                      )}

                      {dnfMessage && (
                        <p className="text-sm text-accent">{dnfMessage}</p>
                      )}

                      {canMarkCurrentBookAsDnf && (
                        <button
                          type="button"
                          onClick={onMarkCurrentBookAsDnf}
                          disabled={dnfLoading}
                          className="px-4 py-2 border border-stone-200 text-stone-500 text-xs font-bold uppercase tracking-widest rounded-full hover:border-red-300 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {dnfLoading ? 'Marking...' : 'Mark as DNF'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-cream border border-stone-100 rounded-xl p-4 text-sm text-stone-500">
                  {currentBook
                    ? 'Join this club to track your reading progress.'
                    : 'This club does not have an active book yet.'}
                </div>
              )}
            </div>
          )}

          {isGuest && (
            <div className="bg-cream border border-stone-100 rounded-xl p-4 text-sm text-stone-500">
              Sign in or create an account to join this club and track your reading progress.
            </div>
          )}

          <SetCurrentBookModal
            isOpen={isCreator && showSetBookForm}
            newBookData={newBookData}
            setBookFormErrors={setBookFormErrors}
            googleBooksLoading={googleBooksLoading}
            googleBooksError={googleBooksError}
            googleBookResults={googleBookResults}
            newBookSuggestionsActive={newBookSuggestionsActive}
            settingCurrentBook={settingCurrentBook}
            newBookCoverUploadLoading={newBookCoverUploadLoading}
            newBookCoverUploadError={newBookCoverUploadError}
            onSubmit={onSetCurrentBook}
            onClose={onCloseSetBookForm}
            onNewBookChange={onNewBookChange}
            onNewBookFieldsFocus={onNewBookFieldsFocus}
            onNewBookFieldsBlur={onNewBookFieldsBlur}
            onSelectGoogleBook={onSelectGoogleBook}
            onNewBookCoverUpload={onNewBookCoverUpload}
            onNewBookGenreToggle={onNewBookGenreToggle}
            renderGoogleBookSuggestion={renderGoogleBookSuggestion}
            renderDescriptionPreview={renderDescriptionPreview}
          />
        </div>
      </div>
    </section>
  );
}

export default CurrentReadingSection;