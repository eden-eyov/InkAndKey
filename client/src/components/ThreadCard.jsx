import { useState } from 'react';
import { Link } from 'react-router-dom';
import LockedContent from './LockedContent';

function AuthorLink({ userId, name }) {
  const displayName = name || 'Reader';

  if (!userId) {
    return <span className="font-medium text-stone-500">{displayName}</span>;
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
  isGuest = false,
  canLike = false,
  onSubmitReply,
  onToggleLike,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likingId, setLikingId] = useState(null);

  const canOpenThread = !thread.isLocked;

  const handleToggleOpen = () => {
    if (!canOpenThread) return;
    setIsOpen((prev) => !prev);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();

    const trimmedReply = replyText.trim();

    if (!trimmedReply) return;
    if (!onSubmitReply) return;

    try {
      await onSubmitReply(thread, trimmedReply);
      setReplyText('');
    } catch (error) {
      console.log('SUBMIT REPLY ERROR:', error);
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

          <h3 className="font-serif text-xl text-ink mb-2">
            {thread.title}
          </h3>

          <p className="text-stone-500 text-sm mb-4 leading-relaxed">
            {thread.body}
          </p>

          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>
              Posted by{' '}
              <AuthorLink userId={thread.authorId} name={thread.authorName} />
            </span>

            <span>
              {isOpen ? 'Hide replies' : `${thread.repliesCount || 0} replies`}
            </span>
          </div>
        </button>
        {!thread.isLocked && canLike && (
          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => handleLikeClick(thread._id)}
              disabled={likingId === thread._id}
              className={`text-sm font-medium transition ${thread.isLikedByMe
                ? 'text-accent'
                : 'text-stone-400 hover:text-accent'
                } disabled:opacity-50`}
            >
              {thread.isLikedByMe ? 'Liked' : 'Like'}
            </button>

            <span className="text-xs text-stone-400">
              {thread.likesCount || 0} likes
            </span>
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
                    className="bg-cream border border-stone-100 rounded-xl p-4"
                  >
                    <p className="text-sm text-stone-600 leading-relaxed mb-2">
                      {reply.body}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-stone-400">
                        Posted by{' '}
                        <AuthorLink userId={reply.authorId} name={reply.authorName} />
                      </span>

                      {canLike && (
                        <button
                          type="button"
                          onClick={() => handleLikeClick(reply._id)}
                          disabled={likingId === reply._id}
                          className={`text-xs font-medium transition ${reply.isLikedByMe
                            ? 'text-accent'
                            : 'text-stone-400 hover:text-accent'
                            } disabled:opacity-50`}
                        >
                          {reply.isLikedByMe ? 'Liked' : 'Like'} · {reply.likesCount || 0}
                        </button>
                      )}
                    </div>
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
            ) : (
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

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  Post reply
                </button>
              </form>
            )}
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