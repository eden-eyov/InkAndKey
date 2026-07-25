import AddThreadForm from './AddThreadForm';
import ThreadCard from './ThreadCard';

function DiscussionsSection({
  currentBook,
  currentBookTitle,
  totalChapters,
  isGuest,
  isMember,
  currentUserId,
  userCurrentChapter,
  showAddCommentForm,
  comments = [],
  commentsLoading,
  onStartDiscussion,
  onCancelComment,
  onCreateComment,
  onCreateReply,
  onToggleLike,
  onDeleteComment,
  onUpdateComment,
}) {
  const visibleComments = comments.map((comment) => {
    if (isGuest) {
      return {
        ...comment,
        isLocked: !comment.spoilerFree,
        lockedReason: 'Members only — sign in to unlock chapter discussions',
      };
    }

    const isAheadOfProgress =
      comment.chapterNumber > userCurrentChapter && !comment.spoilerFree;

    return {
      ...comment,
      isLocked: isAheadOfProgress,
      lockedReason: `Locked — reach chapter ${comment.chapterNumber} to unlock`,
    };
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
        <div>
          <h2 className="font-serif text-3xl mb-1">
            {currentBook
              ? `Discussions for ${currentBookTitle}`
              : 'Discussions'}
          </h2>

          <p className="text-sm text-stone-500">
            {currentBook
              ? 'Spoiler-aware comments for the current book, unlocked by your reading progress.'
              : 'Discussions will appear here once the club has an active book.'}
          </p>
        </div>

        {!isGuest && isMember && (
          <button
            type="button"
            onClick={onStartDiscussion}
            className="hidden sm:inline-block px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            New discussion
          </button>
        )}
      </div>

      {showAddCommentForm && !isGuest && currentBook && (
        <AddThreadForm
          totalChapters={totalChapters}
          onCancel={onCancelComment}
          onSubmitThread={onCreateComment}
        />
      )}

      {commentsLoading ? (
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
          <p className="font-serif text-stone-500 italic text-lg">
            Loading discussions...
          </p>
        </div>
      ) : visibleComments.length > 0 ? (
        <div className="space-y-4">
          {visibleComments.map((comment) => (
            <ThreadCard
              key={comment._id}
              thread={comment}
              totalChapters={totalChapters}
              isGuest={isGuest}
              canLike={isMember}
              currentUserId={currentUserId}
              onSubmitReply={onCreateReply}
              onToggleLike={onToggleLike}
              onDeleteComment={onDeleteComment}
              onUpdateComment={onUpdateComment}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
          <p className="text-stone-500 text-sm">
            No discussions yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default DiscussionsSection;