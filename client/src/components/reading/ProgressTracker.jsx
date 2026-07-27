import { useEffect, useState } from 'react';

function ProgressTracker({
  currentChapter = 0,
  totalChapters = 0,
  onUpdateProgress,
}) {
  const [selectedChapter, setSelectedChapter] = useState(currentChapter);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedChapter(currentChapter);
  }, [currentChapter]);

  const progressPercent =
    totalChapters > 0
      ? Math.min(Math.round((currentChapter / totalChapters) * 100), 100)
      : 0;

  const decreaseChapter = () => {
    setSelectedChapter((prev) => Math.max(0, Number(prev) - 1));
  };

  const increaseChapter = () => {
    setSelectedChapter((prev) => Math.min(totalChapters, Number(prev) + 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!onUpdateProgress) return;

    try {
      setSaving(true);
      await onUpdateProgress(Number(selectedChapter));
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = Number(selectedChapter) !== Number(currentChapter);

  return (
    <div className="bg-white border border-stone-200/70 rounded-2xl p-5">
      <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
        <span>
          Your reading progress: chapter {currentChapter} of {totalChapters}
        </span>

        <span>{progressPercent}%</span>
      </div>

      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="bg-accent h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">
            Update chapter
          </p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={decreaseChapter}
              disabled={selectedChapter <= 0 || saving}
              className="w-10 h-10 rounded-full border border-stone-200 bg-cream text-ink text-xl leading-none hover:border-accent hover:text-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              −
            </button>

            <div className="min-w-28 text-center">
              <p className="font-serif text-3xl text-ink">
                {selectedChapter}
              </p>
              <p className="text-xs text-stone-400">
                of {totalChapters} chapters
              </p>
            </div>

            <button
              type="button"
              onClick={increaseChapter}
              disabled={selectedChapter >= totalChapters || saving}
              className="w-10 h-10 rounded-full border border-stone-200 bg-cream text-ink text-xl leading-none hover:border-accent hover:text-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || totalChapters === 0 || !hasChanged}
          className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save progress'}
        </button>
      </form>
    </div>
  );
}

export default ProgressTracker;