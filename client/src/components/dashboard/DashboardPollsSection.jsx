import PollCard from '../polls/PollCard';

function DashboardPollsSection({
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

  onSelectOption,
  onVote,
  onRefresh,
  onPreviousPoll,
  onNextPoll,
  onSelectPoll,
}) {
  return (
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
          clubName={activePollClubName}
          clubLink={activePollClubLink}
          canVote
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
          onVote={onVote}
          voteLoading={pollActionLoading}
          error={pollError}
          message={pollMessage}
          onRefresh={onRefresh}
        />
      )}

      {activePolls.length > 1 && (
        <div className="flex items-center justify-between mt-5 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={onPreviousPoll}
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
                onClick={() => onSelectPoll(index)}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  index === activePollIndex
                    ? 'bg-accent'
                    : 'bg-stone-200 hover:bg-stone-300'
                }`}
                aria-label={`Show poll ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNextPoll}
            className="w-10 h-10 rounded-full border border-stone-200 bg-cream text-lg transition hover:border-accent hover:text-accent"
            aria-label="Show next poll"
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}

export default DashboardPollsSection;