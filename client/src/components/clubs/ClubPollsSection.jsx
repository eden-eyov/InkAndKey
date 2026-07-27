import PollCard from '../polls/PollCard';
import CreatePollModal from '../polls/CreatePollModal';

function ClubPollsSection({
  poll,
  pollLoading,
  pollError,
  pollMessage,
  pollActionLoading,

  isCreator,
  isMember,
  canVoteInPoll,
  selectedPollOptionId,
  showCreatePollForm,
  showAnnounceWinnerForm,

  onSelectPollOption,
  onVoteInPoll,
  onRefreshPollResults,
  onToggleCreatePollForm,
  onOpenAnnounceWinnerForm,
  onSetWinnerBookAsCurrent,
  onDeletePoll,
  renderAnnounceWinnerForm,

  newPollData,
  createPollFormErrors,
  creatingPoll,
  pollOptionUploadInProgress,

  activePollBookOptionIndex,
  pollBookSearchResults,
  pollBookSearchLoading,
  pollBookSearchError,
  pollBookSelectionMessages,
  pollOptionCoverUploadLoading,
  pollOptionCoverUploadError,

  onCreatePoll,
  onCloseCreatePollForm,
  onNewPollChange,
  onPollOptionChange,
  onPollBookFieldsFocus,
  onPollBookFieldsBlur,
  onSelectPollGoogleBook,
  onPollOptionCoverUpload,
  onRemovePollOption,
  onAddPollOption,

  renderGoogleBookSuggestion,
  renderDescriptionPreview,
}) {
  const canViewClubPolls = isMember || isCreator;
  return (
    <aside>
      <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm sticky top-24">
        <h2 className="font-serif text-xl mb-4">Next Read Poll</h2>

        {pollLoading ? (
          <div className="text-center bg-cream p-6 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-500 italic">
              Loading poll...
            </p>
          </div>
        ) : poll ? (
          <PollCard
            poll={poll}
            canVote={canVoteInPoll}
            selectedOptionId={selectedPollOptionId}
            onSelectOption={onSelectPollOption}
            onVote={onVoteInPoll}
            voteLoading={pollActionLoading}
            error={pollError}
            message={pollMessage}
            onRefresh={onRefreshPollResults}
            refreshLoading={pollLoading}
            canAnnounceWinner={isCreator}
            showAnnounceWinnerForm={showAnnounceWinnerForm}
            onToggleAnnounceWinnerForm={onOpenAnnounceWinnerForm}
            renderAnnounceWinnerForm={renderAnnounceWinnerForm}
            onSetWinnerAsCurrent={
              isCreator && !poll.appliedAt
                ? onSetWinnerBookAsCurrent
                : undefined
            }
            onDeletePoll={onDeletePoll}
            setWinnerLoading={pollActionLoading}
          />
        ) : (
          <div className="bg-cream p-6 rounded-xl border border-stone-100">
            <div className="text-center">
              <h4 className="font-serif text-lg text-ink mb-2 italic">
                {canViewClubPolls
                  ? 'No active poll'
                  : 'Polls are available to club members'}
              </h4>

              <p className="text-xs text-stone-500 leading-relaxed">
                {canViewClubPolls
                  ? 'There is currently no open vote in this club.'
                  : 'Join this club to view active polls and vote for the next read.'}
              </p>
            </div>

            {isCreator && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={onToggleCreatePollForm}
                  className="w-full px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  {showCreatePollForm
                    ? 'Close poll form'
                    : 'Create next read poll'}
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
        pollBookSelectionMessages={pollBookSelectionMessages}
        pollOptionCoverUploadLoading={pollOptionCoverUploadLoading}
        pollOptionCoverUploadError={pollOptionCoverUploadError}
        onSubmit={onCreatePoll}
        onClose={onCloseCreatePollForm}
        onNewPollChange={onNewPollChange}
        onPollOptionChange={onPollOptionChange}
        onPollBookFieldsFocus={onPollBookFieldsFocus}
        onPollBookFieldsBlur={onPollBookFieldsBlur}
        onSelectPollGoogleBook={onSelectPollGoogleBook}
        onPollOptionCoverUpload={onPollOptionCoverUpload}
        onRemovePollOption={onRemovePollOption}
        onAddPollOption={onAddPollOption}
        renderGoogleBookSuggestion={renderGoogleBookSuggestion}
        renderDescriptionPreview={renderDescriptionPreview}
      />
    </aside>
  );
}

export default ClubPollsSection;