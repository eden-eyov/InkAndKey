function CreatePollModal({
  isOpen,
  newPollData,
  createPollFormErrors,
  creatingPoll,
  pollOptionUploadInProgress,

  activePollBookOptionIndex,
  pollBookSearchResults,
  pollBookSearchLoading,
  pollBookSearchError,
  pollBookSelectionMessages,
  pollOptionCoverUploadLoading,
  pollOptionCoverUploadError,

  onSubmit,
  onClose,
  onNewPollChange,
  onPollOptionChange,
  onPollBookFieldsFocus,
  onPollBookFieldsBlur,
  onSelectPollGoogleBook,
  onPollOptionCoverUpload,
  onRemovePollOption,
  onAddPollOption,

  renderGoogleBookSuggestion,
  renderDescriptionPreview,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
        aria-label="Close create poll form"
      />

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-cream border border-stone-200 rounded-3xl shadow-2xl p-5 md:p-7 space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
              Creator tools
            </span>

            <h3 className="font-serif text-2xl text-ink">
              Create next read poll
            </h3>

            <p className="text-sm text-stone-500 mt-1">
              Add book options and let club members vote for the next read.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-white border border-stone-200 text-stone-500 hover:border-accent hover:text-accent transition"
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        {createPollFormErrors.general && (
          <p className="text-sm text-red-600">
            {createPollFormErrors.general}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
              Question
            </label>

            <input
              type="text"
              name="question"
              value={newPollData.question}
              onChange={onNewPollChange}
              className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
              Closing date
            </label>

            <input
              type="datetime-local"
              name="closesAt"
              value={newPollData.closesAt}
              onChange={onNewPollChange}
              className={`w-full p-3 bg-white border rounded-xl focus:outline-none text-sm ${createPollFormErrors.closesAt
                ? 'border-red-500 focus:border-red-500'
                : 'border-stone-200 focus:border-accent'
                }`}
            />

            {createPollFormErrors.closesAt && (
              <p className="text-xs text-red-600 mt-2">
                {createPollFormErrors.closesAt}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">
              Book options
            </p>

            <p className="text-xs text-stone-400 mt-1">
              Search Google Books or enter the book details manually.
            </p>
          </div>

          {createPollFormErrors.options && (
            <p className="text-xs text-red-600">
              {createPollFormErrors.options}
            </p>
          )}

          {newPollData.options.map((option, index) => {
            const optionUploadKey = option._clientId || index;

            return (
              <div
                key={optionUploadKey}
                className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <h5 className="font-serif text-lg text-ink">
                    Option {index + 1}
                  </h5>

                  {newPollData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onRemovePollOption(index)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  onFocus={() => onPollBookFieldsFocus(index)}
                  onBlur={(e) => onPollBookFieldsBlur(e, index)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                        Book title
                      </label>

                      <input
                        type="text"
                        value={option.title}
                        onChange={(e) =>
                          onPollOptionChange(index, 'title', e.target.value)
                        }
                        className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                        Author
                      </label>

                      <input
                        type="text"
                        value={option.author}
                        onChange={(e) =>
                          onPollOptionChange(index, 'author', e.target.value)
                        }
                        className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                      />
                    </div>
                  </div>

                  {activePollBookOptionIndex === index &&
                    pollBookSearchLoading[index] && (
                      <p className="text-xs text-stone-400">
                        Searching Google Books...
                      </p>
                    )}

                  {activePollBookOptionIndex === index &&
                    pollBookSearchError[index] && (
                      <p className="text-xs text-red-600">
                        {pollBookSearchError[index]}
                      </p>
                    )}

                  {pollBookSelectionMessages?.[index] && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                      <p className="text-sm text-green-700">
                        {pollBookSelectionMessages[index]}
                      </p>
                    </div>
                  )}

                  {activePollBookOptionIndex === index &&
                    pollBookSearchResults[index]?.length > 0 && (
                      <div className="max-h-[360px] overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pollBookSearchResults[index].slice(0, 10).map((book) =>
                            renderGoogleBookSuggestion(
                              book,
                              `poll-${index}-suggestion-${book.googleBooksId || book.title}`,
                              () => onSelectPollGoogleBook(index, book),
                              { compact: true }
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                    Cover image URL
                  </label>

                  <input
                    type="text"
                    value={option.coverImage}
                    onChange={(e) =>
                      onPollOptionChange(index, 'coverImage', e.target.value)
                    }
                    placeholder="Optional"
                    className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                  />

                  <label className="mt-3 block">
                    <span className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                      Upload cover image
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPollOptionCoverUpload(index, e)}
                      disabled={pollOptionCoverUploadLoading[optionUploadKey]}
                      className="block w-full text-xs text-stone-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-white file:text-ink file:font-medium hover:file:text-accent disabled:opacity-50"
                    />
                  </label>

                  {pollOptionCoverUploadLoading[optionUploadKey] && (
                    <p className="text-xs text-stone-400 mt-2">
                      Uploading cover...
                    </p>
                  )}

                  {pollOptionCoverUploadError[optionUploadKey] && (
                    <p className="text-xs text-red-600 mt-2">
                      {pollOptionCoverUploadError[optionUploadKey]}
                    </p>
                  )}

                  {option.coverImage && (
                    <div className="bg-cream border border-stone-200 rounded-xl p-3 mt-3">
                      <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">
                        Cover preview
                      </p>

                      <div className="flex gap-3 items-start">
                        <img
                          src={option.coverImage}
                          alt={`${option.title || 'Book option'} cover`}
                          className="w-16 h-24 object-cover rounded-lg shadow-sm"
                        />

                        <div className="min-w-0">
                          <p className="font-serif text-lg text-ink leading-tight">
                            {option.title || 'Selected book'}
                          </p>

                          {option.author && (
                            <p className="text-xs text-stone-500">
                              by {option.author}
                            </p>
                          )}

                          {renderDescriptionPreview(
                            option.description,
                            `poll-option-${index}-selected-preview`,
                            { className: 'mt-2', limit: 180 }
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                    Description
                  </label>

                  <textarea
                    value={option.description}
                    onChange={(e) =>
                      onPollOptionChange(index, 'description', e.target.value)
                    }
                    rows="2"
                    placeholder="Optional"
                    className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
                  />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={onAddPollOption}
            className="w-full px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
          >
            Add another option
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={creatingPoll}
            className="px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={creatingPoll || pollOptionUploadInProgress}
            className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingPoll ? 'Creating...' : 'Create poll'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePollModal;