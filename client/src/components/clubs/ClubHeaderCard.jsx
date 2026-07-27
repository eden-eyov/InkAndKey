import { Link } from 'react-router-dom';

function ClubHeaderCard({
    club,
    currentBook,
    previousBooksCount = 0,
    membersCount = 0,
    displayedClubCoverImage = '',
    coverImagePreview = '',
    coverImageFile,
    coverImageUploading,
    coverImageUploadError,
    coverImageUploadMessage,
    isGuest,
    isMember,
    isCreator,
    onJoinClub,
    onLeaveClub,
    onArchiveClub,
    onCoverImageSelect,
    onUploadClubCoverImage,
    onClearCoverImageSelection,
}) {
    const creatorName = club?.creator?.username || 'Unknown creator';

    const genres = Array.isArray(club?.genres) ? club.genres : [];
    const genresTitle = genres.length > 0 ? genres.join(', ') : 'No genres listed';
    const genresDisplay =
        genres.length === 0
            ? 'None yet'
            : genres.length === 1
                ? genres[0]
                : `${genres[0]} +${genres.length - 1}`;

    const currentBookDisplay = currentBook?.title || 'None yet';

    return (
        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-8">
            <div className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="shrink-0">
                        {displayedClubCoverImage ? (
                            <div className="relative">
                                <img
                                    src={displayedClubCoverImage}
                                    alt={`${club.name} club cover`}
                                    className="w-28 h-28 md:w-32 md:h-32 object-cover rounded-2xl shadow-sm border border-stone-200/70"
                                />

                                {coverImagePreview && (
                                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-stone-200 text-ink text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 shadow-sm whitespace-nowrap">
                                        Preview
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="w-28 h-28 md:w-32 md:h-32 bg-ink rounded-2xl shadow-sm flex items-center justify-center p-4 text-center">
                                <span className="font-serif text-xl italic text-cream leading-tight">
                                    {club.name}
                                </span>
                            </div>
                        )}
                        {isCreator && (
                            <div className="mt-4 text-center">
                                <input
                                    id="club-header-cover-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={onCoverImageSelect}
                                    className="sr-only"
                                />

                                <label
                                    htmlFor="club-header-cover-image"
                                    className="inline-flex justify-center px-4 py-2 bg-white border border-stone-200 text-ink text-[11px] font-bold uppercase tracking-widest rounded-full hover:border-accent hover:text-accent transition cursor-pointer"
                                >
                                    Change photo
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1 inline-flex mb-3">
                                    Book club
                                </span>

                                <h1 className="font-serif text-4xl md:text-5xl mb-2 leading-tight">
                                    {club.name}
                                </h1>

                                <p className="text-sm text-stone-400 mb-4">
                                    Created by{' '}
                                    <span className="text-ink font-medium">{creatorName}</span>
                                </p>

                                {club.description && (
                                    <p className="text-stone-500 max-w-3xl leading-relaxed">
                                        {club.description}
                                    </p>
                                )}
                            </div>

                            <ClubActionButtons
                                club={club}
                                isGuest={isGuest}
                                isMember={isMember}
                                isCreator={isCreator}
                                onJoinClub={onJoinClub}
                                onLeaveClub={onLeaveClub}
                                onArchiveClub={onArchiveClub}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {isCreator && coverImageFile && (
                <div className="mx-6 md:mx-8 mb-6 bg-cream border border-stone-100 rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                                Club photo preview
                            </p>

                            <p className="text-sm text-stone-500 break-all">
                                Selected: {coverImageFile.name}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onUploadClubCoverImage}
                                disabled={coverImageUploading}
                                className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {coverImageUploading ? 'Uploading...' : 'Save photo'}
                            </button>

                            <button
                                type="button"
                                onClick={onClearCoverImageSelection}
                                disabled={coverImageUploading}
                                className="px-5 py-2.5 bg-white border border-stone-200 text-stone-500 text-sm font-medium rounded-full hover:border-red-300 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {coverImageUploadError && (
                        <p className="text-sm text-red-600 mt-3">
                            {coverImageUploadError}
                        </p>
                    )}
                </div>
            )}
            {isCreator && coverImageUploadMessage && (
                <div className="mx-6 md:mx-8 mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">
                        {coverImageUploadMessage}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-stone-200/60 bg-cream/70">
                <ClubStat value={membersCount} label="Members" />

                <ClubStat
                    value={currentBookDisplay}
                    label="Current book"
                    title={currentBookDisplay}
                />

                <ClubStat value={previousBooksCount} label="Previous books" />

                <ClubStat value={genresDisplay} label="Genres" title={genresTitle} />
            </div>
        </section>
    );
}

function ClubActionButtons({
    club,
    isGuest,
    isMember,
    isCreator,
    onJoinClub,
    onLeaveClub,
    onArchiveClub,
}) {
    if (isGuest) {
        return (
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-44">
                <Link
                    to="/login"
                    className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition text-center"
                >
                    Sign in
                </Link>

                <Link
                    to="/register"
                    className="px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
                >
                    Create account
                </Link>
            </div>
        );
    }

    if (isCreator) {
        return (
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-44">
                <Link
                    to={`/clubs/${club._id}/edit`}
                    className="px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
                >
                    Edit club
                </Link>

                <button
                    type="button"
                    onClick={onArchiveClub}
                    className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-full hover:bg-red-100 transition"
                >
                    Archive club
                </button>
            </div>
        );
    }

    if (isMember) {
        return (
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-44">
                <button
                    type="button"
                    onClick={onLeaveClub}
                    className="px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                >
                    Leave club
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-44">
            <button
                type="button"
                onClick={onJoinClub}
                className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
            >
                Join club
            </button>
        </div>
    );
}

function ClubStat({ value, label, title }) {
    return (
        <div
            className="px-4 py-4 md:px-6 text-center border-b md:border-b-0 odd:border-r md:border-r border-stone-200/60 last:border-r-0"
            title={title}
        >
            <p className="font-serif text-xl md:text-2xl text-ink truncate">
                {value}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {label}
            </p>
        </div>
    );
}

export default ClubHeaderCard;