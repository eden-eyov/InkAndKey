import { Link } from 'react-router-dom';
import ProgressTracker from './ProgressTracker';
import ThreadCard from './ThreadCard';
import AddThreadForm from './AddThreadForm';

function DashboardReadingTab({
  filteredCurrentReads,
  normalizedSearchQuery,

  progressActionError,
  progressActionMessage,

  expandedRead,
  clubs,

  newDiscussionProgressId,
  discussionsLoadingId,
  discussionsErrors,
  discussionsByProgressId,

  dnfActionLoadingId,
  currentUserId,

  onToggleRead,
  onChangeReadSection,
  onUpdateProgress,
  onMarkAsDnf,

  onToggleNewDiscussion,
  onCancelNewDiscussion,
  onCreateDiscussion,
  onCreateReply,
  onToggleDiscussionLike,
  onDeleteDiscussionComment,
  onUpdateDiscussionComment,
}) {
  return (
    <section>
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
          Continue reading
        </span>

        <h2 className="font-serif text-3xl mt-2 mb-1">
          Your current books
        </h2>

        <p className="text-sm text-stone-500">
          Update your progress and return to spoiler-safe conversations.
        </p>

        {progressActionError && (
          <p className="text-sm text-red-500 mt-3">
            {progressActionError}
          </p>
        )}

        {progressActionMessage && (
          <p className="text-sm text-accent mt-3">
            {progressActionMessage}
          </p>
        )}
      </div>

      {filteredCurrentReads.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/60 bg-cream p-8 text-center">
          <p className="text-sm text-stone-500">
            {normalizedSearchQuery
              ? 'No current books match your search.'
              : 'You do not have any current reads yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCurrentReads.map((progress) => {
            const bookTitle =
              progress.book?.title || 'Untitled book';

            const bookAuthor = progress.book?.author || '';
            const bookCover = progress.book?.coverImage || '';
            const isArchivedClub = Boolean(progress.club?.isArchived);

            const totalChapters =
              Number(progress.book?.totalChapters) || 0;

            const currentChapter =
              Number(progress.currentChapter) || 0;

            const canMarkAsDnf =
              currentChapter > 0 &&
              !progress.isCompleted &&
              progress.status !== 'completed';

            const progressPercent =
              totalChapters > 0
                ? Math.min(
                    Math.round(
                      (currentChapter / totalChapters) * 100
                    ),
                    100
                  )
                : 0;

            const isExpanded =
              expandedRead.id === progress._id;

            const showProgress =
              isExpanded &&
              expandedRead.section === 'progress';

            const showDiscussions =
              isExpanded &&
              expandedRead.section === 'discussions';

            const dashboardClub = (
              Array.isArray(clubs) ? clubs : []
            ).find(
              (club) =>
                club._id?.toString() ===
                progress.club?._id?.toString()
            );

            const clubCurrentBookId =
              dashboardClub?.currentBook?._id ||
              dashboardClub?.currentBook;

            const isStillCurrentClubBook =
              Boolean(clubCurrentBookId) &&
              clubCurrentBookId.toString() ===
                progress.book?._id?.toString();

            return (
              <article
                key={progress._id}
                className="rounded-2xl border border-stone-200/60 bg-white shadow-sm overflow-hidden transition hover:border-accent"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="w-24 h-36 rounded-xl overflow-hidden bg-cream border border-stone-100 flex-shrink-0">
                      {bookCover ? (
                        <img
                          src={bookCover}
                          alt={`${bookTitle} cover`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-ink flex items-center justify-center p-3 text-center">
                          <span className="font-serif text-sm italic text-cream leading-tight">
                            {bookTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                        {isArchivedClub
                          ? 'Club no longer available'
                          : `Reading with ${
                              progress.club?.name || 'a book club'
                            }`}
                      </span>

                      <h3 className="font-serif text-2xl mt-2 mb-1">
                        {bookTitle}
                      </h3>

                      {bookAuthor && (
                        <p className="text-sm text-stone-500">
                          by {bookAuthor}
                        </p>
                      )}

                      <div className="mt-5">
                        <div className="flex justify-between gap-4 text-xs text-stone-500 mb-2">
                          <span>
                            Chapter {currentChapter} of{' '}
                            {totalChapters}
                          </span>

                          <span>{progressPercent}%</span>
                        </div>

                        <div className="w-full h-2 rounded-full overflow-hidden bg-stone-100">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-500"
                            style={{
                              width: `${progressPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-5">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleRead(progress._id)
                          }
                          className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                            isExpanded
                              ? 'bg-accent text-white'
                              : 'bg-ink text-white hover:opacity-90'
                          }`}
                        >
                          {isExpanded ? 'Close' : 'Open'}
                        </button>

                        {isArchivedClub ? (
                          <span className="text-sm text-stone-400 ml-auto">
                            This club is no longer available
                          </span>
                        ) : (
                          progress.club?._id && (
                            <Link
                              to={`/clubs/${progress.club._id}`}
                              className="text-sm font-medium text-accent hover:underline ml-auto"
                            >
                              View club
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-cream/50">
                    <div className="flex items-center gap-6 border-b border-stone-200 px-5 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          onChangeReadSection(
                            progress,
                            'progress'
                          )
                        }
                        className={`pb-3 text-sm font-medium border-b-2 transition ${
                          expandedRead.section === 'progress'
                            ? 'border-accent text-accent'
                            : 'border-transparent text-stone-500 hover:text-ink'
                        }`}
                      >
                        Progress
                      </button>

                      {!isArchivedClub && (
                        <button
                          type="button"
                          onClick={() =>
                            onChangeReadSection(
                              progress,
                              'discussions'
                            )
                          }
                          className={`pb-3 text-sm font-medium border-b-2 transition ${
                            expandedRead.section ===
                            'discussions'
                              ? 'border-accent text-accent'
                              : 'border-transparent text-stone-500 hover:text-ink'
                          }`}
                        >
                          Discussions
                        </button>
                      )}
                    </div>

                    <div className="p-5">
                      {showProgress && (
                        <div>
                          <ProgressTracker
                            currentChapter={currentChapter}
                            totalChapters={totalChapters}
                            onUpdateProgress={(nextChapter) =>
                              onUpdateProgress(
                                progress,
                                nextChapter
                              )
                            }
                          />

                          {canMarkAsDnf && (
                            <div className="mt-6 pt-5 border-t border-stone-200">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                  <h5 className="text-sm font-medium text-ink">
                                    Not planning to finish this
                                    book?
                                  </h5>

                                  <p className="text-xs text-stone-500 mt-1">
                                    It will be moved out of your
                                    current reads and kept in your
                                    reading history as DNF.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onMarkAsDnf(progress)
                                  }
                                  disabled={
                                    dnfActionLoadingId ===
                                    progress._id
                                  }
                                  className="inline-flex items-center justify-center rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {dnfActionLoadingId ===
                                  progress._id
                                    ? 'Marking as DNF...'
                                    : 'Mark as DNF'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {showDiscussions &&
                        !isArchivedClub && (
                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                                  Recent discussions
                                </span>

                                <h4 className="font-serif text-2xl mt-2">
                                  Conversations about {bookTitle}
                                </h4>

                                {newDiscussionProgressId ===
                                  progress._id && (
                                  <AddThreadForm
                                    totalChapters={
                                      totalChapters
                                    }
                                    onCancel={
                                      onCancelNewDiscussion
                                    }
                                    onSubmitThread={(
                                      discussionData
                                    ) =>
                                      onCreateDiscussion(
                                        progress,
                                        discussionData
                                      )
                                    }
                                  />
                                )}
                              </div>

                              {progress.club?._id && (
                                <div className="flex flex-wrap items-center gap-4">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleNewDiscussion(
                                        progress._id
                                      )
                                    }
                                    className="text-sm font-medium text-ink hover:text-accent transition"
                                  >
                                    {newDiscussionProgressId ===
                                    progress._id
                                      ? 'Cancel'
                                      : 'New discussion'}
                                  </button>

                                  {isStillCurrentClubBook && (
                                    <Link
                                      to={`/clubs/${progress.club._id}`}
                                      className="text-sm font-medium text-accent hover:underline"
                                    >
                                      View all discussions
                                    </Link>
                                  )}

                                  {!isStillCurrentClubBook && (
                                    <span className="text-xs text-stone-400">
                                      This is a previous club read.
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {discussionsLoadingId ===
                            progress._id ? (
                              <div className="rounded-2xl border border-stone-200/60 bg-white p-6 text-center">
                                <p className="text-sm italic text-stone-500">
                                  Loading discussions...
                                </p>
                              </div>
                            ) : discussionsErrors[
                                progress._id
                              ] ? (
                              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                                <p className="text-sm text-red-600">
                                  {
                                    discussionsErrors[
                                      progress._id
                                    ]
                                  }
                                </p>
                              </div>
                            ) : (
                              <DashboardDiscussionList
                                progress={progress}
                                totalChapters={totalChapters}
                                currentUserId={currentUserId}
                                discussions={
                                  discussionsByProgressId[
                                    progress._id
                                  ] || []
                                }
                                onCreateReply={onCreateReply}
                                onToggleDiscussionLike={
                                  onToggleDiscussionLike
                                }
                                onDeleteDiscussionComment={
                                  onDeleteDiscussionComment
                                }
                                onUpdateDiscussionComment={
                                  onUpdateDiscussionComment
                                }
                              />
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DashboardDiscussionList({
  progress,
  totalChapters,
  currentUserId,
  discussions,
  onCreateReply,
  onToggleDiscussionLike,
  onDeleteDiscussionComment,
  onUpdateDiscussionComment,
}) {
  const recentDiscussions = [...discussions]
    .reverse()
    .slice(0, 3);

  if (recentDiscussions.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200/60 bg-white p-6 text-center">
        <p className="text-sm text-stone-500">
          No discussions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentDiscussions.map((thread) => (
        <ThreadCard
          key={thread._id}
          thread={thread}
          totalChapters={totalChapters}
          currentUserId={currentUserId}
          canLike
          onSubmitReply={(
            selectedThread,
            replyText,
            chapterNumber
          ) =>
            onCreateReply(
              progress,
              selectedThread,
              replyText,
              chapterNumber
            )
          }
          onToggleLike={(commentId) =>
            onToggleDiscussionLike(progress, commentId)
          }
          onDeleteComment={(commentId) =>
            onDeleteDiscussionComment(progress, commentId)
          }
          onUpdateComment={(commentId, updateData) =>
            onUpdateDiscussionComment(
              progress,
              commentId,
              updateData
            )
          }
        />
      ))}
    </div>
  );
}

export default DashboardReadingTab;