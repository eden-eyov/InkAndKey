import { useState } from 'react';
import { Link } from 'react-router-dom';
import LockedContent from './LockedContent';

function AuthorLink({ userId, name, isDeleted = false }) {
  const displayName = isDeleted ? 'Deleted user' : name || 'Reader';

  if (!userId || isDeleted) {
    return (
      <span className="font-medium text-stone-500">
        {displayName}
      </span>
    );
  }

  return (
    <Link
      to={`/users/${userId}`}
      onClick={(e) => e.stopPropagation()}
      className="font-medium text-ink hover:text-accent hover:underline transition"
    >
      {displayName}
    </Link>
  );
}

function ThreadCard({
  thread,
  totalChapters = 0,
  isGuest = false,
  canLike = false,
  currentUserId,
  onSubmitReply,
  onToggleLike,
  onDeleteComment,
  onUpdateComment,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyChapter, setReplyChapter] = useState(
    Number(thread.chapterNumber) || 0
  );
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [likingId, setLikingId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editChapter, setEditChapter] = useState(1);
  const [editSpoilerFree, setEditSpoilerFree] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const canOpenThread = !thread.isLocked;

  const handleToggleOpen = () => {
    if (!canOpenThread) return;
    setIsOpen((prev) => !prev);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();

    const trimmedReply = replyText.trim();
    const selectedChapter = Number(replyChapter);

    if (!trimmedReply || !onSubmitReply || replySubmitting) {
      return;
    }

    if (
      !Number.isInteger(selectedChapter) ||
      selectedChapter < parentChapter ||
      selectedChapter > bookTotalChapters
    ) {
      return;
    }

    try {
      setReplySubmitting(true);

      await onSubmitReply(
        thread,
        trimmedReply,
        selectedChapter
      );

      setReplyText('');
      setReplyChapter(parentChapter);
    } catch (error) {
      console.log('SUBMIT REPLY ERROR:', error);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleLikeClick = async (commentId) => {
    if (!canLike || !onToggleLike) return;

    try {
      setLikingId(commentId);
      await onToggleLike(commentId);
    } finally {
      setLikingId(null);
    }
  };

  const handleDeleteClick = async (commentId) => {
    if (!onDeleteComment) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this comment?'
    );

    if (!confirmed) return;

    try {
      setDeletingId(commentId);

      await onDeleteComment(commentId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEditing = () => {
    setEditText(thread.body || '');
    setEditChapter(Number(thread.chapterNumber) || 1);
    setEditSpoilerFree(Boolean(thread.spoilerFree));
    setEditError('');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (editSubmitting) return;

    setIsEditing(false);
    setEditError('');
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!onUpdateComment || editSubmitting) return;

    const trimmedText = editText.trim();
    const selectedChapter = Number(editChapter);

    if (!trimmedText) {
      setEditError('Please write some text for the discussion.');
      return;
    }

    if (
      !Number.isInteger(selectedChapter) ||
      selectedChapter < 1 ||
      selectedChapter > bookTotalChapters
    ) {
      setEditError(
        `Please choose a chapter between 1 and ${bookTotalChapters}.`
      );
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError('');

      await onUpdateComment(thread._id, {
        text: trimmedText,
        chapterNumber: selectedChapter,
        isSpoilerFreeReview: editSpoilerFree,
      });

      setIsEditing(false);
    } catch (error) {
      console.log('UPDATE DISCUSSION ERROR:', error);

      setEditError(
        error.response?.data?.message ||
        'Failed to update the discussion. Please try again.'
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const parentChapter = Number(thread.chapterNumber) || 0;
  const bookTotalChapters = Number(totalChapters) || parentChapter;

  const canDeleteThread =
    Boolean(currentUserId) &&
    Boolean(thread.authorId) &&
    currentUserId.toString() === thread.authorId.toString();

  const canReply =
    !thread.isDeleted &&
    !thread.isLocked &&
    !isGuest;

  const replyChapterOptions = Array.from(
    {
      length: Math.max(
        bookTotalChapters - parentChapter + 1,
        1
      ),
    },
    (_, index) => parentChapter + index
  );

  return (
    <article
      className={`relative overflow-hidden bg-white p-6 rounded-2xl border shadow-sm transition ${thread.isLocked
        ? 'border-stone-200/60'
        : 'border-stone-200/60 hover:border-accent'
        }`}
    >
      <div
        className={
          thread.isLocked ? 'blur-sm select-none pointer-events-none' : ''
        }
      >
        <button
          type="button"
          onClick={handleToggleOpen}
          disabled={!canOpenThread}
          className="w-full text-left disabled:cursor-not-allowed"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {thread.spoilerFree ? (
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1">
                Spoiler-free
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-cream border border-stone-200 rounded-full px-3 py-1">
                Chapter {thread.chapterNumber}
              </span>
            )}

            {thread.isLocked && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 rounded-full px-3 py-1">
                Locked
              </span>
            )}
          </div>

          {!isEditing && (
            <>
              <h3 className="font-serif text-xl text-ink mb-2">
                {thread.title}
              </h3>

              <p className="text-stone-500 text-sm mb-4 leading-relaxed">
                {thread.body}
              </p>
            </>
          )}

          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>
              Posted by{' '}
              <AuthorLink
                userId={thread.authorId}
                name={thread.authorName}
                isDeleted={thread.authorIsDeleted}
              />
            </span>

            <span>
              {isOpen ? 'Hide replies' : `${thread.repliesCount || 0} replies`}
            </span>
          </div>
        </button>
        {isEditing && (
          <form
            onSubmit={handleSubmitEdit}
            className="mt-4 space-y-4 rounded-xl border border-stone-200 bg-cream p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {editError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {editError}
              </p>
            )}

            <div>
              <label
                htmlFor={`edit-discussion-text-${thread._id}`}
                className="mb-1 block text-xs uppercase tracking-wider text-stone-500"
              >
                Discussion text
              </label>

              <textarea
                id={`edit-discussion-text-${thread._id}`}
                value={editText}
                onChange={(e) => {
                  setEditText(e.target.value);

                  if (editError) {
                    setEditError('');
                  }
                }}
                rows="4"
                disabled={editSubmitting}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor={`edit-discussion-chapter-${thread._id}`}
                className="mb-1 block text-xs uppercase tracking-wider text-stone-500"
              >
                Chapter
              </label>

              <select
                id={`edit-discussion-chapter-${thread._id}`}
                value={editChapter}
                onChange={(e) => {
                  setEditChapter(Number(e.target.value));

                  if (editError) {
                    setEditError('');
                  }
                }}
                disabled={editSubmitting || editSpoilerFree}
                className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:border-accent focus:outline-none disabled:opacity-60"
              >
                {Array.from(
                  { length: Math.max(bookTotalChapters, 1) },
                  (_, index) => index + 1
                ).map((chapter) => (
                  <option key={chapter} value={chapter}>
                    Chapter {chapter}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-accent">
              <input
                type="checkbox"
                checked={editSpoilerFree}
                onChange={(e) => {
                  setEditSpoilerFree(e.target.checked);

                  if (editError) {
                    setEditError('');
                  }
                }}
                disabled={editSubmitting}
                className="mt-1 accent-[#7D6E5D]"
              />

              <span>
                <span className="block text-sm font-medium text-ink">
                  Spoiler-free discussion
                </span>

                <span className="mt-1 block text-xs leading-relaxed text-stone-500">
                  Safe for guests and readers at any chapter.
                </span>
              </span>
            </label>

            <div className="flex justify-end gap-3 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={handleCancelEditing}
                disabled={editSubmitting}
                className="text-sm font-medium text-stone-500 transition hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={editSubmitting || !editText.trim()}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
        {canDeleteThread && !thread.isDeleted && (
          <div className="mt-3 flex justify-end gap-4">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="text-xs font-medium text-stone-400 transition hover:text-accent"
              >
                Edit discussion
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDeleteClick(thread._id)}
              disabled={deletingId === thread._id || editSubmitting}
              className="text-xs font-medium text-stone-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingId === thread._id
                ? 'Deleting...'
                : 'Delete discussion'}
            </button>
          </div>
        )}
        {!thread.isLocked && canLike && (
          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => handleLikeClick(thread._id)}
              disabled={likingId === thread._id}
              aria-pressed={thread.isLikedByMe}
              className={`inline-flex items-center gap-2 text-sm font-medium transition ${thread.isLikedByMe
                ? 'text-accent'
                : 'text-stone-400 hover:text-accent'
                } disabled:opacity-50`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {thread.isLikedByMe ? '♥' : '♡'}
              </span>

              <span>{thread.likesCount || 0}</span>

              <span className="sr-only">
                {thread.isLikedByMe ? 'Unlike discussion' : 'Like discussion'}
              </span>
            </button>
          </div>
        )}

        {isOpen && !thread.isLocked && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <h4 className="font-serif text-lg mb-4">Replies</h4>

            {thread.replies?.length > 0 ? (
              <div className="space-y-3 mb-5">
                {thread.replies.map((reply) => (
                  <div
                    key={reply._id}
                    className="relative overflow-hidden bg-cream border border-stone-100 rounded-xl p-4"
                  >
                    <div
                      className={
                        reply.isLocked
                          ? 'blur-sm select-none pointer-events-none'
                          : ''
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-white border border-stone-200 rounded-full px-3 py-1">
                          Chapter {reply.chapterNumber}
                        </span>

                        {reply.isLocked && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 rounded-full px-3 py-1">
                            Locked
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-stone-600 leading-relaxed mb-2">
                        {reply.body}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-stone-400">
                          Posted by{' '}
                          <AuthorLink
                            userId={reply.authorId}
                            name={reply.authorName}
                            isDeleted={reply.authorIsDeleted}
                          />
                        </span>

                        {canLike && !reply.isLocked && (
                          <button
                            type="button"
                            onClick={() => handleLikeClick(reply._id)}
                            disabled={likingId === reply._id}
                            aria-pressed={reply.isLikedByMe}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${reply.isLikedByMe
                              ? 'text-accent'
                              : 'text-stone-400 hover:text-accent'
                              } disabled:opacity-50`}
                          >
                            <span aria-hidden="true" className="text-base leading-none">
                              {reply.isLikedByMe ? '♥' : '♡'}
                            </span>

                            <span>{reply.likesCount || 0}</span>

                            <span className="sr-only">
                              {reply.isLikedByMe ? 'Unlike reply' : 'Like reply'}
                            </span>
                          </button>
                        )}
                      </div>
                      {currentUserId?.toString() === reply.authorId?.toString() &&
                        !reply.isDeleted && (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(reply._id)}
                              disabled={deletingId === reply._id}
                              className="text-xs font-medium text-stone-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === reply._id ? 'Deleting...' : 'Delete reply'}
                            </button>
                          </div>
                        )}
                    </div>

                    {reply.isLocked && (
                      <LockedContent
                        reason={reply.lockedReason}
                        isGuest={isGuest}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500 mb-5">
                No replies yet. Be the first to continue the discussion.
              </p>
            )}

            {isGuest ? (
              <div className="bg-cream border border-stone-100 rounded-xl p-4">
                <p className="text-sm text-stone-500 mb-3">
                  Sign in or create an account to reply to this discussion.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
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
              </div>
            ) : canReply ? (
              <form onSubmit={handleSubmitReply} className="space-y-3">
                <label
                  htmlFor={`reply-${thread._id}`}
                  className="block text-xs uppercase tracking-wider text-stone-500"
                >
                  Add a reply
                </label>

                <textarea
                  id={`reply-${thread._id}`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows="3"
                  className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
                />

                <div>
                  <label
                    htmlFor={`reply-chapter-${thread._id}`}
                    className="block text-xs uppercase tracking-wider text-stone-500 mb-1"
                  >
                    Chapter
                  </label>

                  <select
                    id={`reply-chapter-${thread._id}`}
                    value={replyChapter}
                    onChange={(e) =>
                      setReplyChapter(Number(e.target.value))
                    }
                    disabled={replySubmitting}
                    className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm disabled:opacity-60"
                  >
                    {replyChapterOptions.map((chapter) => (
                      <option key={chapter} value={chapter}>
                        {chapter === parentChapter
                          ? `Chapter ${chapter} — same as discussion`
                          : `Chapter ${chapter}`}
                      </option>
                    ))}
                  </select>

                  <p className="mt-1 text-xs text-stone-400">
                    Choose a later chapter only if your reply discusses
                    information revealed later in the book.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={replySubmitting || !replyText.trim()}
                  className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replySubmitting ? 'Posting...' : 'Post reply'}
                </button>
              </form>
            ) : thread.isDeleted ? (
              <p className="text-sm italic text-stone-400">
                This discussion was deleted and can no longer receive replies.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {thread.isLocked && (
        <LockedContent reason={thread.lockedReason} isGuest={isGuest} />
      )}
    </article>
  );
}

export default ThreadCard;