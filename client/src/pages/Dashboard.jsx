import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// import LoadingSpinner from '../components/LoadingSpinner';
// import ErrorMessage from '../components/ErrorMessage';
import { fetchUserClubs } from '../store/clubsSlice';
import PollCard from '../components/PollCard';

function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [activePolls, setActivePolls] = useState([]);
  const [activePollsLoading, setActivePollsLoading] = useState(false);
  const [activePollsError, setActivePollsError] = useState('');
  const [selectedPollOptions, setSelectedPollOptions] = useState({});
  const [pollActionLoadingId, setPollActionLoadingId] = useState('');
  const [pollMessages, setPollMessages] = useState({});
  const [pollErrors, setPollErrors] = useState({});

  const { list: clubs, loading, error } = useSelector((state) => state.clubs);

  useEffect(() => {
    dispatch(fetchUserClubs());
  }, [dispatch]);

  const fetchActivePolls = useCallback(async (showLoading = true) => {
    if (!user) return;

    try {
      if (showLoading) {
        setActivePollsLoading(true);
      }

      setActivePollsError('');

      const { data } = await api.get('/polls/my-active-polls');
      const polls = Array.isArray(data.data) ? data.data : [];

      setActivePolls(polls);
      setSelectedPollOptions((prev) => {
        const next = { ...prev };

        polls.forEach((poll) => {
          if (poll.userVoteOptionId) {
            next[poll._id] = poll.userVoteOptionId;
          }
        });

        return next;
      });
    } catch (err) {
      console.log('FETCH ACTIVE POLLS ERROR:', err.response?.data || err);

      setActivePolls([]);
      setActivePollsError(
        err.response?.data?.message ||
        'Could not load active polls right now.'
      );
    } finally {
      if (showLoading) {
        setActivePollsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchActivePolls();
  }, [fetchActivePolls]);

  const getPollClubId = (poll) => poll.clubId || poll.club?._id || poll.club;

  const getPollClubName = (poll) => poll.clubName || poll.club?.name || 'Your club';

  const handleSelectPollOption = (pollId, optionId) => {
    setSelectedPollOptions((prev) => ({
      ...prev,
      [pollId]: optionId,
    }));
  };

  const handleVoteInDashboardPoll = async (poll) => {
    const clubId = getPollClubId(poll);
    const selectedOptionId = selectedPollOptions[poll._id];

    if (!clubId || !selectedOptionId) return;

    try {
      setPollActionLoadingId(poll._id);
      setPollErrors((prev) => ({
        ...prev,
        [poll._id]: '',
      }));
      setPollMessages((prev) => ({
        ...prev,
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

      setActivePolls((prev) =>
        prev.map((item) => (item._id === poll._id ? updatedPoll : item))
      );
      setPollMessages((prev) => ({
        ...prev,
        [poll._id]: 'Your vote was submitted.',
      }));
    } catch (err) {
      console.log('VOTE IN DASHBOARD POLL ERROR:', err.response?.data || err);

      setPollErrors((prev) => ({
        ...prev,
        [poll._id]:
          err.response?.data?.message ||
          'Failed to submit your vote. Please try again.',
      }));
    } finally {
      setPollActionLoadingId('');
    }
  };

  // if (loading) return <LoadingSpinner message="Loading your book clubs..." />;
  if (loading) {
  return (
    <div className="min-h-screen bg-cream flex justify-center items-center">
      <p className="font-serif text-stone-500 italic text-lg animate-pulse">
        Loading your book clubs...
      </p>
    </div>
  );
}
  // if (error) return <ErrorMessage message={error} />;
if (error) {
  return (
    <div className="min-h-screen bg-cream flex justify-center items-center px-4">
      <p className="font-serif text-stone-500 italic text-base">
        {error || 'Something went wrong. Please try again later.'}
      </p>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-5xl mx-auto">
        
        <div className="space-y-12">
          
          {/* Top Header */}
          <header className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-serif text-4xl mb-2">Hello, {user?.username || 'reader'}</h1>
              <p className="text-stone-500">Here is a glimpse of your current reading progress.</p>
            </div>
            <Link 
              to="/clubs" 
              className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition shadow-sm"
            >
              Discover new clubs
            </Link>
          </header>

          {/* Active Polls Section */}
          <section>
            <h2 className="font-serif text-2xl mb-6">Active polls in your clubs</h2>

            {activePollsLoading ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-stone-500 italic">Loading active polls...</p>
              </div>
            ) : activePollsError ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-stone-500">
                  {activePollsError}
                </p>
              </div>
            ) : activePolls.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-stone-500">No active polls right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activePolls.map((poll) => {
                  const clubId = poll.clubId || poll.club?._id || poll.club;
                  const clubName = poll.clubName || poll.club?.name || 'Your club';

                  return (
                    <PollCard
                      key={poll._id}
                      poll={poll}
                      className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:border-accent transition space-y-5"
                      clubName={clubName}
                      clubLink={clubId ? `/clubs/${clubId}` : ''}
                      canVote
                      selectedOptionId={selectedPollOptions[poll._id] || ''}
                      onSelectOption={(optionId) =>
                        handleSelectPollOption(poll._id, optionId)
                      }
                      onVote={() => handleVoteInDashboardPoll(poll)}
                      voteLoading={pollActionLoadingId === poll._id}
                      error={pollErrors[poll._id]}
                      message={pollMessages[poll._id]}
                      onRefresh={() => fetchActivePolls(false)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* User's Book Clubs Section */}
          <section>
            <h2 className="font-serif text-2xl mb-6">My Clubs</h2>
            
            {clubs?.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-stone-500 mb-4">You are not a member of any book clubs yet.</p>
                <Link to="/clubs" className="text-accent hover:underline font-medium">Browse clubs to join</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clubs?.map((club) => {
                  const totalChapters = club.totalChapters || 0;
                  const userCurrentChapter = club.userCurrentChapter || 0;

                  const progressPercent =
                    totalChapters > 0
                      ? Math.min(
                          Math.round((userCurrentChapter / totalChapters) * 100),
                          100
                        )
                      : 0;

                  return (
                    <div key={club._id} className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:border-accent transition group flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 block">
                          {club.currentBookTitle || 'No active book'}
                        </span>
                        <h3 className="font-serif text-xl mb-2 group-hover:text-accent transition">
                          <Link to={`/clubs/${club._id}`}>{club.name}</Link>
                        </h3>
                        <p className="text-stone-500 text-sm line-clamp-2 mb-4">{club.description}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
                          <span>Chapter {userCurrentChapter} of {totalChapters}</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-accent h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
