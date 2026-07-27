export const BOOK_SUGGESTION_MIN_QUERY_LENGTH = 3;
export const BOOK_SUGGESTION_DEBOUNCE_MS = 600;
export const DESCRIPTION_PREVIEW_LENGTH = 260;

export const emptySetBookFormErrors = {
  general: '',
  title: '',
  author: '',
  totalChapters: '',
};

export const emptyCreatePollFormErrors = {
  general: '',
  closesAt: '',
  options: '',
};

export const buildBookSuggestionQuery = (bookData) => {
  const title = bookData?.title?.trim() || '';
  const author = bookData?.author?.trim() || '';

  return [title, author].filter(Boolean).join(' ').trim();
};

export const getApiErrorMessage = (err, fallback) => {
  const errors = err.response?.data?.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    return errors.join(' ');
  }

  return err.response?.data?.message || fallback;
};

export const createPollOptionClientId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createEmptyPollOption = () => ({
  _clientId: createPollOptionClientId(),
  title: '',
  author: '',
  coverImage: '',
  coverImagePublicId: '',
  coverImageDeleteToken: '',
  description: '',
});

export const createInitialPollData = () => ({
  question: 'What should we read next?',
  closesAt: '',
  options: [createEmptyPollOption(), createEmptyPollOption()],
});

export const getCommentUserId = (comment) => {
  const commentUser = comment.user;

  if (!commentUser) {
    return '';
  }

  if (typeof commentUser === 'string') {
    return commentUser;
  }

  return commentUser._id || '';
};

export const mapCommentsToDiscussion = (comments = []) => {
  const topLevelComments = comments.filter((comment) => !comment.parentComment);
  const replies = comments.filter((comment) => comment.parentComment);

  return topLevelComments.map((comment) => {
    const commentReplies = replies.filter((reply) => {
      const parentId = reply.parentComment?._id || reply.parentComment;
      return parentId?.toString() === comment._id.toString();
    });

    return {
      _id: comment._id,
      title:
        comment.title ||
        (comment.isSpoilerFreeReview
          ? 'Spoiler-free review'
          : `Chapter ${comment.chapterNumber} discussion`),
      body: comment.text || '',
      chapterNumber: comment.chapterNumber,
      spoilerFree: comment.isSpoilerFreeReview,
      authorId: getCommentUserId(comment),
      authorName: comment.user?.username || 'Reader',
      authorIsDeleted: Boolean(comment.user?.isDeleted),
      isDeleted: Boolean(comment.isDeleted),
      isLocked: comment.isLocked,
      lockedReason: comment.isLocked
        ? `Locked — reach chapter ${comment.unlockChapter} to unlock`
        : '',
      likesCount: comment.likesCount || 0,
      isLikedByMe: Boolean(comment.isLikedByMe),
      repliesCount: commentReplies.length,
      replies: commentReplies.map((reply) => ({
        _id: reply._id,
        body: reply.text || '',
        chapterNumber: reply.chapterNumber,
        isLocked: Boolean(reply.isLocked),
        unlockChapter: reply.unlockChapter,
        lockedReason: reply.isLocked
          ? `Locked — reach chapter ${reply.unlockChapter} to unlock`
          : '',
        authorId: getCommentUserId(reply),
        authorName: reply.user?.username || 'Reader',
        authorIsDeleted: Boolean(reply.user?.isDeleted),
        isDeleted: Boolean(reply.isDeleted),
        likesCount: reply.likesCount || 0,
        isLikedByMe: Boolean(reply.isLikedByMe),
      })),
    };
  });
};