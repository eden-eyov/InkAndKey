import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function getPollClubId(poll) {
  return poll?.clubId || poll?.club?._id || poll?.club || '';
}

function getPollClubName(poll) {
  return poll?.clubName || poll?.club?.name || 'Your club';
}

function useDashboardPolls(user) {
  const [activePolls, setActivePolls] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [activePollsLoading, setActivePollsLoading] = useState(false);
  const [activePollsError, setActivePollsError] = useState('');

  const [selectedPollOptions, setSelectedPollOptions] = useState({});
  const [pollActionLoadingId, setPollActionLoadingId] = useState('');
  const [pollMessages, setPollMessages] = useState({});
  const [pollErrors, setPollErrors] = useState({});

  useEffect(() => {
    const messagePollIds = Object.entries(pollMessages)
      .filter(([, message]) => Boolean(message))
      .map(([pollId]) => pollId);

    if (messagePollIds.length === 0) {
      return undefined;
    }

    const timeoutIds = messagePollIds.map((pollId) =>
      window.setTimeout(() => {
        setPollMessages((previousMessages) => {
          if (!previousMessages[pollId]) {
            return previousMessages;
          }

          return {
            ...previousMessages,
            [pollId]: '',
          };
        });
      }, 3000)
    );

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [pollMessages]);

  const fetchActivePolls = useCallback(
    async (showLoading = true) => {
      if (!user) {
        return;
      }

      try {
        if (showLoading) {
          setActivePollsLoading(true);
        }

        setActivePollsError('');

        const { data } = await api.get('/polls/my-active-polls');
        const polls = Array.isArray(data.data) ? data.data : [];

        setActivePolls(polls);

        setActivePollIndex((currentIndex) => {
          if (polls.length === 0) {
            return 0;
          }

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

  const handleSelectPollOption = (pollId, optionId) => {
    setSelectedPollOptions((previousOptions) => ({
      ...previousOptions,
      [pollId]: optionId,
    }));
  };

  const handleVoteInDashboardPoll = async (poll) => {
    const clubId = getPollClubId(poll);
    const selectedOptionId = selectedPollOptions[poll._id];

    if (!clubId || !selectedOptionId) {
      return;
    }

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
    if (activePolls.length <= 1) {
      return;
    }

    setActivePollIndex((currentIndex) =>
      currentIndex === 0
        ? activePolls.length - 1
        : currentIndex - 1
    );
  };

  const handleNextPoll = () => {
    if (activePolls.length <= 1) {
      return;
    }

    setActivePollIndex((currentIndex) =>
      currentIndex === activePolls.length - 1
        ? 0
        : currentIndex + 1
    );
  };

  const handleSelectPoll = (pollIndex) => {
    setActivePollIndex(pollIndex);
  };

  const activePoll = activePolls[activePollIndex] || null;

  const activePollClubId = useMemo(
    () => getPollClubId(activePoll),
    [activePoll]
  );

  const activePollClubName = useMemo(
    () => getPollClubName(activePoll),
    [activePoll]
  );

  const activePollClubLink = activePollClubId
    ? `/clubs/${activePollClubId}`
    : '';

  const selectedOptionId = activePoll
    ? selectedPollOptions[activePoll._id] || ''
    : '';

  const pollActionLoading = activePoll
    ? pollActionLoadingId === activePoll._id
    : false;

  const pollError = activePoll
    ? pollErrors[activePoll._id] || ''
    : '';

  const pollMessage = activePoll
    ? pollMessages[activePoll._id] || ''
    : '';

  return {
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
  };
}

export default useDashboardPolls;