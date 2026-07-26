import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

import {
  BOOK_SUGGESTION_MIN_QUERY_LENGTH,
  BOOK_SUGGESTION_DEBOUNCE_MS,
  emptyCreatePollFormErrors,
  buildBookSuggestionQuery,
  getApiErrorMessage,
  createInitialPollData,
  createEmptyPollOption,
} from '../utils/clubPageUtils';

function useClubPolls({
  clubId,
  club,
  user,
  onClubUpdated,
  onCommentsReset,
  onCommentsRefresh,
  onClubListsRefresh,
}) {
  const [showCreatePollForm, setShowCreatePollForm] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const [newPollData, setNewPollData] = useState(createInitialPollData);

  const [pollBookSearchResults, setPollBookSearchResults] = useState({});
  const [pollBookSearchLoading, setPollBookSearchLoading] = useState({});
  const [pollBookSearchError, setPollBookSearchError] = useState({});
  const [activePollBookOptionIndex, setActivePollBookOptionIndex] =
    useState(null);
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

  const newPollDataRef = useRef(newPollData);
  const showCreatePollFormRef = useRef(showCreatePollForm);
  const createPollFormSessionRef = useRef(0);

  const currentUserId = user?.id || user?._id;
  const creatorId = club?.creator?._id || club?.creator;

  const isCreator =
    Boolean(currentUserId) &&
    Boolean(creatorId) &&
    creatorId.toString() === currentUserId.toString();

  const isMember = club?.members?.some((member) => {
    const memberId = member._id || member;
    return memberId?.toString() === currentUserId?.toString();
  });

  const canVoteInPoll = Boolean(isMember || isCreator);

  const pollOptionUploadInProgress = Object.values(
    pollOptionCoverUploadLoading
  ).some(Boolean);

  const cleanupUploadedBookCover = async (publicId) => {
    if (!publicId) return;

    try {
      await api.delete('/uploads/image', {
        data: { publicId },
      });
    } catch (err) {
      console.log('POLL COVER CLEANUP ERROR:', err.response?.data || err);
    }
  };

  const resetPollUploadState = () => {
    setPollOptionCoverUploadLoading({});
    setPollOptionCoverUploadError({});
  };

  const cleanupPollOptionUploads = async (
    options = newPollDataRef.current.options
  ) => {
    const publicIds = [
      ...new Set(
        options
          .map((option) => option.coverImagePublicId)
          .filter(Boolean)
      ),
    ];

    await Promise.all(
      publicIds.map((publicId) => cleanupUploadedBookCover(publicId))
    );
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

  const resetCreatePollForm = () => {
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
  };

  useEffect(() => {
    newPollDataRef.current = newPollData;
  }, [newPollData]);

  useEffect(() => {
    showCreatePollFormRef.current = showCreatePollForm;
  }, [showCreatePollForm]);

  useEffect(() => {
    return () => {
      if (showCreatePollFormRef.current) {
        void cleanupPollOptionUploads(newPollDataRef.current.options);
      }
    };
  }, []);

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
            err.response?.data?.message || 'Failed to search Google Books.',
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

  const handleDeletePoll = async () => {
    if (!poll || !isCreator) return;

    const confirmed = window.confirm(
      'Delete this poll?\n\n' +
      'This will permanently delete the poll and all votes.\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setPollActionLoading(true);
      setPollError('');
      setPollMessage('');

      await api.delete(`/clubs/${clubId}/polls/${poll._id}`);

      setPollMessage('Poll deleted successfully.');

      await fetchClubPolls(false);
      
    } catch (err) {
      console.log(
        'DELETE POLL ERROR:',
        err.response?.data || err
      );

      setPollError(
        err.response?.data?.message ||
        'Failed to delete poll. Please try again.'
      );
    } finally {
      setPollActionLoading(false);
    }
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

    if (!club || !user || !isCreator) return;

    if (Object.values(pollOptionCoverUploadLoading).some(Boolean)) {
      setCreatePollFormErrors((prev) => ({
        ...prev,
        general:
          'Please wait for cover uploads to finish before creating the poll.',
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

      resetCreatePollForm();
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
      options: [...prev.options, createEmptyPollOption()],
    }));

    setCreatePollFormErrors((prev) => ({
      ...prev,
      general: '',
      options: '',
    }));
  };

  const handleRemovePollOption = (index) => {
    if (newPollData.options.length <= 2) return;

    const optionToRemove = newPollData.options[index];
    const optionClientId = optionToRemove?._clientId;

    if (optionToRemove?.coverImagePublicId) {
      void cleanupUploadedBookCover(optionToRemove.coverImagePublicId);
    }

    setNewPollData((prev) => {
      if (prev.options.length <= 2) return prev;

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

      if (previousPublicId && previousPublicId !== uploadedImage.publicId) {
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

  const handleCloseCreatePollForm = async () => {
    createPollFormSessionRef.current += 1;
    showCreatePollFormRef.current = false;

    await cleanupPollOptionUploads(newPollDataRef.current.options);

    resetCreatePollForm();
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

  const handleSetWinnerBookAsCurrent = async () => {
    if (!poll || !club || !user || !isCreator) return;

    try {
      setPollActionLoading(true);
      setPollError('');
      setPollMessage('');

      const { data } = await api.patch(
        `/clubs/${clubId}/polls/${poll._id}/set-winner-current`
      );

      const updatedClub = data.data.club;
      const updatedPoll = data.data.poll;

      onClubUpdated?.({
        ...updatedClub,
        userCurrentChapter: 0,
      });

      setPoll(updatedPoll);
      setPollMessage('The winning book is now the current book.');

      onCommentsReset?.();

      if (updatedClub.currentBook?._id) {
        await onCommentsRefresh?.(updatedClub.currentBook._id, false);
      }

      onClubListsRefresh?.();
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

  return {
    showCreatePollForm,
    creatingPoll,
    newPollData,
    pollBookSearchResults,
    pollBookSearchLoading,
    pollBookSearchError,
    activePollBookOptionIndex,
    pollOptionCoverUploadLoading,
    pollOptionCoverUploadError,
    createPollFormErrors,

    poll,
    pollLoading,
    pollError,
    pollMessage,
    selectedPollOptionId,
    pollActionLoading,

    showAnnounceWinnerForm,
    announcingWinner,
    winnerData,

    pollOptionUploadInProgress,

    setSelectedPollOptionId,

    fetchClubPolls,
    handleVoteInPoll,
    handleRefreshPollResults,
    handleDeletePoll,
    handleOpenAnnounceWinnerForm,
    handleWinnerDataChange,
    handleAnnounceWinner,
    handleCreatePoll,
    handleNewPollChange,
    handlePollOptionChange,
    handleSelectPollGoogleBook,
    handleAddPollOption,
    handleRemovePollOption,
    handlePollBookFieldsFocus,
    handlePollBookFieldsBlur,
    handlePollOptionCoverUpload,
    handleCloseCreatePollForm,
    handleToggleCreatePollForm,
    handleSetWinnerBookAsCurrent,
  };
}

export default useClubPolls;