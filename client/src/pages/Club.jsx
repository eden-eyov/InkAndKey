import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fetchAllClubs, fetchUserClubs } from '../store/clubsSlice';
import useSetCurrentBook from '../hooks/useSetCurrentBook';
import useClubPolls from '../hooks/useClubPolls';

import CurrentReadingSection from '../components/CurrentReadingSection';
import DiscussionsSection from '../components/DiscussionsSection';
import BookRatingModal from '../components/BookRatingModal';
import PreviousBooksSection from '../components/PreviousBooksSection';
import ClubHeaderCard from '../components/ClubHeaderCard';
import ClubPollsSection from '../components/ClubPollsSection';

import {
  DESCRIPTION_PREVIEW_LENGTH,
  mapCommentsToDiscussion,
} from '../utils/clubPageUtils';

function Club() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const isGuest = !user;

  const [showAddCommentForm, setShowAddCommentForm] = useState(false);
  const [discussionComments, setDiscussionComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dnfLoading, setDnfLoading] = useState(false);
  const [dnfError, setDnfError] = useState('');
  const [dnfMessage, setDnfMessage] = useState('');

  const [showCurrentBookRatingModal, setShowCurrentBookRatingModal] =
    useState(false);

  const [completedProgressForRating, setCompletedProgressForRating] =
    useState(null);

  const [currentBookRatingLoading, setCurrentBookRatingLoading] =
    useState(false);

  const [currentBookRatingError, setCurrentBookRatingError] =
    useState('');

  const [ratingLoadingId, setRatingLoadingId] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [ratingMessage, setRatingMessage] = useState('');

  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageUploadError, setCoverImageUploadError] = useState('');
  const [coverImageUploadMessage, setCoverImageUploadMessage] = useState('');

  const refreshClubLists = () => {
    dispatch(fetchAllClubs());

    if (user) {
      dispatch(fetchUserClubs());
    }
  };

  useEffect(() => {
    return () => {
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview]);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get(`/clubs/${clubId}`);

        let clubData = data.data;

        if (user && clubData.currentBook?._id) {
          try {
            const progressResponse = await api.get('/reading-progress', {
              params: {
                club: clubId,
                book: clubData.currentBook._id,
              },
            });

            const progress = progressResponse.data.data?.[0] || null;

            clubData = {
              ...clubData,
              userCurrentChapter: progress?.currentChapter || 0,
              userReadingProgress: progress,
            };
          } catch (progressError) {
            console.log(
              'FETCH PROGRESS ERROR:',
              progressError.response?.data || progressError
            );

            clubData = {
              ...clubData,
              userCurrentChapter: 0,
              userReadingProgress: null,
            };
          }
        }

        if (user && clubData.previousBooks?.length > 0) {
          try {
            const previousBooksWithProgress = await Promise.all(
              clubData.previousBooks.map(async (book) => {
                const progressResponse = await api.get('/reading-progress', {
                  params: {
                    club: clubId,
                    book: book._id,
                  },
                });

                const progress = progressResponse.data.data?.[0] || null;

                return {
                  ...book,
                  userReadingProgress: progress,
                };
              })
            );

            clubData = {
              ...clubData,
              previousBooks: previousBooksWithProgress,
            };
          } catch (previousProgressError) {
            console.log(
              'FETCH PREVIOUS BOOK PROGRESS ERROR:',
              previousProgressError.response?.data || previousProgressError
            );
          }
        }

        const currentUserId = user?.id || user?._id;

        const userIsMember = clubData.members?.some((member) => {
          const memberId = member._id || member;
          return memberId.toString() === currentUserId;
        });

        if (clubData.currentBook?._id) {
          await fetchComments(clubData.currentBook._id, !user || !userIsMember);
        }

        if (user) {
          await clubPolls.fetchClubPolls(false);
        }

        setClub(clubData);
      } catch (err) {
        console.log('FETCH CLUB ERROR:', err.response?.data || err);

        setError(
          err.response?.data?.message ||
          'Failed to load club. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [clubId, user]);

  const fetchComments = async (
    bookId,
    shouldUsePublicRoute = false,
    showLoading = true
  ) => {
    if (!bookId) return;

    try {
      if (showLoading) {
        setCommentsLoading(true);
      }

      const endpoint = shouldUsePublicRoute
        ? '/comments/public'
        : '/comments';

      const { data } = await api.get(endpoint, {
        params: {
          club: clubId,
          book: bookId,
        },
      });

      setDiscussionComments(
        mapCommentsToDiscussion(data.data || [])
      );
    } catch (err) {
      console.log(
        'FETCH COMMENTS ERROR:',
        err.response?.data || err
      );
    } finally {
      if (showLoading) {
        setCommentsLoading(false);
      }
    }
  };

  const handleUpdateProgress = async (newChapter) => {
    if (!currentBook || !isMember) return;

    try {
      setDnfError('');
      setDnfMessage('');
      setCurrentBookRatingError('');

      const { data } = await api.post('/reading-progress', {
        club: clubId,
        book: currentBook._id,
        currentChapter: newChapter,
      });

      const updatedProgress = data.data;
      const updatedBook = updatedProgress.book;

      setClub((prevClub) => ({
        ...prevClub,
        userCurrentChapter: updatedProgress.currentChapter,
        userReadingProgress: updatedProgress,
        currentBook: {
          ...prevClub.currentBook,
          averageRating:
            updatedBook?.averageRating ?? prevClub.currentBook?.averageRating,
          ratingsCount:
            updatedBook?.ratingsCount ?? prevClub.currentBook?.ratingsCount,
        },
      }));

      const shouldOpenRatingModal =
        updatedProgress.isCompleted &&
        updatedProgress.status === 'completed' &&
        !updatedProgress.rating;

      if (shouldOpenRatingModal) {
        setCompletedProgressForRating(updatedProgress);
        setShowCurrentBookRatingModal(true);
      }

      await fetchComments(currentBook._id, false);

      refreshClubLists();
    } catch (err) {
      console.log('UPDATE PROGRESS ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to update reading progress. Please try again.'
      );
    }
  };

  const handleRateCurrentBook = async (rating) => {
    if (!completedProgressForRating?._id) return;

    try {
      setCurrentBookRatingLoading(true);
      setCurrentBookRatingError('');

      const { data } = await api.patch(
        `/reading-progress/${completedProgressForRating._id}/rating`,
        { rating }
      );

      const updatedProgress = data.data;
      const updatedBook = updatedProgress.book;

      setClub((prevClub) => ({
        ...prevClub,
        userReadingProgress: updatedProgress,
        currentBook: {
          ...prevClub.currentBook,
          averageRating:
            updatedBook?.averageRating ?? prevClub.currentBook?.averageRating,
          ratingsCount:
            updatedBook?.ratingsCount ?? prevClub.currentBook?.ratingsCount,
        },
      }));

      setShowCurrentBookRatingModal(false);
      setCompletedProgressForRating(null);
      setCurrentBookRatingError('');

      refreshClubLists();
    } catch (err) {
      console.log('CURRENT BOOK RATING ERROR:', err.response?.data || err);

      setCurrentBookRatingError(
        err.response?.data?.message ||
        'Failed to save rating. Please try again.'
      );
    } finally {
      setCurrentBookRatingLoading(false);
    }
  };

  const handleCloseCurrentBookRatingModal = () => {
    if (currentBookRatingLoading) return;

    setShowCurrentBookRatingModal(false);
    setCompletedProgressForRating(null);
    setCurrentBookRatingError('');
  };

  const handleMarkCurrentBookAsDnf = async () => {
    const progressId = club?.userReadingProgress?._id;

    if (!progressId || dnfLoading) return;

    const confirmed = window.confirm(
      'Mark this book as DNF? It will move to your previous books and keep your last saved chapter.'
    );

    if (!confirmed) return;

    try {
      setDnfLoading(true);
      setDnfError('');
      setDnfMessage('');

      const { data } = await api.patch(`/reading-progress/${progressId}/dnf`);

      setClub((prevClub) => ({
        ...prevClub,
        userReadingProgress: data.data,
        userCurrentChapter: data.data.currentChapter,
      }));

      setDnfMessage('Book marked as DNF.');
      refreshClubLists();
    } catch (err) {
      console.log('CLUB DNF ERROR:', err.response?.data || err);

      setDnfError(
        err.response?.data?.message ||
        'Failed to mark this book as DNF. Please try again.'
      );
    } finally {
      setDnfLoading(false);
    }
  };

  const handleRatePreviousBook = async (book, rating) => {
    const progressId = book?.userReadingProgress?._id;

    if (!progressId || ratingLoadingId) return;

    try {
      setRatingLoadingId(progressId);
      setRatingError('');
      setRatingMessage('');

      const { data } = await api.patch(`/reading-progress/${progressId}/rating`, {
        rating,
      });

      const updatedProgress = data.data;
      const updatedBook = updatedProgress.book;

      setClub((prevClub) => ({
        ...prevClub,
        previousBooks: prevClub.previousBooks.map((previousBook) => {
          if (previousBook._id !== book._id) {
            return previousBook;
          }

          return {
            ...previousBook,
            averageRating:
              updatedBook?.averageRating ?? previousBook.averageRating,
            ratingsCount:
              updatedBook?.ratingsCount ?? previousBook.ratingsCount,
            userReadingProgress: updatedProgress,
          };
        }),
      }));

      setRatingMessage('Book rating saved.');
      refreshClubLists();
    } catch (err) {
      console.log('CLUB PREVIOUS BOOK RATING ERROR:', err.response?.data || err);

      setRatingError(
        err.response?.data?.message ||
        'Failed to save rating. Please try again.'
      );
    } finally {
      setRatingLoadingId('');
    }
  };

  const handleJoinClub = async () => {
    if (isGuest) return;

    try {
      setError('');

      const { data } = await api.post(`/clubs/${clubId}/join`);
      const updatedClub = data.data;

      setClub((prevClub) => ({
        ...updatedClub,
        userCurrentChapter: prevClub?.userCurrentChapter || 0,
      }));

      if (updatedClub.currentBook?._id) {
        await fetchComments(updatedClub.currentBook._id, false);
      }

      refreshClubLists();
    } catch (err) {
      console.log('JOIN CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to join club. Please try again.'
      );
    }
  };

  const handleLeaveClub = async () => {
    if (isGuest || !club) return;

    try {
      setError('');

      const { data } = await api.post(`/clubs/${clubId}/leave`);
      const updatedClub = data.data;

      setClub((prevClub) => ({
        ...updatedClub,
        userCurrentChapter: prevClub?.userCurrentChapter || 0,
      }));

      if (updatedClub.currentBook?._id) {
        await fetchComments(updatedClub.currentBook._id, true);
      }

      refreshClubLists();
    } catch (err) {
      console.log('LEAVE CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to leave club. Please try again.'
      );
    }
  };

  const handleDeleteClub = async () => {
    if (isGuest || !club) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this club? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.delete(`/clubs/${clubId}`);

      refreshClubLists();
      navigate('/clubs');
    } catch (err) {
      console.log('DELETE CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to delete club. Please try again.'
      );
    }
  };

  const clearSelectedCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview('');
    setCoverImageUploadError('');
  };

  const handleCoverImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setCoverImageUploadError('');
    setCoverImageUploadMessage('');

    if (!file.type.startsWith('image/')) {
      setCoverImageFile(null);
      setCoverImagePreview('');
      setCoverImageUploadError('Please choose an image file.');
      e.target.value = '';
      return;
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCoverImageUpload = async () => {
    if (!coverImageFile || coverImageUploading) return;

    try {
      setCoverImageUploading(true);
      setCoverImageUploadError('');
      setCoverImageUploadMessage('');

      const formData = new FormData();
      formData.append('image', coverImageFile);

      const { data } = await api.put(
        `/clubs/${clubId}/cover-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const updatedClub = data.data;

      setClub((currentClub) => ({
        ...updatedClub,
        userCurrentChapter:
          currentClub?.userCurrentChapter ??
          updatedClub.userCurrentChapter ??
          0,
      }));

      setCoverImageFile(null);
      setCoverImagePreview('');
      setCoverImageUploadMessage(
        data.message || 'Club cover image updated successfully.'
      );
      refreshClubLists();
    } catch (err) {
      console.log('CLUB COVER IMAGE UPLOAD ERROR:', err.response?.data || err);

      setCoverImageUploadError(
        err.response?.data?.message ||
        'Failed to upload the club cover image. Please try again.'
      );
    } finally {
      setCoverImageUploading(false);
    }
  };

  const handleStartDiscussion = () => {
    if (isGuest) return;
    // Opens the new discussion form on this page.
    setShowAddCommentForm(true);
  };

  const handleCreateComment = async (commentData) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        title: commentData.title,
        text: commentData.body,
        chapterNumber: commentData.chapterNumber,
        isSpoilerFreeReview: commentData.spoilerFree,
        parentComment: null,
      });

      setShowAddCommentForm(false);

      await fetchComments(currentBook._id, false);
    } catch (err) {
      console.log('CREATE THREAD ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to publish discussion. Please try again.'
      );
    }
  };

  const handleCreateReply = async (
    comment,
    replyText,
    chapterNumber
  ) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        text: replyText,
        chapterNumber,
        parentComment: comment._id,
      });

      await fetchComments(currentBook._id, false, false);
    } catch (err) {
      console.log(
        'CREATE REPLY ERROR:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        'Failed to publish reply. Please try again.'
      );

      throw err;
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post(`/comments/${commentId}/like`);

      await fetchComments(currentBook._id, false, false);
    } catch (err) {
      console.log('TOGGLE LIKE ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to update like. Please try again.'
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentBook || !isMember) return;

    try {
      await api.delete(`/comments/${commentId}`);

      await fetchComments(currentBook._id, false, false);
    } catch (err) {
      console.log(
        'DELETE COMMENT ERROR:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        'Failed to delete comment. Please try again.'
      );
    }
  };

  const toggleDescriptionPreview = (key) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderDescriptionPreview = (
    description,
    key,
    { className = '', limit = DESCRIPTION_PREVIEW_LENGTH } = {}
  ) => {
    const text = description?.trim();

    if (!text) return null;

    const isExpanded = Boolean(expandedDescriptions[key]);
    const shouldShorten = text.length > limit;
    const visibleText =
      shouldShorten && !isExpanded ? `${text.slice(0, limit).trim()}...` : text;

    return (
      <div className={className}>
        <p
          className={`text-xs text-stone-500 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'
            }`}
        >
          {visibleText}
        </p>

        {shouldShorten && (
          <button
            type="button"
            onClick={() => toggleDescriptionPreview(key)}
            className="mt-1 text-xs font-medium text-accent hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  const renderGoogleBookSuggestion = (
    book,
    descriptionKey,
    onSelect,
    { selectLabel = 'Use this result', compact = false } = {}
  ) => (
    <div
      key={`${descriptionKey}-${book.googleBooksId || book.title || 'book'}`}
      className="text-left bg-white border border-stone-200 rounded-xl p-3 hover:border-accent transition"
    >
      <div className="flex gap-3">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={`${book.title || 'Book'} cover`}
            className={`${compact ? 'w-12 h-16' : 'w-16 h-24'
              } object-cover rounded-lg shadow-sm flex-shrink-0`}
          />
        ) : (
          <div
            className={`${compact ? 'w-12 h-16' : 'w-16 h-24'
              } bg-ink rounded-lg flex items-center justify-center p-2 text-center flex-shrink-0`}
          >
            <span className="font-serif text-[10px] italic text-cream">
              No cover
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4
            className={`${compact ? 'text-base' : 'text-lg'
              } font-serif text-ink leading-tight line-clamp-2`}
          >
            {book.title || 'Untitled book'}
          </h4>

          <p className="text-xs text-stone-500 mt-1">
            {book.author || 'Unknown author'}
          </p>

          <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-stone-400">
            {book.publishedDate && <span>{book.publishedDate}</span>}
            {book.pageCount && <span>{book.pageCount} pages</span>}
            {book.language && <span>{book.language.toUpperCase()}</span>}
          </div>

          {renderDescriptionPreview(book.description, descriptionKey, {
            className: 'mt-2',
            limit: compact ? 180 : DESCRIPTION_PREVIEW_LENGTH,
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="mt-3 text-xs font-medium text-accent hover:underline"
      >
        {selectLabel}
      </button>
    </div>
  );

  const currentUserIdForSetBook = user?.id || user?._id;
  const creatorIdForSetBook = club?.creator?._id || club?.creator;

  const isCreatorForSetBook =
    Boolean(currentUserIdForSetBook) &&
    Boolean(creatorIdForSetBook) &&
    creatorIdForSetBook.toString() === currentUserIdForSetBook.toString();

  const setCurrentBookForm = useSetCurrentBook({
    clubId,
    isCreator: isCreatorForSetBook,
    onClubUpdated: setClub,
    onCommentsReset: () => setDiscussionComments([]),
    onCommentsRefresh: fetchComments,
    onClubListsRefresh: refreshClubLists,
  });

  const clubPolls = useClubPolls({
    clubId,
    club,
    user,
    onClubUpdated: setClub,
    onCommentsReset: () => setDiscussionComments([]),
    onCommentsRefresh: fetchComments,
    onClubListsRefresh: refreshClubLists,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center">
        <p className="font-serif text-stone-500 italic text-lg animate-pulse">
          Loading club...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center max-w-md">
          <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
          <p className="text-stone-500 text-sm mb-5">{error}</p>

          <Link
            to="/clubs"
            className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            Back to clubs
          </Link>
        </div>
      </div>
    );
  }

  if (!club) {
    return null;
  }
  const currentBook = club.currentBook;

  const currentBookTitle = currentBook?.title || 'No active book yet';
  const currentBookCover = currentBook?.coverImage || '';
  const hasCurrentBookCover = Boolean(currentBookCover);

  const totalChapters = currentBook?.totalChapters || 0;
  const userCurrentChapter = club.userCurrentChapter || 0;

  const membersCount = club.members?.length || club.membersCount || 0;

  const currentUserId = user?.id || user?._id;

  const isMember = club.members?.some((member) => {
    const memberId = member._id || member;

    return memberId?.toString() === currentUserId?.toString();
  });

  const userReadingProgress = club.userReadingProgress;

  const hasActiveReadingProgress =
    userReadingProgress &&
    userReadingProgress.status !== 'completed' &&
    userReadingProgress.status !== 'dnf' &&
    !userReadingProgress.isCompleted;

  const canMarkCurrentBookAsDnf =
    isMember &&
    hasActiveReadingProgress &&
    Number(userReadingProgress.currentChapter) > 0;

  const hasMarkedCurrentBookAsDnf =
    userReadingProgress?.status === 'dnf';

  const creatorId = club.creator?._id || club.creator;

  const isCreator =
    Boolean(currentUserId) &&
    Boolean(creatorId) &&
    creatorId.toString() === currentUserId.toString();

  const displayedClubCoverImage = coverImagePreview || club.coverImage || '';
  const canVoteInPoll = isMember || isCreator;

  const renderAnnounceWinnerForm = () => {
    if (!clubPolls.poll) return null;

    return (
      <form
        onSubmit={clubPolls.handleAnnounceWinner}
        className="bg-cream border border-stone-100 rounded-xl p-4 space-y-4"
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Winning option
          </label>

          <select
            name="optionId"
            value={clubPolls.winnerData.optionId}
            onChange={clubPolls.handleWinnerDataChange}
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          >
            <option value="">Choose winner</option>

            {(clubPolls.poll.options || []).map((option) => (
              <option key={option.optionId} value={option.optionId}>
                {option.title} - {option.votesCount} votes
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Total chapters
          </label>

          <input
            type="number"
            min="1"
            name="totalChapters"
            value={clubPolls.winnerData.totalChapters}
            onChange={clubPolls.handleWinnerDataChange}
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Title
          </label>

          <input
            type="text"
            name="title"
            value={clubPolls.winnerData.title}
            onChange={clubPolls.handleWinnerDataChange}
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Author
          </label>

          <input
            type="text"
            name="author"
            value={clubPolls.winnerData.author}
            onChange={clubPolls.handleWinnerDataChange}
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Cover image URL
          </label>

          <input
            type="text"
            name="coverImage"
            value={clubPolls.winnerData.coverImage}
            onChange={clubPolls.handleWinnerDataChange}
            placeholder="Optional"
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Description
          </label>

          <textarea
            name="description"
            value={clubPolls.winnerData.description}
            onChange={clubPolls.handleWinnerDataChange}
            rows="3"
            placeholder="Optional"
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={clubPolls.announcingWinner}
          className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clubPolls.announcingWinner ? 'Announcing...' : 'Confirm winner'}
        </button>
      </form>
    );
  };

  const previousBooks = club?.previousBooks || [];

  const userCompletedCurrentBook =
    userReadingProgress?.status === 'completed' &&
    userReadingProgress?.isCompleted;

  const userCanRateCurrentBook =
    isMember &&
    userCompletedCurrentBook &&
    !userReadingProgress?.rating;

  const userRatedCurrentBook =
    isMember &&
    userCompletedCurrentBook &&
    Boolean(userReadingProgress?.rating);

  const handleOpenCurrentBookRatingModal = () => {
    setCompletedProgressForRating(userReadingProgress);
    setCurrentBookRatingError('');
    setShowCurrentBookRatingModal(true);
  };

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-7xl mx-auto">
        {isGuest && (
          <div className="mb-8 bg-white/70 border border-stone-200/70 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl mb-1">
                You are previewing this club as a guest
              </h2>

              <p className="text-sm text-stone-500">
                Guests can read spoiler-free discussions. To join the club,
                track progress, vote in surveys, or write comments, create an
                account.
              </p>
            </div>

            <Link
              to="/register"
              className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition text-center"
            >
              Join Ink & Key
            </Link>
          </div>
        )}

        <ClubHeaderCard
          club={club}
          currentBook={currentBook}
          previousBooksCount={previousBooks.length}
          membersCount={membersCount}
          displayedClubCoverImage={displayedClubCoverImage}
          coverImagePreview={coverImagePreview}
          coverImageFile={coverImageFile}
          coverImageUploading={coverImageUploading}
          coverImageUploadError={coverImageUploadError}
          coverImageUploadMessage={coverImageUploadMessage}
          isGuest={isGuest}
          isMember={isMember}
          isCreator={isCreator}
          onJoinClub={handleJoinClub}
          onLeaveClub={handleLeaveClub}
          onDeleteClub={handleDeleteClub}
          onCoverImageSelect={handleCoverImageSelect}
          onUploadClubCoverImage={handleCoverImageUpload}
          onClearCoverImageSelection={clearSelectedCoverImage}
        />

        <CurrentReadingSection
          currentBook={currentBook}
          currentBookTitle={currentBookTitle}
          currentBookCover={currentBookCover}
          hasCurrentBookCover={hasCurrentBookCover}
          isGuest={isGuest}
          isMember={isMember}
          isCreator={isCreator}
          showSetBookForm={setCurrentBookForm.showSetBookForm}
          onToggleSetBookForm={setCurrentBookForm.handleToggleSetBookForm}
          userReadingProgress={userReadingProgress}
          userCanRateCurrentBook={userCanRateCurrentBook}
          userRatedCurrentBook={userRatedCurrentBook}
          onOpenRatingModal={handleOpenCurrentBookRatingModal}
          hasMarkedCurrentBookAsDnf={hasMarkedCurrentBookAsDnf}
          userCurrentChapter={userCurrentChapter}
          totalChapters={totalChapters}
          onUpdateProgress={handleUpdateProgress}
          dnfError={dnfError}
          dnfMessage={dnfMessage}
          canMarkCurrentBookAsDnf={canMarkCurrentBookAsDnf}
          dnfLoading={dnfLoading}
          onMarkCurrentBookAsDnf={handleMarkCurrentBookAsDnf}
          newBookData={setCurrentBookForm.newBookData}
          setBookFormErrors={setCurrentBookForm.setBookFormErrors}
          googleBooksLoading={setCurrentBookForm.googleBooksLoading}
          googleBooksError={setCurrentBookForm.googleBooksError}
          googleBookResults={setCurrentBookForm.googleBookResults}
          newBookSuggestionsActive={setCurrentBookForm.newBookSuggestionsActive}
          settingCurrentBook={setCurrentBookForm.settingCurrentBook}
          newBookCoverUploadLoading={setCurrentBookForm.newBookCoverUploadLoading}
          newBookCoverUploadError={setCurrentBookForm.newBookCoverUploadError}
          onSetCurrentBook={setCurrentBookForm.handleSetCurrentBook}
          onCloseSetBookForm={setCurrentBookForm.handleCloseSetBookForm}
          onNewBookChange={setCurrentBookForm.handleNewBookChange}
          onNewBookFieldsFocus={setCurrentBookForm.handleNewBookFieldsFocus}
          onNewBookFieldsBlur={setCurrentBookForm.handleNewBookFieldsBlur}
          onSelectGoogleBook={setCurrentBookForm.handleSelectGoogleBook}
          onNewBookCoverUpload={setCurrentBookForm.handleNewBookCoverUpload}
          onNewBookGenreToggle={setCurrentBookForm.handleNewBookGenreToggle}
          renderGoogleBookSuggestion={renderGoogleBookSuggestion}
          renderDescriptionPreview={renderDescriptionPreview}
        />

        <section
          className={`grid grid-cols-1 gap-10 ${isGuest ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[1fr_340px]'
            }`}
        >
          <DiscussionsSection
            currentBook={currentBook}
            currentBookTitle={currentBookTitle}
            totalChapters={totalChapters}
            isGuest={isGuest}
            isMember={isMember}
            currentUserId={currentUserId}
            userCurrentChapter={userCurrentChapter}
            showAddCommentForm={showAddCommentForm}
            comments={discussionComments}
            commentsLoading={commentsLoading}
            onStartDiscussion={handleStartDiscussion}
            onCancelComment={() => setShowAddCommentForm(false)}
            onCreateComment={handleCreateComment}
            onCreateReply={handleCreateReply}
            onToggleLike={handleToggleLike}
            onDeleteComment={handleDeleteComment}
          />

          {isGuest ? (
            <aside>
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl mb-4">How spoilers work</h2>

                <p className="text-sm text-stone-500 leading-relaxed mb-5">
                  Guests only see spoiler-free discussions. Members can unlock
                  chapter discussions by tracking their personal reading
                  progress.
                </p>

                <div className="bg-cream border border-stone-100 rounded-xl p-4 mb-5">
                  <h3 className="font-serif text-lg mb-2">Guest preview</h3>

                  <p className="text-sm text-stone-500 leading-relaxed">
                    You can explore this club, but surveys, joining, comments,
                    and progress tracking require an account.
                  </p>
                </div>

                <Link
                  to="/register"
                  className="block text-center px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  Create account
                </Link>
              </div>
            </aside>
          ) : (
            <ClubPollsSection
              poll={clubPolls.poll}
              pollLoading={clubPolls.pollLoading}
              pollError={clubPolls.pollError}
              pollMessage={clubPolls.pollMessage}
              pollActionLoading={clubPolls.pollActionLoading}
              isCreator={isCreator}
              canVoteInPoll={canVoteInPoll}
              selectedPollOptionId={clubPolls.selectedPollOptionId}
              showCreatePollForm={clubPolls.showCreatePollForm}
              showAnnounceWinnerForm={clubPolls.showAnnounceWinnerForm}
              onSelectPollOption={clubPolls.setSelectedPollOptionId}
              onVoteInPoll={clubPolls.handleVoteInPoll}
              onRefreshPollResults={clubPolls.handleRefreshPollResults}
              onToggleCreatePollForm={clubPolls.handleToggleCreatePollForm}
              onOpenAnnounceWinnerForm={clubPolls.handleOpenAnnounceWinnerForm}
              onSetWinnerBookAsCurrent={clubPolls.handleSetWinnerBookAsCurrent}
              renderAnnounceWinnerForm={renderAnnounceWinnerForm}
              newPollData={clubPolls.newPollData}
              createPollFormErrors={clubPolls.createPollFormErrors}
              creatingPoll={clubPolls.creatingPoll}
              pollOptionUploadInProgress={clubPolls.pollOptionUploadInProgress}
              activePollBookOptionIndex={clubPolls.activePollBookOptionIndex}
              pollBookSearchResults={clubPolls.pollBookSearchResults}
              pollBookSearchLoading={clubPolls.pollBookSearchLoading}
              pollBookSearchError={clubPolls.pollBookSearchError}
              pollOptionCoverUploadLoading={clubPolls.pollOptionCoverUploadLoading}
              pollOptionCoverUploadError={clubPolls.pollOptionCoverUploadError}
              onCreatePoll={clubPolls.handleCreatePoll}
              onCloseCreatePollForm={clubPolls.handleCloseCreatePollForm}
              onNewPollChange={clubPolls.handleNewPollChange}
              onPollOptionChange={clubPolls.handlePollOptionChange}
              onPollBookFieldsFocus={clubPolls.handlePollBookFieldsFocus}
              onPollBookFieldsBlur={clubPolls.handlePollBookFieldsBlur}
              onSelectPollGoogleBook={clubPolls.handleSelectPollGoogleBook}
              onPollOptionCoverUpload={clubPolls.handlePollOptionCoverUpload}
              onRemovePollOption={clubPolls.handleRemovePollOption}
              onAddPollOption={clubPolls.handleAddPollOption}
              renderGoogleBookSuggestion={renderGoogleBookSuggestion}
              renderDescriptionPreview={renderDescriptionPreview}
            />
          )}
        </section>
        <PreviousBooksSection
          previousBooks={previousBooks}
          user={user}
          isMember={isMember}
          ratingError={ratingError}
          ratingMessage={ratingMessage}
          ratingLoadingId={ratingLoadingId}
          onRatePreviousBook={handleRatePreviousBook}
        />
        <BookRatingModal
          isOpen={showCurrentBookRatingModal}
          bookTitle={
            completedProgressForRating?.book?.title ||
            currentBook?.title ||
            'this book'
          }
          loading={currentBookRatingLoading}
          error={currentBookRatingError}
          onRate={handleRateCurrentBook}
          onClose={handleCloseCurrentBookRatingModal}
        />
      </div>
    </main>
  );
}

export default Club;
