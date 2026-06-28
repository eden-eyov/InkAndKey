import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const getPollTimeLeft = (closesAt, now) => {
  if (!closesAt) {
    return null;
  }

  const closingTime = new Date(closesAt).getTime();

  if (Number.isNaN(closingTime)) {
    return null;
  }

  const difference = closingTime - now;

  if (difference <= 0) {
    return {
      isExpired: true,
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
    label: parts.join(' '),
  };
};

function PollCard({
  poll,
  className = 'space-y-5',
  clubName = '',
  clubLink = '',
  canVote = false,
  selectedOptionId = '',
  onSelectOption,
  onVote,
  voteLoading = false,
  error = '',
  message = '',
  onRefresh,
  refreshLoading = false,
  cannotVoteMessage = 'Join this club to vote in the next read poll.',
  canAnnounceWinner = false,
  showAnnounceWinnerForm = false,
  onToggleAnnounceWinnerForm,
  renderAnnounceWinnerForm,
  onSetWinnerAsCurrent,
  setWinnerLoading = false,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!poll?.closesAt || poll.status !== 'open') return undefined;

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [poll?.closesAt, poll?.status]);

  if (!poll) {
    return null;
  }

  const pollTimeLeft = getPollTimeLeft(poll.closesAt, now);
  const pollOptions = Array.isArray(poll.options) ? poll.options : [];
  const pollIsOpen = poll.status === 'open';
  const pollIsExpired = Boolean(pollTimeLeft?.isExpired);
  const canSubmitVote =
    pollIsOpen &&
    !pollIsExpired &&
    !poll.userHasVoted &&
    canVote &&
    Boolean(onVote);
  const winnerBook = poll.winnerBook;
  const winnerBookTitle =
    winnerBook && typeof winnerBook === 'object'
      ? winnerBook.title
      : 'Winning book selected';
  const winnerBookAuthor =
    winnerBook && typeof winnerBook === 'object' ? winnerBook.author : '';

  return (
    <div className={className}>
      <div>
        {clubName && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 block">
            {clubName}
          </span>
        )}

        <h3 className="font-serif text-lg text-ink mb-1">
          {poll.question || 'What should we read next?'}
        </h3>

        <p className="text-xs text-stone-500">
          {pollIsOpen
            ? 'Vote for the next club book.'
            : 'The next book has been chosen.'}
        </p>

        {pollIsOpen && pollTimeLeft && (
          <div className="mt-3 bg-cream border border-stone-100 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
              Voting closes in
            </span>

            <p className="font-serif text-xl text-ink">
              {pollTimeLeft.label}
            </p>
          </div>
        )}

        {pollIsOpen && pollIsExpired && (
          <div className="mt-3 bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 leading-relaxed">
              Voting has closed. The creator can now announce the winning book.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3">
          {message}
        </div>
      )}

      {winnerBook ? (
        <div className="bg-cream border border-stone-100 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent block mb-2">
            Next book chosen
          </span>

          <h4 className="font-serif text-xl text-ink mb-1">
            {winnerBookTitle}
          </h4>

          {winnerBookAuthor && (
            <p className="text-sm text-stone-500 mb-3">
              by {winnerBookAuthor}
            </p>
          )}

          <p className="text-xs text-stone-500 leading-relaxed">
            This book has been chosen as the club's next read. The creator will
            start it when the club is ready.
          </p>

          {onSetWinnerAsCurrent && !poll.appliedAt && (
            <button
              type="button"
              onClick={onSetWinnerAsCurrent}
              disabled={setWinnerLoading}
              className="mt-4 w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setWinnerLoading ? 'Updating...' : 'Set as current book'}
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
            {pollOptions.map((option) => {
              const optionId = option.optionId?.toString();
              const showResults = poll.userHasVoted || poll.status === 'closed';

              return (
                <div
                  key={option.optionId}
                  className="bg-cream border border-stone-100 rounded-xl p-4"
                >
                  {canSubmitVote && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`pollOption-${poll._id}`}
                        value={option.optionId}
                        checked={selectedOptionId?.toString() === optionId}
                        onChange={() => onSelectOption?.(option.optionId)}
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

                  {pollIsOpen && !poll.userHasVoted && !canSubmitVote && !showResults && (
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

          {canSubmitVote && (
            <button
              type="button"
              onClick={onVote}
              disabled={!selectedOptionId || voteLoading}
              className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voteLoading ? 'Submitting...' : 'Submit vote'}
            </button>
          )}

          {pollIsOpen && !pollIsExpired && !poll.userHasVoted && !canSubmitVote && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-xs text-stone-500 leading-relaxed">
                {cannotVoteMessage}
              </p>
            </div>
          )}

          {(poll.userHasVoted || poll.status === 'closed') && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Total votes: {poll.totalVotes}
              </p>

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshLoading}
                  className="w-full px-5 py-2.5 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition disabled:opacity-50"
                >
                  Refresh results
                </button>
              )}

              {canAnnounceWinner && !poll.winnerBook && poll.totalVotes > 0 && (
                <button
                  type="button"
                  onClick={onToggleAnnounceWinnerForm}
                  className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  {showAnnounceWinnerForm ? 'Close winner form' : 'Announce winner'}
                </button>
              )}

              {canAnnounceWinner &&
                showAnnounceWinnerForm &&
                !poll.winnerBook &&
                renderAnnounceWinnerForm?.()}
            </div>
          )}
        </>
      )}

      {clubLink && (
        <div className="pt-4 border-t border-stone-100">
          <Link
            to={clubLink}
            className="text-sm text-accent hover:underline font-medium"
          >
            View club
          </Link>
        </div>
      )}
    </div>
  );
}

export default PollCard;
