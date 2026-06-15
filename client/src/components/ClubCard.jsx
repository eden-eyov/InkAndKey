import { Link } from 'react-router-dom';

function ClubCard({ club }) {
  const image = club.image || club.imageUrl || '';
  const hasImage = Boolean(image);

  const genresText =
    club.genres?.length > 0
      ? club.genres.join(', ')
      : club.genre || 'Book Club';

  const membersCount =
    club.membersCount ?? club.members?.length ?? 0;

  const currentBookTitle =
    club.currentBookTitle ||
    club.currentBook?.title ||
    'No active book yet';

  return (
    <article className="bg-white rounded-2xl border border-stone-200/70 shadow-md hover:shadow-lg hover:border-accent/70 transition overflow-hidden group">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-0 min-h-[260px]">
        <div className="p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-3">
              {genresText}
            </span>

            <h2 className="font-serif text-3xl text-ink mb-3 group-hover:text-accent transition leading-tight">
              {club.name}
            </h2>

            <p className="text-stone-500 text-sm line-clamp-3 mb-5 leading-relaxed">
              {club.description || 'No description yet.'}
            </p>

            <div className="bg-cream rounded-xl p-4 border border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Currently reading
              </span>

              <p className="font-serif text-lg text-ink leading-snug">
                {currentBookTitle}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="text-xs text-stone-400">
              {membersCount} members
            </span>

            <Link
              to={`/clubs/${club._id}`}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
            >
              View club
            </Link>
          </div>
        </div>

        <div className="p-5 bg-cream border-t sm:border-t-0 sm:border-l border-stone-200/60 flex items-center justify-center">
          {hasImage ? (
            <img
              src={image}
              alt={`${club.name} club cover`}
              className="w-full max-w-[120px] h-[190px] object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className="w-full max-w-[120px] h-[190px] bg-ink rounded-xl shadow-sm flex items-center justify-center p-4 text-center">
              <span className="font-serif text-xl italic text-cream leading-tight">
                {club.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default ClubCard;