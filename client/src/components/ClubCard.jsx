import { Link } from 'react-router-dom';

function ClubCard({ club }) {
  const hasImage = Boolean(club.imageUrl);

  return (
    <article className="bg-white rounded-2xl border border-stone-200/70 shadow-md hover:shadow-lg hover:border-accent/70 transition overflow-hidden group">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-0 min-h-[260px]">
        <div className="p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-3">
              {club.genre || 'Book Club'}
            </span>

            <h2 className="font-serif text-3xl text-ink mb-3 group-hover:text-accent transition leading-tight">
              {club.name}
            </h2>

            <p className="text-stone-500 text-sm line-clamp-3 mb-5 leading-relaxed">
              {club.description}
            </p>

            <div className="bg-cream rounded-xl p-4 border border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Currently reading
              </span>

              <p className="font-serif text-lg text-ink leading-snug">
                {club.currentBookTitle || 'No active book yet'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="text-xs text-stone-400">
              {club.membersCount || 0} members
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
              src={club.imageUrl}
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