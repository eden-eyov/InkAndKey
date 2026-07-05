import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fetchAllClubs, fetchUserClubs } from '../store/clubsSlice';

import CurrentReadingSection from '../components/CurrentReadingSection';
import DiscussionsSection from '../components/DiscussionsSection';
import PollCard from '../components/PollCard';
import BookRatingModal from '../components/BookRatingModal';
import PreviousBooksSection from '../components/PreviousBooksSection';
import ClubHeaderCard from '../components/ClubHeaderCard';
import CreatePollModal from '../components/CreatePollModal';


import {
  BOOK_SUGGESTION_MIN_QUERY_LENGTH,
  BOOK_SUGGESTION_DEBOUNCE_MS,
  DESCRIPTION_PREVIEW_LENGTH,
  emptySetBookFormErrors,
  emptyCreatePollFormErrors,
  buildBookSuggestionQuery,
  getApiErrorMessage,
  createInitialPollData,
  createEmptyPollOption,
  mapCommentsToDiscussion,
} from '../utils/clubPageUtils';

function Club() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const isGuest = !user;

  const [showSetBookForm, setShowSetBookForm] = useState(false);
  const [showAddCommentForm, setShowAddCommentForm] = useState(false);
  const [discussionComments, setDiscussionComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [showCreatePollForm, setShowCreatePollForm] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const [newPollData, setNewPollData] = useState(createInitialPollData);

  const [pollBookSearchResults, setPollBookSearchResults] = useState({});
  const [pollBookSearchLoading, setPollBookSearchLoading] = useState({});
  const [pollBookSearchError, setPollBookSearchError] = useState({});
  const [activePollBookOptionIndex, setActivePollBookOptionIndex] = useState(null);
  const [suppressedPollBookSearchQueries, setSuppressedPollBookSearchQueries] =
    useState({});
  const [pollOptionCoverUploadLoading, setPollOptionCoverUploadLoading] =
    useState({});
  const [pollOptionCoverUploadError, setPollOptionCoverUploadError] =
    useState({});
  const [createPollFormErrors, setCreatePollFormErrors] = useState(
    emptyCreatePollFormErrors
  );

  const [poll, setPoll] = useState(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState('');
  const [pollMessage, setPollMessage] = useState('');
  const [selectedPollOptionId, setSelectedPollOptionId] = useState('');
  const [pollActionLoading, setPollActionLoading] = useState(false);

  const [showAnnounceWinnerForm, setShowAnnounceWinnerForm] = useState(false);
  const [announcingWinner, setAnnouncingWinner] = useState(false);
  const [winnerData, setWinnerData] = useState({
    optionId: '',
    totalChapters: '',
    title: '',
    author: '',
    coverImage: '',
    description: '',
    genres: [],
  });


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

  const [settingCurrentBook, setSettingCurrentBook] = useState(false);
  const createEmptyNewBookData = () => ({
    title: '',
    author: '',
    totalChapters: '',
    coverImage: '',
    coverImagePublicId: '',
    description: '',
    genres: [],
    googleBooksId: '',
    pageCount: '',
    publishedDate: '',
  });
  const emptyNewBookData = {
    title: '',
    author: '',
    totalChapters: '',
    description: '',
    coverImage: '',
    coverImagePublicId: '',
    genres: [],
    googleBooksId: '',
    pageCount: null,
    publishedDate: '',
    language: '',
    infoLink: '',
  };

  const [newBookData, setNewBookData] = useState(createEmptyNewBookData); const [googleBookResults, setGoogleBookResults] = useState([]);
  const [googleBooksLoading, setGoogleBooksLoading] = useState(false);
  const [googleBooksError, setGoogleBooksError] = useState('');
  const [newBookSuggestionsActive, setNewBookSuggestionsActive] = useState(false);
  const [suppressedNewBookSearchQuery, setSuppressedNewBookSearchQuery] =
    useState('');
  const [setBookFormErrors, setSetBookFormErrors] = useState(
    emptySetBookFormErrors
  );
  const [newBookCoverUploadLoading, setNewBookCoverUploadLoading] =
    useState(false);
  const [newBookCoverUploadError, setNewBookCoverUploadError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageUploadError, setCoverImageUploadError] = useState('');
  const [coverImageUploadMessage, setCoverImageUploadMessage] = useState('');


  const newPollDataRef = useRef(newPollData);
  const newBookDataRef = useRef(newBookData);
  const showCreatePollFormRef = useRef(showCreatePollForm);
  const showSetBookFormRef = useRef(showSetBookForm);
  const createPollFormSessionRef = useRef(0);
  const bookFormSessionRef = useRef(0);

  const refreshClubLists = () => {
    dispatch(fetchAllClubs());

    if (user) {
      dispatch(fetchUserClubs());
    }
  };

  const cleanupUploadedBookCover = async (publicId) => {
    if (!publicId) return;

    try {
      await api.delete('/uploads/image', {
        data: { publicId },
      });
    } catch (err) {
      console.log('BOOK COVER CLEANUP ERROR:', err.response?.data || err);
    }
  };

  const resetPollUploadState = () => {
    setPollOptionCoverUploadLoading({});
    setPollOptionCoverUploadError({});
  };

  const cleanupPollOptionUploads = async (
    options = newPollDataRef.current.options
  ) => {
    const publicIds = [...new Set(options
      .map((option) => option.coverImagePublicId)
      .filter(Boolean))];

    await Promise.all(publicIds.map((publicId) => cleanupUploadedBookCover(publicId)));
  };

  const clearPollOptionUploadState = (optionClientId) => {
    if (!optionClientId) return;

    setPollOptionCoverUploadLoading((prev) => {
      const next = { ...prev };
      delete next[optionClientId];
      return next;
    });

    setPollOptionCoverUploadError((prev) => {
      const next = { ...prev };
      delete next[optionClientId];
      return next;
    });
  };

  useEffect(() => {
    newPollDataRef.current = newPollData;
  }, [newPollData]);

  useEffect(() => {
    newBookDataRef.current = newBookData;
  }, [newBookData]);

  useEffect(() => {
    showCreatePollFormRef.current = showCreatePollForm;
  }, [showCreatePollForm]);

  useEffect(() => {
    showSetBookFormRef.current = showSetBookForm;
  }, [showSetBookForm]);

  useEffect(() => {
    return () => {
      if (showSetBookFormRef.current && newBookDataRef.current.coverImagePublicId) {
        void cleanupUploadedBookCover(newBookDataRef.current.coverImagePublicId);
      }

      if (showCreatePollFormRef.current) {
        void cleanupPollOptionUploads(newPollDataRef.current.options);
      }
    };
  }, []);

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

        const clubCreatorId = clubData.creator?._id || clubData.creator;

        const userIsCreator =
          Boolean(currentUserId) &&
          Boolean(clubCreatorId) &&
          clubCreatorId.toString() === currentUserId?.toString();

        if (clubData.currentBook?._id) {
          await fetchComments(clubData.currentBook._id, !user || !userIsMember);
        }

        if (user) {
          await fetchClubPolls(false);
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

  useEffect(() => {
    if (!showCreatePollForm || activePollBookOptionIndex === null) {
      return;
    }

    const option = newPollData.options[activePollBookOptionIndex];
    const query = buildBookSuggestionQuery(option);
    const suppressedQuery =
      suppressedPollBookSearchQueries[activePollBookOptionIndex] || '';

    if (
      query.length < BOOK_SUGGESTION_MIN_QUERY_LENGTH ||
      query === suppressedQuery
    ) {
      setPollBookSearchResults((prev) => ({
        ...prev,
        [activePollBookOptionIndex]: [],
      }));
      setPollBookSearchError((prev) => ({
        ...prev,
        [activePollBookOptionIndex]: '',
      }));
      setPollBookSearchLoading((prev) => ({
        ...prev,
        [activePollBookOptionIndex]: false,
      }));
      return;
    }

    let isCurrent = true;

    const timer = setTimeout(async () => {
      try {
        setPollBookSearchLoading((prev) => ({
          ...prev,
          [activePollBookOptionIndex]: true,
        }));
        setPollBookSearchError((prev) => ({
          ...prev,
          [activePollBookOptionIndex]: '',
        }));

        const { data } = await api.get('/books/google-search', {
          params: { query },
        });

        if (!isCurrent) return;

        setPollBookSearchResults((prev) => ({
          ...prev,
          [activePollBookOptionIndex]: data.data || [],
        }));
      } catch (err) {
        if (!isCurrent) return;

        console.log('POLL GOOGLE BOOKS SEARCH ERROR:', err.response?.data || err);

        setPollBookSearchError((prev) => ({
          ...prev,
          [activePollBookOptionIndex]:
            err.response?.data?.message ||
            'Failed to search Google Books.',
        }));
      } finally {
        if (isCurrent) {
          setPollBookSearchLoading((prev) => ({
            ...prev,
            [activePollBookOptionIndex]: false,
          }));
        }
      }
    }, BOOK_SUGGESTION_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [
    activePollBookOptionIndex,
    newPollData.options,
    showCreatePollForm,
    suppressedPollBookSearchQueries,
  ]);

  useEffect(() => {
    if (showCreatePollForm) return;

    setActivePollBookOptionIndex(null);
    setPollBookSearchResults({});
    setPollBookSearchLoading({});
    setPollBookSearchError({});
    setCreatePollFormErrors(emptyCreatePollFormErrors);
  }, [showCreatePollForm]);

  useEffect(() => {
    if (!showSetBookForm || !newBookSuggestionsActive) {
      return;
    }

    const query = buildBookSuggestionQuery(newBookData);

    if (
      query.length < BOOK_SUGGESTION_MIN_QUERY_LENGTH ||
      query === suppressedNewBookSearchQuery
    ) {
      setGoogleBookResults([]);
      setGoogleBooksError('');
      setGoogleBooksLoading(false);
      return;
    }

    let isCurrent = true;

    const timer = setTimeout(async () => {
      try {
        setGoogleBooksLoading(true);
        setGoogleBooksError('');

        const { data } = await api.get('/books/google-search', {
          params: { query },
        });

        if (!isCurrent) return;

        setGoogleBookResults(data.data || []);
      } catch (err) {
        if (!isCurrent) return;

        console.log('GOOGLE BOOKS SEARCH ERROR:', err.response?.data || err);

        setGoogleBooksError(
          err.response?.data?.message ||
          'Failed to search Google Books. Please try again.'
        );
      } finally {
        if (isCurrent) {
          setGoogleBooksLoading(false);
        }
      }
    }, BOOK_SUGGESTION_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [
    newBookData.author,
    newBookData.title,
    newBookSuggestionsActive,
    showSetBookForm,
    suppressedNewBookSearchQuery,
  ]);

  useEffect(() => {
    if (showSetBookForm) return;

    setNewBookSuggestionsActive(false);
    setSuppressedNewBookSearchQuery('');
    setGoogleBookResults([]);
    setGoogleBooksError('');
    setGoogleBooksLoading(false);
    setSetBookFormErrors(emptySetBookFormErrors);
  }, [showSetBookForm]);

  // TEMPORARY DESIGN TEST ONLY:
  // These demo threads are used only while the backend is not ready.
  // SERVER TODO:
  // When the backend is ready, threads should come from an endpoint like:
  // GET /clubs/:clubId/threads
  //
  // For logged-in users:
  // The backend should return threads according to the user's reading progress.
  //
  // For guests:
  // The backend should return only spoiler-free threads/reviews.

  const fetchComments = async (bookId, shouldUsePublicRoute = false) => {
    if (!bookId) return;

    try {
      setCommentsLoading(true);

      const endpoint = shouldUsePublicRoute ? '/comments/public' : '/comments';

      const { data } = await api.get(endpoint, {
        params: {
          club: clubId,
          book: bookId,
        },
      });

      setDiscussionComments(mapCommentsToDiscussion(data.data || []));
    } catch (err) {
      console.log('FETCH COMMENTS ERROR:', err.response?.data || err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchClubPolls = async (showLoading = true) => {
    if (!user) return;

    try {
      if (showLoading) {
        setPollLoading(true);
      }

      setPollError('');

      const { data } = await api.get(`/clubs/${clubId}/polls`);

      const polls = data.data || [];

      const visiblePoll =
        polls.find((item) => item.status === 'open') ||
        polls.find((item) => item.winnerBook && !item.appliedAt) ||
        polls.find((item) => item.status === 'closed' && !item.winnerBook) ||
        null;

      setPoll(visiblePoll);

      if (visiblePoll?.userVoteOptionId) {
        setSelectedPollOptionId(visiblePoll.userVoteOptionId);
      } else {
        setSelectedPollOptionId('');
      }
    } catch (err) {
      console.log('FETCH POLLS ERROR:', err.response?.data || err);

      setPoll(null);

      if (err.response?.status !== 404 && err.response?.status !== 403) {
        setPollError(
          err.response?.data?.message ||
          'Failed to load poll. Please try again.'
        );
      }
    } finally {
      if (showLoading) {
        setPollLoading(false);
      }
    }
  };

  const handleVoteInPoll = async () => {
    if (!poll || !selectedPollOptionId || !canVoteInPoll) return;

    try {
      setPollActionLoading(true);
      setPollError('');
      setPollMessage('');

      const { data } = await api.post(
        `/clubs/${clubId}/polls/${poll._id}/vote`,
        {
          optionId: selectedPollOptionId,
        }
      );

      setPoll(data.data);
      setPollMessage('Your vote was submitted.');
    } catch (err) {
      console.log('VOTE IN POLL ERROR:', err.response?.data || err);

      setPollError(
        err.response?.data?.message ||
        'Failed to submit your vote. Please try again.'
      );
    } finally {
      setPollActionLoading(false);
    }
  };

  const handleRefreshPollResults = async () => {
    setPollMessage('');
    await fetchClubPolls(true);
  };

  const handleOpenAnnounceWinnerForm = () => {
    if (!poll || !isCreator) return;

    const leadingOption = [...poll.options].sort(
      (firstOption, secondOption) =>
        secondOption.votesCount - firstOption.votesCount
    )[0];

    setWinnerData({
      optionId: leadingOption?.optionId || '',
      totalChapters: '',
      title: leadingOption?.title || '',
      author: leadingOption?.author || '',
      coverImage: leadingOption?.coverImage || '',
      description: leadingOption?.description || '',
      genres: [],
    });

    setShowAnnounceWinnerForm((prev) => !prev);
  };

  const handleWinnerDataChange = (e) => {
    const { name, value } = e.target;

    setWinnerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAnnounceWinner = async (e) => {
    e.preventDefault();

    if (!poll || !isCreator) return;

    const totalChapters = Number(winnerData.totalChapters);

    if (!winnerData.optionId) {
      setPollError('Please choose a winning option.');
      return;
    }

    if (!totalChapters || totalChapters < 1) {
      setPollError('Please enter a valid number of chapters.');
      return;
    }

    try {
      setAnnouncingWinner(true);
      setPollError('');
      setPollMessage('');

      const payload = {
        optionId: winnerData.optionId,
        totalChapters,
      };

      if (winnerData.title.trim()) {
        payload.title = winnerData.title.trim();
      }

      if (winnerData.author.trim()) {
        payload.author = winnerData.author.trim();
      }

      if (winnerData.coverImage.trim()) {
        payload.coverImage = winnerData.coverImage.trim();
      }

      if (winnerData.description.trim()) {
        payload.description = winnerData.description.trim();
      }

      const { data } = await api.post(
        `/clubs/${clubId}/polls/${poll._id}/announce-winner`,
        payload
      );

      setPoll({
        ...data.data.poll,
        winnerBook: data.data.winnerBook,
      });
      setPollMessage('The next book has been chosen.');
      setShowAnnounceWinnerForm(false);

      setWinnerData({
        optionId: '',
        totalChapters: '',
        title: '',
        author: '',
        coverImage: '',
        description: '',
        genres: [],
      });
    } catch (err) {
      console.log('ANNOUNCE WINNER ERROR:', err.response?.data || err);

      setPollError(
        err.response?.data?.message ||
        'Failed to announce winner. Please try again.'
      );
    } finally {
      setAnnouncingWinner(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();

    if (!club || !user) return;

    const currentUserId = user?.id || user?._id;
    const creatorId = club.creator?._id || club.creator;

    const userIsCreator =
      Boolean(currentUserId) &&
      Boolean(creatorId) &&
      creatorId.toString() === currentUserId.toString();

    if (!userIsCreator) return;

    if (Object.values(pollOptionCoverUploadLoading).some(Boolean)) {
      setCreatePollFormErrors((prev) => ({
        ...prev,
        general: 'Please wait for cover uploads to finish before creating the poll.',
      }));
      return;
    }

    const nextFormErrors = { ...emptyCreatePollFormErrors };
    const validOptions = newPollData.options
      .map((option) => ({
        title: option.title.trim(),
        author: option.author.trim(),
        coverImage: option.coverImage.trim(),
        coverImagePublicId: option.coverImagePublicId || '',
        description: option.description.trim(),
      }))
      .filter((option) => option.title);

    if (validOptions.length < 2) {
      nextFormErrors.options = 'Please add at least two book options.';
    }

    if (!newPollData.closesAt) {
      nextFormErrors.closesAt = 'Please choose a closing date for the poll.';
    }

    if (nextFormErrors.options || nextFormErrors.closesAt) {
      setCreatePollFormErrors(nextFormErrors);
      return;
    }

    try {
      setCreatingPoll(true);
      setCreatePollFormErrors(emptyCreatePollFormErrors);
      setPollMessage('');

      const { data } = await api.post(`/clubs/${clubId}/polls`, {
        question: newPollData.question.trim() || 'What should we read next?',
        closesAt: newPollData.closesAt,
        options: validOptions,
      });

      setPoll(data.data);
      setPollMessage('Poll created successfully.');
      createPollFormSessionRef.current += 1;
      showCreatePollFormRef.current = false;
      setShowCreatePollForm(false);

      const resetPollData = createInitialPollData();
      newPollDataRef.current = resetPollData;
      setNewPollData(resetPollData);
      setPollBookSearchResults({});
      setPollBookSearchError({});
      setPollBookSearchLoading({});
      setSuppressedPollBookSearchQueries({});
      setActivePollBookOptionIndex(null);
      resetPollUploadState();
    } catch (err) {
      console.log('CREATE POLL ERROR:', err.response?.data || err);

      const errorMessage = getApiErrorMessage(
        err,
        'Failed to create poll. Please try again.'
      );
      const serverErrors = {
        ...emptyCreatePollFormErrors,
        general: errorMessage,
      };

      if (/closing|closes|date/i.test(errorMessage)) {
        serverErrors.closesAt = errorMessage;
      }

      if (/option|title|book|description/i.test(errorMessage)) {
        serverErrors.options = errorMessage;
      }

      setCreatePollFormErrors(serverErrors);
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleNewPollChange = (e) => {
    const { name, value } = e.target;

    setCreatePollFormErrors((prev) => ({
      ...prev,
      general: '',
      [name]: '',
    }));

    setNewPollData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePollOptionChange = (index, field, value) => {
    const currentOption = newPollData.options[index];
    const optionClientId = currentOption?._clientId || index;

    if (field === 'title' || field === 'author') {
      setActivePollBookOptionIndex(index);
      setSuppressedPollBookSearchQueries((prev) => ({
        ...prev,
        [index]: '',
      }));
    }

    const shouldClearUploadedCover =
      field === 'coverImage' &&
      currentOption?.coverImagePublicId &&
      value !== currentOption.coverImage;

    if (shouldClearUploadedCover) {
      void cleanupUploadedBookCover(currentOption.coverImagePublicId);
    }

    if (field === 'coverImage') {
      setPollOptionCoverUploadError((prev) => ({
        ...prev,
        [optionClientId]: '',
      }));
    }

    setCreatePollFormErrors((prev) => ({
      ...prev,
      general: '',
      options: '',
    }));

    setNewPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
            ...option,
            [field]: value,
            ...(shouldClearUploadedCover ? { coverImagePublicId: '' } : {}),
          }
          : option
      ),
    }));
  };

  const handleSelectPollGoogleBook = (index, book) => {
    const selectedQuery = buildBookSuggestionQuery(book);
    const optionClientId = newPollData.options[index]?._clientId || index;
    const previousPublicId = newPollData.options[index]?.coverImagePublicId;

    if (previousPublicId) {
      void cleanupUploadedBookCover(previousPublicId);
    }

    setNewPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
            ...option,
            title: book.title || '',
            author: book.author || '',
            coverImage: book.coverImage || '',
            coverImagePublicId: '',
            description: book.description || '',
          }
          : option
      ),
    }));

    setSuppressedPollBookSearchQueries((prev) => ({
      ...prev,
      [index]: selectedQuery,
    }));
    setActivePollBookOptionIndex(null);
    setPollBookSearchResults((prev) => ({
      ...prev,
      [index]: [],
    }));

    setPollBookSearchError((prev) => ({
      ...prev,
      [index]: '',
    }));
    setPollOptionCoverUploadError((prev) => ({
      ...prev,
      [optionClientId]: '',
    }));
    setCreatePollFormErrors((prev) => ({
      ...prev,
      general: '',
      options: '',
    }));
  };

  const handleAddPollOption = () => {
    setNewPollData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        createEmptyPollOption(),
      ],
    }));
    setCreatePollFormErrors((prev) => ({
      ...prev,
      general: '',
      options: '',
    }));
  };

  const handleRemovePollOption = (index) => {
    if (newPollData.options.length <= 2) {
      return;
    }

    const optionToRemove = newPollData.options[index];
    const optionClientId = optionToRemove?._clientId;

    if (optionToRemove?.coverImagePublicId) {
      void cleanupUploadedBookCover(optionToRemove.coverImagePublicId);
    }

    setNewPollData((prev) => {
      if (prev.options.length <= 2) {
        return prev;
      }

      return {
        ...prev,
        options: prev.options.filter((_, optionIndex) => optionIndex !== index),
      };
    });
    setActivePollBookOptionIndex(null);
    setPollBookSearchResults({});
    setPollBookSearchLoading({});
    setPollBookSearchError({});
    setSuppressedPollBookSearchQueries({});
    clearPollOptionUploadState(optionClientId);
  };

  const handlePollBookFieldsFocus = (index) => {
    setActivePollBookOptionIndex(index);
  };

  const handlePollBookFieldsBlur = (e, index) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }

    setActivePollBookOptionIndex((prev) => (prev === index ? null : prev));
  };

  const handleNewBookFieldsBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }

    setNewBookSuggestionsActive(false);
  };

  const handlePollOptionCoverUpload = async (index, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const optionAtUploadStart = newPollData.options[index];

    if (!optionAtUploadStart?._clientId) return;

    const optionClientId = optionAtUploadStart._clientId;
    const uploadSession = createPollFormSessionRef.current;
    const previousCoverImage = optionAtUploadStart.coverImage || '';
    const previousPublicId = optionAtUploadStart.coverImagePublicId || '';
    const formData = new FormData();
    formData.append('image', file);

    try {
      setPollOptionCoverUploadLoading((prev) => ({
        ...prev,
        [optionClientId]: true,
      }));
      setPollOptionCoverUploadError((prev) => ({
        ...prev,
        [optionClientId]: '',
      }));

      const { data } = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedImage = data.data;
      const latestOption = newPollDataRef.current.options.find(
        (option) => option._clientId === optionClientId
      );
      const uploadCanStillApply =
        showCreatePollFormRef.current &&
        uploadSession === createPollFormSessionRef.current &&
        latestOption &&
        (latestOption.coverImage || '') === previousCoverImage &&
        (latestOption.coverImagePublicId || '') === previousPublicId;

      if (!uploadCanStillApply) {
        if (uploadedImage.publicId) {
          await cleanupUploadedBookCover(uploadedImage.publicId);
        }

        return;
      }

      setNewPollData((prev) => ({
        ...prev,
        options: prev.options.map((option) =>
          option._clientId === optionClientId
            ? {
              ...option,
              coverImage: uploadedImage.url || '',
              coverImagePublicId: uploadedImage.publicId || '',
            }
            : option
        ),
      }));

      if (
        previousPublicId &&
        previousPublicId !== uploadedImage.publicId
      ) {
        void cleanupUploadedBookCover(previousPublicId);
      }
    } catch (err) {
      console.log('POLL OPTION COVER UPLOAD ERROR:', err.response?.data || err);

      setPollOptionCoverUploadError((prev) => ({
        ...prev,
        [optionClientId]:
          err.response?.data?.message ||
          'Failed to upload cover image. Please try again.',
      }));
    } finally {
      setPollOptionCoverUploadLoading((prev) => ({
        ...prev,
        [optionClientId]: false,
      }));
    }
  };

  const handleNewBookCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const uploadSession = bookFormSessionRef.current;
    const previousCoverImage = newBookData.coverImage || '';
    const previousPublicId = newBookData.coverImagePublicId || '';
    const formData = new FormData();
    formData.append('image', file);

    try {
      setNewBookCoverUploadLoading(true);
      setNewBookCoverUploadError('');

      const { data } = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedImage = data.data;
      const latestBookData = newBookDataRef.current;
      const uploadCanStillApply =
        showSetBookFormRef.current &&
        uploadSession === bookFormSessionRef.current &&
        (latestBookData.coverImage || '') === previousCoverImage &&
        (latestBookData.coverImagePublicId || '') === previousPublicId;

      if (!uploadCanStillApply) {
        if (uploadedImage.publicId) {
          await cleanupUploadedBookCover(uploadedImage.publicId);
        }

        return;
      }

      setNewBookData((prev) => ({
        ...prev,
        coverImage: uploadedImage.url || '',
        coverImagePublicId: uploadedImage.publicId || '',
      }));

      if (
        previousPublicId &&
        previousPublicId !== uploadedImage.publicId
      ) {
        void cleanupUploadedBookCover(previousPublicId);
      }
    } catch (err) {
      console.log('NEW BOOK COVER UPLOAD ERROR:', err.response?.data || err);

      setNewBookCoverUploadError(
        err.response?.data?.message ||
        'Failed to upload cover image. Please try again.'
      );
    } finally {
      setNewBookCoverUploadLoading(false);
    }
  };

  const handleCloseCreatePollForm = async () => {
    createPollFormSessionRef.current += 1;
    showCreatePollFormRef.current = false;
    await cleanupPollOptionUploads(newPollDataRef.current.options);

    const resetPollData = createInitialPollData();
    newPollDataRef.current = resetPollData;
    setNewPollData(resetPollData);
    setActivePollBookOptionIndex(null);
    setPollBookSearchResults({});
    setPollBookSearchLoading({});
    setPollBookSearchError({});
    setSuppressedPollBookSearchQueries({});
    setCreatePollFormErrors(emptyCreatePollFormErrors);
    resetPollUploadState();
    setShowCreatePollForm(false);
  };

  const handleToggleCreatePollForm = async () => {
    if (showCreatePollForm) {
      await handleCloseCreatePollForm();
      return;
    }

    createPollFormSessionRef.current += 1;
    showCreatePollFormRef.current = true;
    setShowCreatePollForm(true);
  };

  const handleCloseSetBookForm = () => {
    setShowSetBookForm(false);

    setNewBookData(createEmptyNewBookData());
    setSetBookFormErrors(emptySetBookFormErrors);

    setGoogleBookResults([]);
    setGoogleBooksError('');
    setNewBookSuggestionsActive(false);

    setNewBookCoverUploadError('');
  };

  const handleToggleSetBookForm = async () => {
    if (showSetBookForm) {
      await handleCloseSetBookForm();
      return;
    }

    bookFormSessionRef.current += 1;
    showSetBookFormRef.current = true;
    setShowSetBookForm(true);
  };

  const handleSetWinnerBookAsCurrent = async () => {
    if (!poll || !club || !user) return;

    const currentUserId = user?.id || user?._id;
    const creatorId = club.creator?._id || club.creator;

    const userIsCreator =
      Boolean(currentUserId) &&
      Boolean(creatorId) &&
      creatorId.toString() === currentUserId.toString();

    if (!userIsCreator) return;

    try {
      setPollActionLoading(true);
      setPollError('');
      setPollMessage('');

      const { data } = await api.patch(
        `/clubs/${clubId}/polls/${poll._id}/set-winner-current`
      );

      const updatedClub = data.data.club;
      const updatedPoll = data.data.poll;

      setClub({
        ...updatedClub,
        userCurrentChapter: 0,
      });

      setPoll(updatedPoll);
      setPollMessage('The winning book is now the current book.');

      setDiscussionComments([]);

      if (updatedClub.currentBook?._id) {
        await fetchComments(updatedClub.currentBook._id, false);
      }

      refreshClubLists();
    } catch (err) {
      console.log(
        'SET WINNER BOOK AS CURRENT ERROR:',
        err.response?.data || err
      );

      setPollError(
        err.response?.data?.message ||
        'Failed to set winner book as current book. Please try again.'
      );
    } finally {
      setPollActionLoading(false);
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

  const handleNewBookChange = (e) => {
    const { name, value } = e.target;

    if (name === 'title' || name === 'author') {
      setNewBookSuggestionsActive(true);
      setSuppressedNewBookSearchQuery('');
    }

    const shouldClearUploadedCover =
      name === 'coverImage' &&
      newBookData.coverImagePublicId &&
      value !== newBookData.coverImage;

    if (shouldClearUploadedCover) {
      void cleanupUploadedBookCover(newBookData.coverImagePublicId);
    }

    if (name === 'coverImage') {
      setNewBookCoverUploadError('');
    }

    setSetBookFormErrors((prev) => ({
      ...prev,
      general: '',
      [name]: '',
    }));

    setNewBookData((prev) => ({
      ...prev,
      [name]: value,
      ...(shouldClearUploadedCover ? { coverImagePublicId: '' } : {}),
    }));
  };

  const handleNewBookGenreToggle = (genre) => {
    setNewBookData((prev) => {
      const alreadySelected = prev.genres.includes(genre);

      return {
        ...prev,
        genres: alreadySelected
          ? prev.genres.filter((item) => item !== genre)
          : [...prev.genres, genre],
      };
    });
  };

  const handleSelectGoogleBook = (book) => {
    const selectedQuery = buildBookSuggestionQuery(book);
    const previousPublicId = newBookData.coverImagePublicId;

    if (previousPublicId) {
      void cleanupUploadedBookCover(previousPublicId);
    }

    setNewBookData((prev) => ({
      ...prev,
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      coverImage: book.coverImage || '',
      coverImagePublicId: '',
      googleBooksId: book.googleBooksId || '',
      pageCount: book.pageCount || null,
      publishedDate: book.publishedDate || '',
      language: book.language || '',
      infoLink: book.infoLink || '',
    }));

    setSuppressedNewBookSearchQuery(selectedQuery);
    setNewBookSuggestionsActive(false);
    setGoogleBookResults([]);
    setGoogleBooksError('');
    setNewBookCoverUploadError('');
    setSetBookFormErrors((prev) => ({
      ...prev,
      general: '',
      title: '',
      author: '',
    }));
  };

  const handleSetCurrentBook = async (e) => {
    e.preventDefault();

    if (!isCreator) return;

    if (newBookCoverUploadLoading) {
      setNewBookCoverUploadError(
        'Please wait for the cover upload to finish before saving.'
      );
      return;
    }

    const title = newBookData.title.trim();
    const author = newBookData.author.trim();
    const totalChapters = Number(newBookData.totalChapters);
    const nextErrors = { ...emptySetBookFormErrors };

    if (!title) {
      nextErrors.title = 'Book title is required.';
    }

    if (!author) {
      nextErrors.author = 'Author is required.';
    }

    if (!Number.isInteger(totalChapters) || totalChapters < 1) {
      nextErrors.totalChapters =
        'Total chapters is required and must be at least 1.';
    }

    if (
      nextErrors.title ||
      nextErrors.author ||
      nextErrors.totalChapters
    ) {
      setSetBookFormErrors(nextErrors);
      return;
    }

    try {
      setSettingCurrentBook(true);
      setSetBookFormErrors(emptySetBookFormErrors);

      const createBookResponse = await api.post('/books', {
        title,
        author,
        totalChapters,
        description: newBookData.description.trim(),
        coverImage: newBookData.coverImage.trim(),
        coverImagePublicId: newBookData.coverImagePublicId,
        genres: newBookData.genres,
        googleBooksId: newBookData.googleBooksId,
        pageCount: newBookData.pageCount,
        publishedDate: newBookData.publishedDate,
        language: newBookData.language,
        infoLink: newBookData.infoLink,
        club: clubId,
      });

      const createdBook = createBookResponse.data.data;

      const setCurrentBookResponse = await api.patch(
        `/clubs/${clubId}/current-book`,
        {
          book: createdBook._id,
        }
      );

      const updatedClub = setCurrentBookResponse.data.data;

      setClub({
        ...updatedClub,
        userCurrentChapter: 0,
      });

      setThreads([]);

      if (updatedClub.currentBook?._id) {
        await fetchComments(updatedClub.currentBook._id, false);
      }

      refreshClubLists();

      bookFormSessionRef.current += 1;
      showSetBookFormRef.current = false;
      newBookDataRef.current = emptyNewBookData;
      setNewBookData(emptyNewBookData);
      setGoogleBookResults([]);
      setGoogleBooksError('');
      setSuppressedNewBookSearchQuery('');
      setNewBookSuggestionsActive(false);
      setSetBookFormErrors(emptySetBookFormErrors);
      setNewBookCoverUploadError('');
      setNewBookCoverUploadLoading(false);

      setShowSetBookForm(false);
    } catch (err) {
      console.log('SET NEW CURRENT BOOK ERROR:', err.response?.data || err);

      const errorMessage = getApiErrorMessage(
        err,
        'Failed to create and set current book. Please try again.'
      );
      const serverErrors = {
        ...emptySetBookFormErrors,
        general: errorMessage,
      };

      if (/title/i.test(errorMessage)) {
        serverErrors.title = 'Book title is required.';
      }

      if (/author/i.test(errorMessage)) {
        serverErrors.author = 'Author is required.';
      }

      if (/chapter/i.test(errorMessage)) {
        serverErrors.totalChapters =
          'Total chapters is required and must be at least 1.';
      }

      setSetBookFormErrors(serverErrors);
    } finally {
      setSettingCurrentBook(false);
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

  const handleCreateReply = async (comment, replyText) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        text: replyText,
        chapterNumber: comment.chapterNumber,
        isSpoilerFreeReview: comment.spoilerFree,
        parentComment: comment._id,
      });

      await fetchComments(currentBook._id, false);
    } catch (err) {
      console.log('CREATE REPLY ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to publish reply. Please try again.'
      );
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post(`/comments/${commentId}/like`);

      await fetchComments(currentBook._id, false);
    } catch (err) {
      console.log('TOGGLE LIKE ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to update like. Please try again.'
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
  const currentBookAuthor = currentBook?.author || '';
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
  const hasClubCoverImage = Boolean(displayedClubCoverImage);
  const canVoteInPoll = isMember || isCreator;
  const pollOptionUploadInProgress = Object.values(
    pollOptionCoverUploadLoading
  ).some(Boolean);

  const renderAnnounceWinnerForm = () => {
    if (!poll) return null;

    return (
      <form
        onSubmit={handleAnnounceWinner}
        className="bg-cream border border-stone-100 rounded-xl p-4 space-y-4"
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
            Winning option
          </label>

          <select
            name="optionId"
            value={winnerData.optionId}
            onChange={handleWinnerDataChange}
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          >
            <option value="">Choose winner</option>

            {(poll.options || []).map((option) => (
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
            value={winnerData.totalChapters}
            onChange={handleWinnerDataChange}
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
            value={winnerData.title}
            onChange={handleWinnerDataChange}
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
            value={winnerData.author}
            onChange={handleWinnerDataChange}
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
            value={winnerData.coverImage}
            onChange={handleWinnerDataChange}
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
            value={winnerData.description}
            onChange={handleWinnerDataChange}
            rows="3"
            placeholder="Optional"
            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={announcingWinner}
          className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {announcingWinner ? 'Announcing...' : 'Confirm winner'}
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
          showSetBookForm={showSetBookForm}
          onToggleSetBookForm={handleToggleSetBookForm}
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
          newBookData={newBookData}
          setBookFormErrors={setBookFormErrors}
          googleBooksLoading={googleBooksLoading}
          googleBooksError={googleBooksError}
          googleBookResults={googleBookResults}
          newBookSuggestionsActive={newBookSuggestionsActive}
          settingCurrentBook={settingCurrentBook}
          newBookCoverUploadLoading={newBookCoverUploadLoading}
          newBookCoverUploadError={newBookCoverUploadError}
          onSetCurrentBook={handleSetCurrentBook}
          onCloseSetBookForm={handleCloseSetBookForm}
          onNewBookChange={handleNewBookChange}
          onNewBookFieldsFocus={() => setNewBookSuggestionsActive(true)}
          onNewBookFieldsBlur={handleNewBookFieldsBlur}
          onSelectGoogleBook={handleSelectGoogleBook}
          onNewBookCoverUpload={handleNewBookCoverUpload}
          onNewBookGenreToggle={handleNewBookGenreToggle}
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
            userCurrentChapter={userCurrentChapter}
            showAddCommentForm={showAddCommentForm}
            comments={discussionComments}
            commentsLoading={commentsLoading}
            onStartDiscussion={handleStartDiscussion}
            onCancelComment={() => setShowAddCommentForm(false)}
            onCreateComment={handleCreateComment}
            onCreateReply={handleCreateReply}
            onToggleLike={handleToggleLike}
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
            <aside>
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl mb-4">Next Read Poll</h2>

                {pollLoading ? (
                  <div className="text-center bg-cream p-6 rounded-xl border border-stone-100">
                    <p className="text-xs text-stone-500 italic">Loading poll...</p>
                  </div>
                ) : poll ? (
                  <PollCard
                    poll={poll}
                    canVote={canVoteInPoll}
                    selectedOptionId={selectedPollOptionId}
                    onSelectOption={setSelectedPollOptionId}
                    onVote={handleVoteInPoll}
                    voteLoading={pollActionLoading}
                    error={pollError}
                    message={pollMessage}
                    onRefresh={handleRefreshPollResults}
                    refreshLoading={pollLoading}
                    canAnnounceWinner={isCreator}
                    showAnnounceWinnerForm={showAnnounceWinnerForm}
                    onToggleAnnounceWinnerForm={handleOpenAnnounceWinnerForm}
                    renderAnnounceWinnerForm={renderAnnounceWinnerForm}
                    onSetWinnerAsCurrent={
                      isCreator && !poll.appliedAt
                        ? handleSetWinnerBookAsCurrent
                        : undefined
                    }
                    setWinnerLoading={pollActionLoading}
                  />
                ) : (
                  <div className="bg-cream p-6 rounded-xl border border-stone-100">
                    <div className="text-center">
                      <h4 className="font-serif text-lg text-ink mb-2 italic">
                        No active poll
                      </h4>

                      <p className="text-xs text-stone-500 leading-relaxed">
                        There is currently no open vote in this club.
                      </p>
                    </div>

                    {isCreator && (
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={handleToggleCreatePollForm}
                          className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                        >
                          {showCreatePollForm ? 'Close poll form' : 'Create next read poll'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-stone-100">
                  <h3 className="font-serif text-lg mb-2">Club rules</h3>

                  <ul className="space-y-3 text-sm text-stone-500 leading-relaxed">
                    <li>Tag every discussion with the correct chapter.</li>
                    <li>Mark full-book thoughts as spoiler-free when possible.</li>
                    <li>Be kind, curious, and careful with spoilers.</li>
                  </ul>
                </div>
              </div>
            </aside>
          )}
        </section>
        <CreatePollModal
          isOpen={isCreator && showCreatePollForm}
          newPollData={newPollData}
          createPollFormErrors={createPollFormErrors}
          creatingPoll={creatingPoll}
          pollOptionUploadInProgress={pollOptionUploadInProgress}
          activePollBookOptionIndex={activePollBookOptionIndex}
          pollBookSearchResults={pollBookSearchResults}
          pollBookSearchLoading={pollBookSearchLoading}
          pollBookSearchError={pollBookSearchError}
          pollOptionCoverUploadLoading={pollOptionCoverUploadLoading}
          pollOptionCoverUploadError={pollOptionCoverUploadError}
          onSubmit={handleCreatePoll}
          onClose={handleCloseCreatePollForm}
          onNewPollChange={handleNewPollChange}
          onPollOptionChange={handlePollOptionChange}
          onPollBookFieldsFocus={handlePollBookFieldsFocus}
          onPollBookFieldsBlur={handlePollBookFieldsBlur}
          onSelectPollGoogleBook={handleSelectPollGoogleBook}
          onPollOptionCoverUpload={handlePollOptionCoverUpload}
          onRemovePollOption={handleRemovePollOption}
          onAddPollOption={handleAddPollOption}
          renderGoogleBookSuggestion={renderGoogleBookSuggestion}
          renderDescriptionPreview={renderDescriptionPreview}
        />
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
