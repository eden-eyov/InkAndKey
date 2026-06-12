function ProgressTracker({
  currentChapter = 0,
  totalChapters = 0,
  onUpdateProgress,
}) {
  const progressPercent =
    totalChapters > 0
      ? Math.min(Math.round((currentChapter / totalChapters) * 100), 100)
      : 0;

  return (
    <div className="bg-white border border-stone-200/70 rounded-2xl p-5">
      <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
        <span>
          Your reading progress: chapter {currentChapter} of {totalChapters}
        </span>

        <span>{progressPercent}%</span>
      </div>

      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="bg-accent h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <button
        type="button"
        onClick={onUpdateProgress}
        className="text-sm font-medium text-accent hover:underline"
      >
        Update progress
      </button>
    </div>
  );
}

export default ProgressTracker;