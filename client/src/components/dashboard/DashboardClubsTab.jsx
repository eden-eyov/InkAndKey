import { Link } from 'react-router-dom';

function DashboardClubsTab({
  filteredClubs,
  normalizedSearchQuery,
}) {
  return (
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
                      (userCurrentChapter / totalChapters) * 100
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
  );
}

export default DashboardClubsTab;