import { useCallback, useState } from 'react';
import api from '../services/api';
import { mapCommentsToDiscussion } from '../utils/clubPageUtils';

function useDashboardDiscussions() {
  const [discussionsByProgressId, setDiscussionsByProgressId] =
    useState({});

  const [discussionsLoadingId, setDiscussionsLoadingId] =
    useState('');

  const [discussionsErrors, setDiscussionsErrors] = useState({});

  const [newDiscussionProgressId, setNewDiscussionProgressId] =
    useState('');

  const setDiscussionError = useCallback(
    (progressId, message) => {
      if (!progressId) return;

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progressId]: message,
      }));
    },
    []
  );

  const clearDiscussionError = useCallback((progressId) => {
    if (!progressId) return;

    setDiscussionsErrors((previousErrors) => ({
      ...previousErrors,
      [progressId]: '',
    }));
  }, []);

  const fetchDiscussionsForProgress = useCallback(
    async (
      progress,
      {
        forceRefresh = false,
        showLoading = true,
      } = {}
    ) => {
      const progressId = progress?._id;
      const clubId = progress?.club?._id;
      const bookId = progress?.book?._id;

      if (progress?.club?.isArchived) {
        return;
      }

      if (!progressId || !clubId || !bookId) {
        return;
      }

      if (
        !forceRefresh &&
        discussionsByProgressId[progressId]
      ) {
        return;
      }

      try {
        if (showLoading) {
          setDiscussionsLoadingId(progressId);
        }

        clearDiscussionError(progressId);

        const { data } = await api.get('/comments', {
          params: {
            club: clubId,
            book: bookId,
          },
        });

        setDiscussionsByProgressId(
          (previousDiscussions) => ({
            ...previousDiscussions,
            [progressId]: mapCommentsToDiscussion(
              data.data || []
            ),
          })
        );
      } catch (err) {
        console.log(
          'DASHBOARD DISCUSSIONS ERROR:',
          err.response?.data || err
        );

        setDiscussionError(
          progressId,
          err.response?.data?.message ||
            'Could not load discussions for this book.'
        );
      } finally {
        if (showLoading) {
          setDiscussionsLoadingId('');
        }
      }
    },
    [
      clearDiscussionError,
      discussionsByProgressId,
      setDiscussionError,
    ]
  );

  const handleCreateDashboardDiscussion = async (
    progress,
    discussionData
  ) => {
    const progressId = progress?._id;
    const clubId = progress?.club?._id;
    const bookId = progress?.book?._id;

    if (!progressId || !clubId || !bookId) {
      return;
    }

    try {
      clearDiscussionError(progressId);

      await api.post('/comments', {
        club: clubId,
        book: bookId,
        title: discussionData.title,
        text: discussionData.body,
        chapterNumber: discussionData.chapterNumber,
        isSpoilerFreeReview: discussionData.spoilerFree,
        parentComment: null,
      });

      setNewDiscussionProgressId('');

      await fetchDiscussionsForProgress(progress, {
        forceRefresh: true,
        showLoading: false,
      });
    } catch (err) {
      console.log(
        'CREATE DASHBOARD DISCUSSION ERROR:',
        err.response?.data || err
      );

      setDiscussionError(
        progressId,
        err.response?.data?.message ||
          'Failed to publish the discussion.'
      );
    }
  };

  const handleCreateDiscussionReply = async (
    progress,
    thread,
    replyText,
    chapterNumber
  ) => {
    const progressId = progress?._id;
    const clubId = progress?.club?._id;
    const bookId = progress?.book?._id;

    if (!progressId || !clubId || !bookId) {
      return;
    }

    try {
      clearDiscussionError(progressId);

      await api.post('/comments', {
        club: clubId,
        book: bookId,
        text: replyText,
        chapterNumber,
        parentComment: thread._id,
      });

      await fetchDiscussionsForProgress(progress, {
        forceRefresh: true,
        showLoading: false,
      });
    } catch (err) {
      console.log(
        'DASHBOARD DISCUSSION REPLY ERROR:',
        err.response?.data || err
      );

      setDiscussionError(
        progressId,
        err.response?.data?.message ||
          'Failed to publish your reply.'
      );

      throw err;
    }
  };

  const handleToggleDiscussionLike = async (
    progress,
    commentId
  ) => {
    const progressId = progress?._id;
    const clubId = progress?.club?._id;
    const bookId = progress?.book?._id;

    if (!progressId || !clubId || !bookId) {
      return;
    }

    try {
      clearDiscussionError(progressId);

      await api.post(`/comments/${commentId}/like`);

      await fetchDiscussionsForProgress(progress, {
        forceRefresh: true,
        showLoading: false,
      });
    } catch (err) {
      console.log(
        'DASHBOARD DISCUSSION LIKE ERROR:',
        err.response?.data || err
      );

      setDiscussionError(
        progressId,
        err.response?.data?.message ||
          'Failed to update the like.'
      );
    }
  };

  const handleDeleteDiscussionComment = async (
    progress,
    commentId
  ) => {
    const progressId = progress?._id;

    if (!progressId) {
      return;
    }

    try {
      clearDiscussionError(progressId);

      await api.delete(`/comments/${commentId}`);

      await fetchDiscussionsForProgress(progress, {
        forceRefresh: true,
        showLoading: false,
      });
    } catch (err) {
      console.log(
        'DELETE DASHBOARD COMMENT ERROR:',
        err.response?.data || err
      );

      setDiscussionError(
        progressId,
        err.response?.data?.message ||
          'Failed to delete comment.'
      );
    }
  };

  const handleUpdateDiscussionComment = async (
    progress,
    commentId,
    updateData
  ) => {
    const progressId = progress?._id;

    if (!progressId) {
      return;
    }

    try {
      clearDiscussionError(progressId);

      await api.patch(`/comments/${commentId}`, {
        text: updateData.text,
        chapterNumber: updateData.chapterNumber,
        isSpoilerFreeReview:
          updateData.isSpoilerFreeReview,
      });

      await fetchDiscussionsForProgress(progress, {
        forceRefresh: true,
        showLoading: false,
      });
    } catch (err) {
      console.log(
        'UPDATE DASHBOARD COMMENT ERROR:',
        err.response?.data || err
      );

      setDiscussionError(
        progressId,
        err.response?.data?.message ||
          'Failed to update discussion.'
      );

      throw err;
    }
  };

  const handleToggleNewDiscussion = (progressId) => {
    setNewDiscussionProgressId((currentId) =>
      currentId === progressId ? '' : progressId
    );
  };

  const handleCancelNewDiscussion = () => {
    setNewDiscussionProgressId('');
  };

  return {
    discussionsByProgressId,
    discussionsLoadingId,
    discussionsErrors,
    newDiscussionProgressId,

    fetchDiscussionsForProgress,
    handleCreateDashboardDiscussion,
    handleCreateDiscussionReply,
    handleToggleDiscussionLike,
    handleDeleteDiscussionComment,
    handleUpdateDiscussionComment,
    handleToggleNewDiscussion,
    handleCancelNewDiscussion,
  };
}

export default useDashboardDiscussions;