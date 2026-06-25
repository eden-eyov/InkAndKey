import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fetchAllClubs, fetchUserClubs } from '../store/clubsSlice';

import ThreadCard from '../components/ThreadCard';
import AddThreadForm from '../components/AddThreadForm';
import ProgressTracker from '../components/ProgressTracker';

import GENRES from '../utils/genres';

function Club() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const isGuest = !user;
  const [showAddThreadForm, setShowAddThreadForm] = useState(false);
  const [showSetBookForm, setShowSetBookForm] = useState(false);
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [showCreatePollForm, setShowCreatePollForm] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const [newPollData, setNewPollData] = useState({
    question: 'What should we read next?',
    closesAt: '',
    options: [
      {
        title: '',
        author: '',
        coverImage: '',
        description: '',
      },
      {
        title: '',
        author: '',
        coverImage: '',
        description: '',
      },
    ],
  });

  const [poll, setPoll] = useState(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState('');
  const [pollMessage, setPollMessage] = useState('');
  const [selectedPollOptionId, setSelectedPollOptionId] = useState('');
  const [pollActionLoading, setPollActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

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

  const [settingCurrentBook, setSettingCurrentBook] = useState(false);
  const [newBookData, setNewBookData] = useState({
    title: '',
    author: '',
    totalChapters: '',
    description: '',
    coverImage: '',
    genres: [],
  });

  const refreshClubLists = () => {
    dispatch(fetchAllClubs());

    if (user) {
      dispatch(fetchUserClubs());
    }
  };

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

            const progress = progressResponse.data.data?.[0];

            clubData = {
              ...clubData,
              userCurrentChapter: progress?.currentChapter || 0,
            };
          } catch (progressError) {
            console.log(
              'FETCH PROGRESS ERROR:',
              progressError.response?.data || progressError
            );

            clubData = {
              ...clubData,
              userCurrentChapter: 0,
            };
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
          await fetchThreads(clubData.currentBook._id, !user || !userIsMember);
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
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
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


  const mapCommentsToThreads = (comments) => {
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
        authorName: comment.user?.username || 'Reader',
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
          authorName: reply.user?.username || 'Reader',
          likesCount: reply.likesCount || 0,
          isLikedByMe: Boolean(reply.isLikedByMe),
        })),
      };
    });
  };

  const fetchThreads = async (bookId, shouldUsePublicRoute = false) => {
    if (!bookId) return;

    try {
      setThreadsLoading(true);

      const endpoint = shouldUsePublicRoute ? '/comments/public' : '/comments';

      const { data } = await api.get(endpoint, {
        params: {
          club: clubId,
          book: bookId,
        },
      });

      setThreads(mapCommentsToThreads(data.data || []));
    } catch (err) {
      console.log('FETCH THREADS ERROR:', err.response?.data || err);
    } finally {
      setThreadsLoading(false);
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

    const validOptions = newPollData.options
      .map((option) => ({
        title: option.title.trim(),
        author: option.author.trim(),
        coverImage: option.coverImage.trim(),
        description: option.description.trim(),
      }))
      .filter((option) => option.title);

    if (validOptions.length < 2) {
      setPollError('Please add at least two book options.');
      return;
    }

    if (!newPollData.closesAt) {
      setPollError('Please choose a closing date for the poll.');
      return;
    }

    try {
      setCreatingPoll(true);
      setPollError('');
      setPollMessage('');

      const { data } = await api.post(`/clubs/${clubId}/polls`, {
        question: newPollData.question.trim() || 'What should we read next?',
        closesAt: newPollData.closesAt,
        options: validOptions,
      });

      setPoll(data.data);
      setPollMessage('Poll created successfully.');
      setShowCreatePollForm(false);

      setNewPollData({
        question: 'What should we read next?',
        closesAt: '',
        options: [
          {
            title: '',
            author: '',
            coverImage: '',
            description: '',
          },
          {
            title: '',
            author: '',
            coverImage: '',
            description: '',
          },
        ],
      });
    } catch (err) {
      console.log('CREATE POLL ERROR:', err.response?.data || err);

      setPollError(
        err.response?.data?.message ||
        'Failed to create poll. Please try again.'
      );
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleNewPollChange = (e) => {
    const { name, value } = e.target;

    setNewPollData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePollOptionChange = (index, field, value) => {
    setNewPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
            ...option,
            [field]: value,
          }
          : option
      ),
    }));
  };

  const handleAddPollOption = () => {
    setNewPollData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          title: '',
          author: '',
          coverImage: '',
          description: '',
        },
      ],
    }));
  };

  const handleRemovePollOption = (index) => {
    setNewPollData((prev) => {
      if (prev.options.length <= 2) {
        return prev;
      }

      return {
        ...prev,
        options: prev.options.filter((_, optionIndex) => optionIndex !== index),
      };
    });
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

      setThreads([]);

      if (updatedClub.currentBook?._id) {
        await fetchThreads(updatedClub.currentBook._id, false);
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
      const { data } = await api.post('/reading-progress', {
        club: clubId,
        book: currentBook._id,
        currentChapter: newChapter,
      });

      setClub((prevClub) => ({
        ...prevClub,
        userCurrentChapter: data.data.currentChapter,
      }));
    } catch (err) {
      console.log('UPDATE PROGRESS ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to update reading progress. Please try again.'
      );
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
        await fetchThreads(updatedClub.currentBook._id, false);
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
        await fetchThreads(updatedClub.currentBook._id, true);
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

  const handleNewBookChange = (e) => {
    const { name, value } = e.target;

    setNewBookData((prev) => ({
      ...prev,
      [name]: value,
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

  const handleSetCurrentBook = async (e) => {
    e.preventDefault();

    if (!isCreator) return;

    const title = newBookData.title.trim();
    const author = newBookData.author.trim();
    const totalChapters = Number(newBookData.totalChapters);

    if (!title || !author || !totalChapters || totalChapters < 1) {
      setError('Please enter book title, author, and a valid number of chapters.');
      return;
    }

    try {
      setSettingCurrentBook(true);
      setError('');

      const createBookResponse = await api.post('/books', {
        title,
        author,
        totalChapters,
        description: newBookData.description.trim(),
        coverImage: newBookData.coverImage.trim(),
        genres: newBookData.genres,
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
        await fetchThreads(updatedClub.currentBook._id, false);
      }

      refreshClubLists();

      setNewBookData({
        title: '',
        author: '',
        totalChapters: '',
        description: '',
        coverImage: '',
        genres: [],
      });

      setShowSetBookForm(false);
    } catch (err) {
      console.log('SET NEW CURRENT BOOK ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to create and set current book. Please try again.'
      );
    } finally {
      setSettingCurrentBook(false);
    }
  };

  const handleStartDiscussion = () => {
    if (isGuest) return;

    // Opens the new discussion form on this page.
    // SERVER TODO:
    // The actual thread creation happens in handleSubmitThread.
    setShowAddThreadForm(true);
  };

  const handleSubmitThread = async (threadData) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        title: threadData.title,
        text: threadData.body,
        chapterNumber: threadData.chapterNumber,
        isSpoilerFreeReview: threadData.spoilerFree,
        parentComment: null,
      });

      setShowAddThreadForm(false);

      await fetchThreads(currentBook._id, false);
    } catch (err) {
      console.log('CREATE THREAD ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to publish discussion. Please try again.'
      );
    }
  };

  const handleSubmitReply = async (thread, replyText) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        text: replyText,
        chapterNumber: thread.chapterNumber,
        isSpoilerFreeReview: thread.spoilerFree,
        parentComment: thread._id,
      });

      await fetchThreads(currentBook._id, false);
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

      await fetchThreads(currentBook._id, false);
    } catch (err) {
      console.log('TOGGLE LIKE ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        'Failed to update like. Please try again.'
      );
    }
  };

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


  const creatorId = club.creator?._id || club.creator;

  const isCreator =
    Boolean(currentUserId) &&
    Boolean(creatorId) &&
    creatorId.toString() === currentUserId.toString();

  const canVoteInPoll = isMember || isCreator;

  const getPollTimeLeft = () => {
    if (!poll?.closesAt) {
      return null;
    }

    const closingTime = new Date(poll.closesAt).getTime();
    const difference = closingTime - now;

    if (difference <= 0) {
      return {
        isExpired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        label: 'Poll closed',
      };
    }

    const totalSeconds = Math.floor(difference / 1000);

    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }

    if (hours > 0 || days > 0) {
      parts.push(`${hours}h`);
    }

    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return {
      isExpired: false,
      days,
      hours,
      minutes,
      seconds,
      label: parts.join(' '),
    };
  };
  const pollTimeLeft = getPollTimeLeft();

  const visibleThreads = threads.map((thread) => {
    if (isGuest) {
      return {
        ...thread,
        isLocked: !thread.spoilerFree,
        lockedReason: 'Members only — sign in to unlock chapter discussions',
      };
    }

    const isAheadOfProgress =
      thread.chapterNumber > userCurrentChapter && !thread.spoilerFree;

    return {
      ...thread,
      isLocked: isAheadOfProgress,
      lockedReason: `Locked — reach chapter ${thread.chapterNumber} to unlock`,
    };
  });

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

        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
            <div className="bg-cream p-8 flex justify-center items-center border-b lg:border-b-0 lg:border-r border-stone-200/60">
              {hasCurrentBookCover ? (
                <img
                  src={currentBookCover}
                  alt={`${currentBookTitle} cover`}
                  className="w-44 h-64 object-cover rounded-xl shadow-sm"
                />
              ) : (
                <div className="w-44 h-64 bg-ink rounded-xl shadow-sm flex items-center justify-center p-5 text-center">
                  <span className="font-serif text-xl italic text-cream leading-tight">
                    {currentBook ? currentBookTitle : 'No active book'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1">
                  Active Club
                </span>

                <span className="text-xs text-stone-400">
                  {membersCount} members
                </span>
              </div>

              <h1 className="font-serif text-5xl mb-3">{club.name}</h1>

              <p className="text-stone-500 max-w-3xl mb-6 leading-relaxed">
                {club.description}
              </p>

              <div className="bg-cream rounded-2xl p-5 border border-stone-100 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                  Currently reading
                </span>

                <h2 className="font-serif text-2xl mb-1">
                  {currentBookTitle}
                </h2>

                <p className="text-sm text-stone-500">
                  {currentBookAuthor && `by ${currentBookAuthor}`}
                </p>
              </div>

              {isGuest ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/login"
                    className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition text-center"
                  >
                    Sign in to join
                  </Link>

                  <Link
                    to="/register"
                    className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
                  >
                    Create account
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {isMember && currentBook ? (
                    <ProgressTracker
                      currentChapter={userCurrentChapter}
                      totalChapters={totalChapters}
                      onUpdateProgress={handleUpdateProgress}
                    />
                  ) : (
                    <div className="bg-cream border border-stone-100 rounded-xl p-4 text-sm text-stone-500">
                      {currentBook
                        ? 'Join this club to track your reading progress.'
                        : 'This club does not have an active book yet.'}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    {!isMember && !isCreator && (
                      <button
                        type="button"
                        onClick={handleJoinClub}
                        className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                      >
                        Join club
                      </button>
                    )}

                    {isMember && !isCreator && (
                      <button
                        type="button"
                        onClick={handleLeaveClub}
                        className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                      >
                        Leave club
                      </button>
                    )}

                    {isCreator && (
                      <>
                        <Link
                          to={`/clubs/${club._id}/edit`}
                          className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
                        >
                          Edit club
                        </Link>

                        <button
                          type="button"
                          onClick={() => setShowSetBookForm((prev) => !prev)}
                          className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                        >
                          {showSetBookForm ? 'Close book form' : 'Set new current book'}
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteClub}
                          className="px-6 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-full hover:bg-red-100 transition"
                        >
                          Delete club
                        </button>
                      </>
                    )}

                    {!isGuest && isMember && (
                      <button
                        type="button"
                        onClick={handleStartDiscussion}
                        className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                      >
                        Start a discussion
                      </button>
                    )}
                    {isCreator && showSetBookForm && (
                      <form
                        onSubmit={handleSetCurrentBook}
                        className="w-full bg-cream border border-stone-100 rounded-2xl p-5 space-y-5"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                            Creator tools
                          </span>

                          <h3 className="font-serif text-xl text-ink">
                            Set new current book
                          </h3>

                          <p className="text-sm text-stone-500 mt-1">
                            Add the next book your club is reading. The previous current book will move to the club history automatically.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                              Book title
                            </label>
                            <input
                              type="text"
                              name="title"
                              value={newBookData.title}
                              onChange={handleNewBookChange}
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
                              value={newBookData.author}
                              onChange={handleNewBookChange}
                              className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                              Total chapters
                            </label>
                            <input
                              type="number"
                              min="1"
                              name="totalChapters"
                              value={newBookData.totalChapters}
                              onChange={handleNewBookChange}
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
                              value={newBookData.coverImage}
                              onChange={handleNewBookChange}
                              placeholder="Optional"
                              className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={newBookData.description}
                            onChange={handleNewBookChange}
                            rows="3"
                            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
                          />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">
                            Genres
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {GENRES.map((genre) => (
                              <button
                                key={genre}
                                type="button"
                                onClick={() => handleNewBookGenreToggle(genre)}
                                className={`px-3 py-1.5 rounded-full text-xs border transition ${newBookData.genres.includes(genre)
                                  ? 'bg-accent border-accent text-white'
                                  : 'bg-white border-stone-200 text-stone-600 hover:border-accent hover:text-accent'
                                  }`}
                              >
                                {genre}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowSetBookForm(false)}
                            className="px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={settingCurrentBook}
                            className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {settingCurrentBook ? 'Saving...' : 'Create and set current book'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className={`grid grid-cols-1 gap-10 ${isGuest ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[1fr_340px]'
            }`}
        >
          <div>
            <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
              <div>
                <h2 className="font-serif text-3xl mb-1">Discussions</h2>

                <p className="text-sm text-stone-500">
                  Spoiler-aware threads based on reading progress.
                </p>
              </div>

              {!isGuest && isMember && (
                <button
                  type="button"
                  onClick={handleStartDiscussion}
                  className="hidden sm:inline-block px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  New thread
                </button>
              )}
            </div>
            {showAddThreadForm && !isGuest && currentBook && (
              <AddThreadForm
                totalChapters={totalChapters}
                onCancel={() => setShowAddThreadForm(false)}
                onSubmitThread={handleSubmitThread}
              />
            )}
            {threadsLoading ? (
              <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
                <p className="font-serif text-stone-500 italic text-lg">
                  Loading discussions...
                </p>
              </div>
            ) : visibleThreads.length > 0 ? (
              <div className="space-y-4">
                {visibleThreads.map((thread) => (
                  <ThreadCard
                    key={thread._id}
                    thread={thread}
                    isGuest={isGuest}
                    canLike={isMember}
                    onSubmitReply={handleSubmitReply}
                    onToggleLike={handleToggleLike}
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
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-serif text-lg text-ink mb-1">
                        {poll.question || 'What should we read next?'}
                      </h3>

                      <p className="text-xs text-stone-500">
                        {poll.status === 'open'
                          ? 'Vote for the next club book.'
                          : 'The next book has been chosen.'}
                      </p>

                      {poll.status === 'open' && pollTimeLeft && (
                        <div className="mt-3 bg-cream border border-stone-100 rounded-xl p-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                            Voting closes in
                          </span>

                          <p className="font-serif text-xl text-ink">
                            {pollTimeLeft.label}
                          </p>
                        </div>
                      )}
                      {poll.status === 'open' && pollTimeLeft?.isExpired && (
                        <div className="mt-3 bg-stone-50 border border-stone-200 rounded-xl p-4">
                          <p className="text-xs text-stone-500 leading-relaxed">
                            Voting has closed. The creator can now announce the winning book.
                          </p>
                        </div>
                      )}
                    </div>


                    {pollError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
                        {pollError}
                      </div>
                    )}

                    {pollMessage && (
                      <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3">
                        {pollMessage}
                      </div>
                    )}

                    {poll.winnerBook ? (
                      <div className="bg-cream border border-stone-100 rounded-xl p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent block mb-2">
                          Next book chosen
                        </span>

                        <h4 className="font-serif text-xl text-ink mb-1">
                          {poll.winnerBook.title}
                        </h4>

                        <p className="text-sm text-stone-500 mb-3">
                          {poll.winnerBook.author && `by ${poll.winnerBook.author}`}
                        </p>

                        <p className="text-xs text-stone-500 leading-relaxed">
                          This book has been chosen as the club’s next read. The creator will
                          start it when the club is ready.
                        </p>

                        {isCreator && !poll.appliedAt && (
                          <button
                            type="button"
                            onClick={handleSetWinnerBookAsCurrent}
                            disabled={pollActionLoading}
                            className="mt-4 w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pollActionLoading ? 'Updating...' : 'Set as current book'}
                          </button>
                        )}

                        {poll.appliedAt && (
                          <p className="mt-4 text-xs text-stone-400 italic">
                            This book is already set as the current book.
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {poll.options.map((option) => {
                            const showResults = poll.userHasVoted || poll.status === 'closed';
                            return (
                              <div
                                key={option.optionId}
                                className="bg-cream border border-stone-100 rounded-xl p-4"
                              >
                                {poll.status === 'open' &&
                                  !pollTimeLeft?.isExpired &&
                                  !poll.userHasVoted &&
                                  canVoteInPoll && (
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="pollOption"
                                        value={option.optionId}
                                        checked={selectedPollOptionId === option.optionId}
                                        onChange={() => setSelectedPollOptionId(option.optionId)}
                                        className="mt-1"
                                      />

                                      <span>
                                        <span className="block text-sm font-medium text-ink">
                                          {option.title}
                                        </span>

                                        {option.author && (
                                          <span className="block text-xs text-stone-500 mt-0.5">
                                            by {option.author}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  )}
                                {poll.status === 'open' && !poll.userHasVoted && !canVoteInPoll && (
                                  <div>
                                    <h4 className="text-sm font-medium text-ink">
                                      {option.title}
                                    </h4>

                                    {option.author && (
                                      <p className="text-xs text-stone-500">
                                        by {option.author}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {showResults && (
                                  <div>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div>
                                        <h4 className="text-sm font-medium text-ink">
                                          {option.title}
                                        </h4>

                                        {option.author && (
                                          <p className="text-xs text-stone-500">
                                            by {option.author}
                                          </p>
                                        )}
                                      </div>

                                      <span className="text-xs font-semibold text-accent">
                                        {option.percentage}%
                                      </span>
                                    </div>

                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-stone-100">
                                      <div
                                        className="h-full bg-accent rounded-full"
                                        style={{ width: `${option.percentage}%` }}
                                      />
                                    </div>

                                    <p className="text-[11px] text-stone-400 mt-2">
                                      {option.votesCount} vote
                                      {option.votesCount === 1 ? '' : 's'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {poll.status === 'open' &&
                          !pollTimeLeft?.isExpired &&
                          !poll.userHasVoted &&
                          canVoteInPoll && (
                            <button
                              type="button"
                              onClick={handleVoteInPoll}
                              disabled={!selectedPollOptionId || pollActionLoading}
                              className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {pollActionLoading ? 'Submitting...' : 'Submit vote'}
                            </button>
                          )}
                        {poll.status === 'open' &&
                          !pollTimeLeft?.isExpired &&
                          !poll.userHasVoted &&
                          !canVoteInPoll && (
                            <div className="bg-white border border-stone-200 rounded-xl p-4">
                              <p className="text-xs text-stone-500 leading-relaxed">
                                Join this club to vote in the next read poll.
                              </p>
                            </div>
                          )}

                        {(poll.userHasVoted || poll.status === 'closed') && (
                          <div className="space-y-3">
                            <p className="text-xs text-stone-500">
                              Total votes: {poll.totalVotes}
                            </p>

                            <button
                              type="button"
                              onClick={handleRefreshPollResults}
                              disabled={pollLoading}
                              className="w-full px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition disabled:opacity-50"
                            >
                              Refresh results
                            </button>
                            {isCreator && !poll.winnerBook && poll.totalVotes > 0 && (
                              <button
                                type="button"
                                onClick={handleOpenAnnounceWinnerForm}
                                className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                              >
                                {showAnnounceWinnerForm ? 'Close winner form' : 'Announce winner'}
                              </button>
                            )}
                            {isCreator && showAnnounceWinnerForm && !poll.winnerBook && (
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

                                    {poll.options.map((option) => (
                                      <option key={option.optionId} value={option.optionId}>
                                        {option.title} — {option.votesCount} votes
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
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
                          onClick={() => setShowCreatePollForm((prev) => !prev)}
                          className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                        >
                          {showCreatePollForm ? 'Close poll form' : 'Create next read poll'}
                        </button>
                      </div>
                    )}

                    {isCreator && showCreatePollForm && (
                      <form onSubmit={handleCreatePoll} className="mt-5 space-y-4 text-left">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                            Question
                          </label>

                          <input
                            type="text"
                            name="question"
                            value={newPollData.question}
                            onChange={handleNewPollChange}
                            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                            Closing date
                          </label>

                          <input
                            type="datetime-local"
                            name="closesAt"
                            value={newPollData.closesAt}
                            onChange={handleNewPollChange}
                            className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                          />
                        </div>

                        <div className="space-y-4">
                          <p className="text-xs uppercase tracking-wider text-stone-500">
                            Book options
                          </p>

                          {newPollData.options.map((option, index) => (
                            <div
                              key={index}
                              className="bg-white border border-stone-200 rounded-xl p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h5 className="font-serif text-base text-ink">
                                  Option {index + 1}
                                </h5>

                                {newPollData.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePollOption(index)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                  Book title
                                </label>

                                <input
                                  type="text"
                                  value={option.title}
                                  onChange={(e) =>
                                    handlePollOptionChange(index, 'title', e.target.value)
                                  }
                                  className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                  Author
                                </label>

                                <input
                                  type="text"
                                  value={option.author}
                                  onChange={(e) =>
                                    handlePollOptionChange(index, 'author', e.target.value)
                                  }
                                  className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                  Cover image URL
                                </label>

                                <input
                                  type="text"
                                  value={option.coverImage}
                                  onChange={(e) =>
                                    handlePollOptionChange(index, 'coverImage', e.target.value)
                                  }
                                  placeholder="Optional"
                                  className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                                  Description
                                </label>

                                <textarea
                                  value={option.description}
                                  onChange={(e) =>
                                    handlePollOptionChange(index, 'description', e.target.value)
                                  }
                                  rows="2"
                                  placeholder="Optional"
                                  className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
                                />
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddPollOption}
                            className="w-full px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                          >
                            Add another option
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={creatingPoll}
                          className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creatingPoll ? 'Creating...' : 'Create poll'}
                        </button>
                      </form>
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
      </div>
    </main>
  );
}

export default Club;
