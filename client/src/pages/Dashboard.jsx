import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fetchUserClubs } from '../store/clubsSlice';
import DashboardReadingTab from '../components/DashboardReadingTab';
import DashboardClubsTab from '../components/DashboardClubsTab';
import DashboardPollsSection from '../components/DashboardPollsSection';
import useDashboardPolls from '../hooks/useDashboardPolls';
import useDashboardSearch from '../hooks/useDashboardSearch';
import useDashboardDiscussions from '../hooks/useDashboardDiscussions';

function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const currentUserId = user?._id || user?.id;
  const {
    activePolls,
    activePollIndex,
    activePoll,
    activePollsLoading,
    activePollsError,
    activePollClubName,
    activePollClubLink,
    selectedOptionId,
    pollActionLoading,
    pollError,
    pollMessage,
    fetchActivePolls,
    handleSelectPollOption,
    handleVoteInDashboardPoll,
    handlePreviousPoll,
    handleNextPoll,
    handleSelectPoll,
  } = useDashboardPolls(user);

  const {
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
  } = useDashboardDiscussions();

  const [activeTab, setActiveTab] = useState('reading');

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


  const {
    list: clubs,
    loading: clubsLoading,
    error: clubsError,
  } = useSelector((state) => state.clubs);

  const {
    searchQuery,
    setSearchQuery,
    normalizedSearchQuery,
    userSearchResults,
    userSearchLoading,
    userSearchError,
    filteredClubs,
    filteredCurrentReads,
  } = useDashboardSearch({
    clubs,
    currentlyReading,
  });

  useEffect(() => {
    if (!progressActionMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setProgressActionMessage('');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [progressActionMessage]);


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

  const handleChangeReadSection = async (progress, section) => {
    if (section === 'discussions' && progress?.club?.isArchived) {
      return;
    }

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

      setProgressActionMessage('Your progress has been updated.');

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
                <DashboardReadingTab
                  filteredCurrentReads={filteredCurrentReads}
                  normalizedSearchQuery={normalizedSearchQuery}
                  progressActionError={progressActionError}
                  progressActionMessage={progressActionMessage}
                  expandedRead={expandedRead}
                  clubs={clubs}
                  newDiscussionProgressId={newDiscussionProgressId}
                  discussionsLoadingId={discussionsLoadingId}
                  discussionsErrors={discussionsErrors}
                  discussionsByProgressId={discussionsByProgressId}
                  dnfActionLoadingId={dnfActionLoadingId}
                  currentUserId={currentUserId}
                  onToggleRead={handleToggleRead}
                  onChangeReadSection={handleChangeReadSection}
                  onUpdateProgress={handleUpdateProgress}
                  onMarkAsDnf={handleMarkAsDnf}
                  onToggleNewDiscussion={handleToggleNewDiscussion}
                  onCancelNewDiscussion={handleCancelNewDiscussion}
                  onCreateDiscussion={handleCreateDashboardDiscussion}
                  onCreateReply={handleCreateDiscussionReply}
                  onToggleDiscussionLike={handleToggleDiscussionLike}
                  onDeleteDiscussionComment={handleDeleteDiscussionComment}
                  onUpdateDiscussionComment={handleUpdateDiscussionComment}
                />
              ) : (
                <DashboardClubsTab
                  filteredClubs={filteredClubs}
                  normalizedSearchQuery={normalizedSearchQuery}
                />
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
                  placeholder="Search readers and your library..."
                  className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 pr-12 text-sm shadow-sm outline-none transition placeholder:text-stone-400 focus:border-accent"
                />

                <span
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                >
                  ⌕
                </span>
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  <div className="border-b border-stone-100 px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Reader results
                    </span>

                    <p className="mt-1 text-xs text-stone-400">
                      Your books and clubs are filtered in the main panel.
                    </p>
                  </div>

                  {userSearchLoading ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm italic text-stone-500">
                        Searching readers...
                      </p>
                    </div>
                  ) : userSearchError ? (
                    <div className="px-4 py-5">
                      <p className="text-sm text-red-500">
                        {userSearchError}
                      </p>
                    </div>
                  ) : userSearchResults.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm text-stone-500">
                        No readers found.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {userSearchResults.map((reader) => {
                        const readerInitials = reader.username
                          ?.split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <Link
                            key={reader._id}
                            to={`/users/${reader._id}`}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-cream"
                          >
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-stone-200 bg-cream">
                              {reader.profileImage ? (
                                <img
                                  src={reader.profileImage}
                                  alt={`${reader.username} profile`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <span className="font-serif text-sm text-stone-400">
                                    {readerInitials || '?'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {reader.username}
                              </p>

                              {reader.favoriteGenres?.length > 0 && (
                                <p className="truncate text-xs text-stone-400">
                                  {reader.favoriteGenres.slice(0, 3).join(' · ')}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Poll */}
            <DashboardPollsSection
              activePolls={activePolls}
              activePollIndex={activePollIndex}
              activePoll={activePoll}
              activePollsLoading={activePollsLoading}
              activePollsError={activePollsError}
              activePollClubName={activePollClubName}
              activePollClubLink={activePollClubLink}
              selectedOptionId={selectedOptionId}
              pollActionLoading={pollActionLoading}
              pollError={pollError}
              pollMessage={pollMessage}
              onSelectOption={(optionId) => {
                if (!activePoll) return;

                handleSelectPollOption(activePoll._id, optionId);
              }}
              onVote={() => {
                if (!activePoll) return;

                handleVoteInDashboardPoll(activePoll);
              }}
              onRefresh={() => fetchActivePolls(false)}
              onPreviousPoll={handlePreviousPoll}
              onNextPoll={handleNextPoll}
              onSelectPoll={handleSelectPoll}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;