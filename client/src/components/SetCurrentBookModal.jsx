import GENRES from '../utils/genres';

function SetCurrentBookModal({
    isOpen,
    newBookData,
    setBookFormErrors,
    googleBooksLoading,
    googleBooksError,
    googleBookResults,
    newBookSuggestionsActive,
    settingCurrentBook,
    newBookCoverUploadLoading,
    newBookCoverUploadError,
    onSubmit,
    onClose,
    onNewBookChange,
    onNewBookFieldsFocus,
    onNewBookFieldsBlur,
    onSelectGoogleBook,
    onNewBookCoverUpload,
    onNewBookGenreToggle,
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
                aria-label="Close set current book form"
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
                            Set new current book
                        </h3>

                        <p className="text-sm text-stone-500 mt-1">
                            Add the next book your club is reading. The previous current book will move to the club history automatically.
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

                {setBookFormErrors.general && (
                    <p className="text-sm text-red-600">
                        {setBookFormErrors.general}
                    </p>
                )}

                <div
                    onFocus={onNewBookFieldsFocus}
                    onBlur={onNewBookFieldsBlur}
                    className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                Book title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={newBookData.title}
                                onChange={onNewBookChange}
                                className={`w-full p-3 bg-cream border rounded-xl focus:outline-none text-sm ${setBookFormErrors.title
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-stone-200 focus:border-accent'
                                    }`}
                            />

                            {setBookFormErrors.title && (
                                <p className="text-xs text-red-600 mt-2">
                                    {setBookFormErrors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                Author
                            </label>

                            <input
                                type="text"
                                name="author"
                                value={newBookData.author}
                                onChange={onNewBookChange}
                                className={`w-full p-3 bg-cream border rounded-xl focus:outline-none text-sm ${setBookFormErrors.author
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-stone-200 focus:border-accent'
                                    }`}
                            />

                            {setBookFormErrors.author && (
                                <p className="text-xs text-red-600 mt-2">
                                    {setBookFormErrors.author}
                                </p>
                            )}
                        </div>
                    </div>

                    {googleBooksLoading && (
                        <p className="text-xs text-stone-400">
                            Searching Google Books...
                        </p>
                    )}

                    {googleBooksError && (
                        <p className="text-sm text-red-600">
                            {googleBooksError}
                        </p>
                    )}

                    {newBookSuggestionsActive && googleBookResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {googleBookResults.slice(0, 6).map((book) =>
                                renderGoogleBookSuggestion(
                                    book,
                                    `new-book-suggestion-${book.googleBooksId || book.title}`,
                                    () => onSelectGoogleBook(book),
                                    { selectLabel: 'Choose this book' }
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                            Total chapters
                        </label>

                        <input
                            type="number"
                            min="1"
                            name="totalChapters"
                            value={newBookData.totalChapters}
                            onChange={onNewBookChange}
                            className={`w-full p-3 bg-white border rounded-xl focus:outline-none text-sm ${setBookFormErrors.totalChapters
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-stone-200 focus:border-accent'
                                }`}
                        />

                        {setBookFormErrors.totalChapters && (
                            <p className="text-xs text-red-600 mt-2">
                                {setBookFormErrors.totalChapters}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                            Cover image URL
                        </label>

                        <input
                            type="text"
                            name="coverImage"
                            value={newBookData.coverImage}
                            onChange={onNewBookChange}
                            placeholder="Optional"
                            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                        />

                        <label className="mt-3 block">
                            <span className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                Upload cover image
                            </span>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={onNewBookCoverUpload}
                                disabled={newBookCoverUploadLoading}
                                className="block w-full text-xs text-stone-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-cream file:text-ink file:font-medium hover:file:text-accent disabled:opacity-50"
                            />
                        </label>

                        {newBookCoverUploadLoading && (
                            <p className="text-xs text-stone-400 mt-2">
                                Uploading cover...
                            </p>
                        )}

                        {newBookCoverUploadError && (
                            <p className="text-xs text-red-600 mt-2">
                                {newBookCoverUploadError}
                            </p>
                        )}
                    </div>

                    {newBookData.coverImage && (
                        <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl p-4">
                            <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">
                                Cover preview
                            </p>

                            <div className="flex gap-4 items-start">
                                <img
                                    src={newBookData.coverImage}
                                    alt={`${newBookData.title || 'Selected book'} cover`}
                                    className="w-24 h-36 object-cover rounded-xl shadow-sm"
                                />

                                <div className="text-sm text-stone-500">
                                    <p className="font-serif text-xl text-ink mb-1">
                                        {newBookData.title || 'Selected book'}
                                    </p>

                                    {newBookData.author && <p>by {newBookData.author}</p>}

                                    {newBookData.pageCount && (
                                        <p className="mt-2">{newBookData.pageCount} pages</p>
                                    )}

                                    {newBookData.publishedDate && (
                                        <p>Published: {newBookData.publishedDate}</p>
                                    )}

                                    {renderDescriptionPreview(
                                        newBookData.description,
                                        'new-book-selected-preview',
                                        { className: 'mt-3' }
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
                        name="description"
                        value={newBookData.description}
                        onChange={onNewBookChange}
                        rows="3"
                        className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
                    />
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">
                        Genres
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {GENRES.map((genre) => (
                            <button
                                key={genre}
                                type="button"
                                onClick={() => onNewBookGenreToggle(genre)}
                                className={`px-3 py-1.5 rounded-full text-xs border transition ${newBookData.genres.includes(genre)
                                    ? 'bg-accent border-accent text-white'
                                    : 'bg-white border-stone-200 text-stone-600 hover:border-accent hover:text-accent'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={settingCurrentBook || newBookCoverUploadLoading}
                        className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {settingCurrentBook ? 'Saving...' : 'Create and set current book'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SetCurrentBookModal;