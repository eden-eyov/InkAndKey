import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fetchUserClubs } from '../store/clubsSlice';
import PollCard from '../components/PollCard';
import ProgressTracker from '../components/ProgressTracker';
import ThreadCard from '../components/ThreadCard';
import AddThreadForm from '../components/AddThreadForm';
import { mapCommentsToDiscussion } from '../utils/clubPageUtils';

function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const currentUserId = user?._id || user?.id;

  const [activeTab, setActiveTab] = useState('reading');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [currentReadsLoading, setCurrentReadsLoading] = useState(false);
  const [currentReadsError, setCurrentReadsError] = useState('');

  const [progressActionError, setProgressActionError] = useState('');
  const [progressActionMessage, setProgressActionMessage] = useState('');
  const [dnfActionLoadingId, setDnfActionLoadingId] = useState('');

  const [expandedRead, setExpandedRead] = useState({
    id: null,
    section: null,
  });

  const [discussionsByProgressId, setDiscussionsByProgressId] = useState({});
  const [discussionsLoadingId, setDiscussionsLoadingId] = useState('');
  const [discussionsErrors, setDiscussionsErrors] = useState({});
  const [newDiscussionProgressId, setNewDiscussionProgressId] =
    useState('');

  const [activePolls, setActivePolls] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [activePollsLoading, setActivePollsLoading] = useState(false);
  const [activePollsError, setActivePollsError] = useState('');

  const [selectedPollOptions, setSelectedPollOptions] = useState({});
  const [pollActionLoadingId, setPollActionLoadingId] = useState('');
  const [pollMessages, setPollMessages] = useState({});
  const [pollErrors, setPollErrors] = useState({});

  const {
    list: clubs,
    loading: clubsLoading,
    error: clubsError,
  } = useSelector((state) => state.clubs);

  useEffect(() => {
    dispatch(fetchUserClubs());
  }, [dispatch]);

  const fetchCurrentReads = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setCurrentReadsLoading(true);
      setCurrentReadsError('');

      const response = await api.get(
        `/users/${currentUserId}/currently-reading`
      );

      setCurrentlyReading(response.data.data || []);
    } catch (err) {
      console.log(
        'DASHBOARD CURRENT READS ERROR:',
        err.response?.data || err
      );

      setCurrentlyReading([]);
      setCurrentReadsError(
        err.response?.data?.message ||
        'Could not load your current books.'
      );
    } finally {
      setCurrentReadsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchCurrentReads();
  }, [fetchCurrentReads]);

  const fetchActivePolls = useCallback(
    async (showLoading = true) => {
      if (!user) return;

      try {
        if (showLoading) {
          setActivePollsLoading(true);
        }

        setActivePollsError('');

        const { data } = await api.get('/polls/my-active-polls');
        const polls = Array.isArray(data.data) ? data.data : [];

        setActivePolls(polls);

        setActivePollIndex((currentIndex) => {
          if (polls.length === 0) return 0;

          return Math.min(currentIndex, polls.length - 1);
        });

        setSelectedPollOptions((previousOptions) => {
          const nextOptions = { ...previousOptions };

          polls.forEach((poll) => {
            if (poll.userVoteOptionId) {
              nextOptions[poll._id] = poll.userVoteOptionId;
            }
          });

          return nextOptions;
        });
      } catch (err) {
        console.log(
          'FETCH ACTIVE POLLS ERROR:',
          err.response?.data || err
        );

        setActivePolls([]);
        setActivePollIndex(0);

        setActivePollsError(
          err.response?.data?.message ||
          'Could not load active polls right now.'
        );
      } finally {
        if (showLoading) {
          setActivePollsLoading(false);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    fetchActivePolls();
  }, [fetchActivePolls]);

  const getPollClubId = (poll) =>
    poll.clubId || poll.club?._id || poll.club;

  const getPollClubName = (poll) =>
    poll.clubName || poll.club?.name || 'Your club';

  const handleSelectPollOption = (pollId, optionId) => {
    setSelectedPollOptions((previousOptions) => ({
      ...previousOptions,
      [pollId]: optionId,
    }));
  };

  const handleVoteInDashboardPoll = async (poll) => {
    const clubId = getPollClubId(poll);
    const selectedOptionId = selectedPollOptions[poll._id];

    if (!clubId || !selectedOptionId) return;

    try {
      setPollActionLoadingId(poll._id);

      setPollErrors((previousErrors) => ({
        ...previousErrors,
        [poll._id]: '',
      }));

      setPollMessages((previousMessages) => ({
        ...previousMessages,
        [poll._id]: '',
      }));

      const { data } = await api.post(
        `/clubs/${clubId}/polls/${poll._id}/vote`,
        {
          optionId: selectedOptionId,
        }
      );

      const updatedPoll = {
        ...poll,
        ...data.data,
        clubId,
        clubName: getPollClubName(poll),
        club: poll.club,
      };

      setActivePolls((previousPolls) =>
        previousPolls.map((item) =>
          item._id === poll._id ? updatedPoll : item
        )
      );

      setPollMessages((previousMessages) => ({
        ...previousMessages,
        [poll._id]: 'Your vote was submitted.',
      }));
    } catch (err) {
      console.log(
        'VOTE IN DASHBOARD POLL ERROR:',
        err.response?.data || err
      );

      setPollErrors((previousErrors) => ({
        ...previousErrors,
        [poll._id]:
          err.response?.data?.message ||
          'Failed to submit your vote. Please try again.',
      }));
    } finally {
      setPollActionLoadingId('');
    }
  };

  const handlePreviousPoll = () => {
    if (activePolls.length <= 1) return;

    setActivePollIndex((currentIndex) =>
      currentIndex === 0
        ? activePolls.length - 1
        : currentIndex - 1
    );
  };

  const handleNextPoll = () => {
    if (activePolls.length <= 1) return;

    setActivePollIndex((currentIndex) =>
      currentIndex === activePolls.length - 1
        ? 0
        : currentIndex + 1
    );
  };

  const handleToggleRead = (progressId) => {
    setExpandedRead((currentValue) => {
      const isAlreadyOpen = currentValue.id === progressId;

      if (isAlreadyOpen) {
        return {
          id: null,
          section: null,
        };
      }

      return {
        id: progressId,
        section: 'progress',
      };
    });
  };

  const fetchDiscussionsForProgress = async (
    progress,
    {
      forceRefresh = false,
      showLoading = true,
    } = {}
  ) => {
    const progressId = progress?._id;
    const clubId = progress?.club?._id;
    const bookId = progress?.book?._id;

    if (!progressId || !clubId || !bookId) return;

    if (!forceRefresh && discussionsByProgressId[progressId]) {
      return;
    }

    try {
      if (showLoading) {
        setDiscussionsLoadingId(progressId);
      }

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progressId]: '',
      }));

      const { data } = await api.get('/comments', {
        params: {
          club: clubId,
          book: bookId,
        },
      });

      setDiscussionsByProgressId((previousDiscussions) => ({
        ...previousDiscussions,
        [progressId]: mapCommentsToDiscussion(data.data || []),
      }));
    } catch (err) {
      console.log(
        'DASHBOARD DISCUSSIONS ERROR:',
        err.response?.data || err
      );

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progressId]:
          err.response?.data?.message ||
          'Could not load discussions for this book.',
      }));
    } finally {
      if (showLoading) {
        setDiscussionsLoadingId('');
      }
    }
  };

  const handleCreateDashboardDiscussion = async (
    progress,
    discussionData
  ) => {
    const clubId = progress?.club?._id;
    const bookId = progress?.book?._id;

    if (!clubId || !bookId) return;

    try {
      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progress._id]: '',
      }));

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

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progress._id]:
          err.response?.data?.message ||
          'Failed to publish the discussion.',
      }));
    }
  };

  const handleCreateDiscussionReply = async (
    progress,
    thread,
    replyText,
    chapterNumber
  ) => {
    const clubId = progress?.club?._id;
    const bookId = progress?.book?._id;

    if (!clubId || !bookId) return;

    try {
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

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progress._id]:
          err.response?.data?.message ||
          'Failed to publish your reply.',
      }));

      throw err;
    }
  };

  const handleToggleDiscussionLike = async (progress, commentId) => {
    if (!progress?.book?._id || !progress?.club?._id) return;

    try {
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

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progress._id]:
          err.response?.data?.message ||
          'Failed to update the like.',
      }));
    }
  };

  const handleDeleteDiscussionComment = async (
    progress,
    commentId
  ) => {
    try {
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

      setDiscussionsErrors((previousErrors) => ({
        ...previousErrors,
        [progress._id]:
          err.response?.data?.message ||
          'Failed to delete comment.',
      }));
    }
  };

  const handleChangeReadSection = async (progress, section) => {
    setExpandedRead({
      id: progress._id,
      section,
    });

    if (section === 'discussions') {
      await fetchDiscussionsForProgress(progress);
    }
  };

  const handleUpdateProgress = async (progress, nextChapter) => {
    if (!progress?.club?._id || !progress?.book?._id) return;

    setProgressActionError('');
    setProgressActionMessage('');

    try {
      await api.post('/reading-progress', {
        club: progress.club._id,
        book: progress.book._id,
        currentChapter: nextChapter,
      });

      setProgressActionMessage('Reading progress updated.');

      const refreshTasks = [
        fetchCurrentReads(),
        dispatch(fetchUserClubs()),
      ];

      if (discussionsByProgressId[progress._id]) {
        refreshTasks.push(
          fetchDiscussionsForProgress(progress, {
            forceRefresh: true,
            showLoading: false,
          })
        );
      }

      await Promise.all(refreshTasks);

    } catch (err) {
      console.log(
        'DASHBOARD PROGRESS UPDATE ERROR:',
        err.response?.data || err
      );

      setProgressActionError(
        err.response?.data?.message ||
        'Failed to update reading progress. Please try again.'
      );
    }
  };

  const handleMarkAsDnf = async (progress) => {
    if (!progress?._id) return;

    const confirmed = window.confirm(
      `Mark "${progress.book?.title || 'this book'}" as did not finish?`
    );

    if (!confirmed) return;

    try {
      setDnfActionLoadingId(progress._id);
      setProgressActionError('');
      setProgressActionMessage('');

      await api.patch(`/reading-progress/${progress._id}/dnf`);

      setProgressActionMessage(
        `${progress.book?.title || 'The book'} was marked as DNF.`
      );

      setExpandedRead({
        id: null,
        section: null,
      });

      await Promise.all([
        fetchCurrentReads(),
        dispatch(fetchUserClubs()),
      ]);
    } catch (err) {
      console.log(
        'DASHBOARD DNF ERROR:',
        err.response?.data || err
      );

      setProgressActionError(
        err.response?.data?.message ||
        'Failed to mark the book as DNF. Please try again.'
      );
    } finally {
      setDnfActionLoadingId('');
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredClubs = useMemo(() => {
    const clubList = Array.isArray(clubs) ? clubs : [];

    if (!normalizedSearchQuery) {
      return clubList;
    }

    return clubList.filter((club) => {
      const searchableText = [
        club.name,
        club.description,
        club.currentBookTitle,
        club.currentBook?.title,
        club.currentBook?.author,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [clubs, normalizedSearchQuery]);

  const filteredCurrentReads = useMemo(() => {
    if (!normalizedSearchQuery) {
      return currentlyReading;
    }

    return currentlyReading.filter((progress) => {
      const searchableText = [
        progress.book?.title,
        progress.book?.author,
        progress.club?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [currentlyReading, normalizedSearchQuery]);

  const activePoll = activePolls[activePollIndex] || null;

  const dashboardLoading = clubsLoading || currentReadsLoading;
  const dashboardError = clubsError || currentReadsError;

  if (dashboardLoading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-serif text-stone-500 italic text-lg animate-pulse">
          Preparing your reading room...
        </p>
      </main>
    );
  }

  if (dashboardError) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-sm">
          <h1 className="font-serif text-3xl mb-3">
            Your reading room is unavailable
          </h1>

          <p className="text-sm text-stone-500">
            {dashboardError}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Hero */}
        <section className="pt-10 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                Your personal reading space
              </span>

              <h1 className="font-serif text-5xl md:text-6xl mt-3 mb-3">
                Reading Room
              </h1>

              <p className="text-stone-500 text-base md:text-lg leading-relaxed">
                Welcome back, {user?.username || 'reader'}. Pick up the
                thread of your current reads and conversations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/profile"
                className="inline-flex items-center justify-center px-6 py-3 border border-stone-200 bg-white text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
              >
                View profile
              </Link>

              <Link
                to="/clubs"
                className="inline-flex items-center justify-center px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition shadow-sm"
              >
                Discover new clubs
              </Link>
            </div>
          </div>
        </section>

        {/* Stats — same visual language as Profile */}
        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="p-6 text-center border-b sm:border-b-0 sm:border-r border-stone-100">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {currentlyReading.length}
              </h2>

              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Current reads
              </p>
            </div>

            <div className="p-6 text-center border-b sm:border-b-0 sm:border-r border-stone-100">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {Array.isArray(clubs) ? clubs.length : 0}
              </h2>

              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Clubs
              </p>
            </div>

            <div className="p-6 text-center">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {activePolls.length}
              </h2>

              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Open polls
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          {/* Main content */}
          <div className="min-w-0">
            <div className="flex items-end gap-2 border-b border-stone-200">
              <button
                type="button"
                onClick={() => setActiveTab('reading')}
                className={`relative rounded-t-2xl border border-b-0 px-6 py-3 text-sm font-medium transition ${activeTab === 'reading'
                  ? 'bg-white border-stone-200 text-ink -mb-px'
                  : 'bg-stone-100/60 border-transparent text-stone-500 hover:text-ink'
                  }`}
              >
                Continue Reading
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('clubs')}
                className={`relative rounded-t-2xl border border-b-0 px-6 py-3 text-sm font-medium transition ${activeTab === 'clubs'
                  ? 'bg-white border-stone-200 text-ink -mb-px'
                  : 'bg-stone-100/60 border-transparent text-stone-500 hover:text-ink'
                  }`}
              >
                Clubs
              </button>
            </div>

            <div className="rounded-b-2xl rounded-tr-2xl border border-t-0 border-stone-200 bg-white p-5 md:p-7 shadow-sm">
              {activeTab === 'reading' ? (
                <section>
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Continue reading
                    </span>

                    <h2 className="font-serif text-3xl mt-2 mb-1">
                      Your current books
                    </h2>

                    <p className="text-sm text-stone-500">
                      Update your progress and return to spoiler-safe
                      conversations.
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

                        const dashboardClub = (Array.isArray(clubs) ? clubs : []).find(
                          (club) =>
                            club._id?.toString() === progress.club?._id?.toString()
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
                                    Reading with{' '}
                                    {progress.club?.name || 'a book club'}
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
                                      onClick={() => handleToggleRead(progress._id)}
                                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${isExpanded
                                        ? 'bg-accent text-white'
                                        : 'bg-ink text-white hover:opacity-90'
                                        }`}
                                    >
                                      {isExpanded ? 'Close' : 'Open'}
                                    </button>

                                    {progress.club?._id && (
                                      <Link
                                        to={`/clubs/${progress.club._id}`}
                                        className="text-sm font-medium text-accent hover:underline ml-auto"
                                      >
                                        View club
                                      </Link>
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
                                      handleChangeReadSection(progress, 'progress')
                                    }
                                    className={`pb-3 text-sm font-medium border-b-2 transition ${expandedRead.section === 'progress'
                                      ? 'border-accent text-accent'
                                      : 'border-transparent text-stone-500 hover:text-ink'
                                      }`}
                                  >
                                    Progress
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeReadSection(progress, 'discussions')
                                    }
                                    className={`pb-3 text-sm font-medium border-b-2 transition ${expandedRead.section === 'discussions'
                                      ? 'border-accent text-accent'
                                      : 'border-transparent text-stone-500 hover:text-ink'
                                      }`}
                                  >
                                    Discussions
                                  </button>
                                </div>

                                <div className="p-5">
                                  {expandedRead.section === 'progress' && (
                                    <div>
                                      <ProgressTracker
                                        currentChapter={currentChapter}
                                        totalChapters={totalChapters}
                                        onUpdateProgress={(nextChapter) =>
                                          handleUpdateProgress(progress, nextChapter)
                                        }
                                      />

                                      {canMarkAsDnf && (
                                        <div className="mt-6 pt-5 border-t border-stone-200">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                              <h5 className="text-sm font-medium text-ink">
                                                Not planning to finish this book?
                                              </h5>

                                              <p className="text-xs text-stone-500 mt-1">
                                                It will be moved out of your current reads and kept in
                                                your reading history as DNF.
                                              </p>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => handleMarkAsDnf(progress)}
                                              disabled={dnfActionLoadingId === progress._id}
                                              className="inline-flex items-center justify-center rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              {dnfActionLoadingId === progress._id
                                                ? 'Marking as DNF...'
                                                : 'Mark as DNF'}
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {expandedRead.section === 'discussions' && (
                                    <div>
                                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                                            Recent discussions
                                          </span>

                                          <h4 className="font-serif text-2xl mt-2">
                                            Conversations about {bookTitle}
                                          </h4>
                                          {newDiscussionProgressId === progress._id && (
                                            <AddThreadForm
                                              totalChapters={totalChapters}
                                              onCancel={() => setNewDiscussionProgressId('')}
                                              onSubmitThread={(discussionData) =>
                                                handleCreateDashboardDiscussion(
                                                  progress,
                                                  discussionData
                                                )
                                              }
                                            />
                                          )}
                                        </div>

                                        {progress.club?._id && (
                                          <div className="flex flex-wrap items-center gap-4">
                                            <button type="button"
                                              onClick={() =>
                                                setNewDiscussionProgressId((currentId) =>
                                                  currentId === progress._id ? '' : progress._id
                                                )
                                              }
                                              className="text-sm font-medium text-ink hover:text-accent transition">{newDiscussionProgressId === progress._id
                                                ? 'Cancel'
                                                : 'New discussion'}
                                            </button>

                                            {isStillCurrentClubBook && progress.club?._id && (
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

                                      {discussionsLoadingId === progress._id ? (
                                        <div className="rounded-2xl border border-stone-200/60 bg-white p-6 text-center">
                                          <p className="text-sm italic text-stone-500">
                                            Loading discussions...
                                          </p>
                                        </div>
                                      ) : discussionsErrors[progress._id] ? (
                                        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                                          <p className="text-sm text-red-600">
                                            {discussionsErrors[progress._id]}
                                          </p>
                                        </div>
                                      ) : (
                                        (() => {
                                          const discussions =
                                            discussionsByProgressId[progress._id] || [];

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
                                                    handleCreateDiscussionReply(
                                                      progress,
                                                      selectedThread,
                                                      replyText,
                                                      chapterNumber
                                                    )
                                                  }
                                                  onToggleLike={(commentId) =>
                                                    handleToggleDiscussionLike(
                                                      progress,
                                                      commentId
                                                    )
                                                  }
                                                  onDeleteComment={(commentId) =>
                                                    handleDeleteDiscussionComment(
                                                      progress,
                                                      commentId
                                                    )
                                                  }
                                                />
                                              ))}
                                            </div>
                                          );
                                        })()
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
              ) : (
                <section>
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Your communities
                    </span>

                    <h2 className="font-serif text-3xl mt-2 mb-1">
                      My clubs
                    </h2>

                    <p className="text-sm text-stone-500">
                      View your active book clubs and their current reads.
                    </p>
                  </div>

                  {filteredClubs.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200/60 bg-cream p-8 text-center">
                      <p className="text-sm text-stone-500">
                        {normalizedSearchQuery
                          ? 'No clubs match your search.'
                          : 'You are not a member of any clubs yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredClubs.map((club) => {
                        const totalChapters =
                          Number(
                            club.totalChapters ||
                            club.currentBook?.totalChapters
                          ) || 0;

                        const userCurrentChapter =
                          Number(club.userCurrentChapter) || 0;

                        const progressPercent =
                          totalChapters > 0
                            ? Math.min(
                              Math.round(
                                (userCurrentChapter / totalChapters) *
                                100
                              ),
                              100
                            )
                            : 0;

                        return (
                          <article
                            key={club._id}
                            className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition hover:border-accent"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                                  Currently reading
                                </span>

                                <h3 className="font-serif text-2xl mt-2 mb-1">
                                  {club.name}
                                </h3>

                                <p className="text-sm text-stone-500 mb-3">
                                  {club.currentBookTitle ||
                                    club.currentBook?.title ||
                                    'No current book'}
                                </p>

                                {club.description && (
                                  <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
                                    {club.description}
                                  </p>
                                )}
                              </div>

                              <div className="w-full lg:w-72">
                                <div className="flex justify-between text-xs text-stone-500 mb-2">
                                  <span>
                                    Chapter {userCurrentChapter} of{' '}
                                    {totalChapters}
                                  </span>

                                  <span>{progressPercent}%</span>
                                </div>

                                <div className="w-full h-2 rounded-full overflow-hidden bg-stone-100">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{
                                      width: `${progressPercent}%`,
                                    }}
                                  />
                                </div>

                                <Link
                                  to={`/clubs/${club._id}`}
                                  className="inline-flex mt-4 text-sm font-medium text-accent hover:underline"
                                >
                                  Open club
                                </Link>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 xl:sticky xl:top-24">
            {/* Search */}
            <section>
              <label
                htmlFor="dashboard-search"
                className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3"
              >
                Search Ink & Key
              </label>

              <div className="relative">
                <input
                  id="dashboard-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search clubs, books, or readers..."
                  className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 pr-12 text-sm shadow-sm outline-none transition placeholder:text-stone-400 focus:border-accent"
                />

                <span
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                >
                  ⌕
                </span>
              </div>
            </section>

            {/* Poll */}
            <section className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    Active poll
                  </span>

                  <h2 className="font-serif text-2xl mt-1">
                    Your clubs are voting
                  </h2>
                </div>

                {activePolls.length > 0 && (
                  <span className="text-xs text-stone-400 whitespace-nowrap">
                    {activePollIndex + 1} / {activePolls.length}
                  </span>
                )}
              </div>

              {activePollsLoading ? (
                <div className="rounded-xl bg-cream p-6 text-center">
                  <p className="text-sm italic text-stone-500">
                    Loading active polls...
                  </p>
                </div>
              ) : activePollsError ? (
                <div className="rounded-xl bg-cream p-6 text-center">
                  <p className="text-sm text-stone-500">
                    {activePollsError}
                  </p>
                </div>
              ) : !activePoll ? (
                <div className="rounded-xl bg-cream p-6 text-center">
                  <p className="text-sm text-stone-500">
                    No active polls right now.
                  </p>
                </div>
              ) : (
                <PollCard
                  poll={activePoll}
                  className="space-y-5"
                  clubName={getPollClubName(activePoll)}
                  clubLink={
                    getPollClubId(activePoll)
                      ? `/clubs/${getPollClubId(activePoll)}`
                      : ''
                  }
                  canVote
                  selectedOptionId={
                    selectedPollOptions[activePoll._id] || ''
                  }
                  onSelectOption={(optionId) =>
                    handleSelectPollOption(
                      activePoll._id,
                      optionId
                    )
                  }
                  onVote={() =>
                    handleVoteInDashboardPoll(activePoll)
                  }
                  voteLoading={
                    pollActionLoadingId === activePoll._id
                  }
                  error={pollErrors[activePoll._id]}
                  message={pollMessages[activePoll._id]}
                  onRefresh={() => fetchActivePolls(false)}
                />
              )}

              {activePolls.length > 1 && (
                <div className="flex items-center justify-between mt-5 pt-5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handlePreviousPoll}
                    className="w-10 h-10 rounded-full border border-stone-200 bg-cream text-lg transition hover:border-accent hover:text-accent"
                    aria-label="Show previous poll"
                  >
                    ←
                  </button>

                  <div className="flex gap-2">
                    {activePolls.map((poll, index) => (
                      <button
                        key={poll._id}
                        type="button"
                        onClick={() => setActivePollIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition ${index === activePollIndex
                          ? 'bg-accent'
                          : 'bg-stone-200 hover:bg-stone-300'
                          }`}
                        aria-label={`Show poll ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPoll}
                    className="w-10 h-10 rounded-full border border-stone-200 bg-cream text-lg transition hover:border-accent hover:text-accent"
                    aria-label="Show next poll"
                  >
                    →
                  </button>
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;