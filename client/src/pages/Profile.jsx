import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === user?._id;

  // TEMPORARY DESIGN TEST ONLY:
  // This is used while the backend is not ready.
  // SERVER TODO:
  // For own profile, fetch data from something like:
  // GET /users/me
  //
  // For another user's public profile, fetch data from:
  // GET /users/:userId/public
  const ownProfile = {
    _id: user?._id || 'demo-user-id',
    name: user?.name || 'Demo Reader',
    email: user?.email || 'demo@example.com',
    avatarUrl: '',
    bio: 'Always reading something mysterious, atmospheric, or a little bit magical.',
    favoriteGenres: ['Mystery', 'Classics', 'Fantasy'],
    favoriteBooks: ['The Secret History', 'Pride and Prejudice', 'The Hobbit'],
    stats: {
      booksRead: 14,
      clubsJoined: 5,
      readingStreak: 12,
    },
    currentReads: [
      {
        _id: 'book-1',
        title: 'The Silent Patient',
        clubName: 'Midnight Readers',
      },
      {
        _id: 'book-2',
        title: 'The Hobbit',
        clubName: 'The Fantasy Shelf',
      },
    ],
    clubs: [
      {
        _id: 'club-1',
        name: 'Midnight Readers',
        currentBookTitle: 'The Silent Patient',
      },
      {
        _id: 'club-2',
        name: 'The Fantasy Shelf',
        currentBookTitle: 'The Hobbit',
      },
    ],
  };

  // TEMPORARY DESIGN TEST ONLY:
  // Public profile example for viewing another user.
  // SERVER TODO:
  // Replace this with public data from the backend.
  // Do not return private fields like email or reading progress.
  const publicProfile = {
    _id: userId || 'public-user-id',
    name: 'Maya Cohen',
    avatarUrl: '',
    bio: 'Reader of twisty thrillers, quiet literary fiction, and anything with complicated characters.',
    favoriteGenres: ['Thriller', 'Literary Fiction', 'Romance'],
    favoriteBooks: ['Gone Girl', 'Normal People', 'Rebecca'],
    stats: {
      booksRead: 22,
      clubsJoined: 3,
    },
    currentReads: [
      {
        _id: 'book-3',
        title: 'Rebecca',
        clubName: 'Classics & Coffee',
      },
    ],
    clubs: [
      {
        _id: 'club-3',
        name: 'Classics & Coffee',
        currentBookTitle: 'Rebecca',
      },
      {
        _id: 'club-1',
        name: 'Midnight Readers',
        currentBookTitle: 'The Silent Patient',
      },
    ],
  };

  const profile = isOwnProfile ? ownProfile : publicProfile;

  const initials = profile.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleEditProfile = () => {
    navigate('/onboarding');
  };

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-6xl mx-auto">
        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-10">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-cream border border-stone-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={`${profile.name} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-4xl text-stone-400">
                      {initials}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    {isOwnProfile ? 'Your profile' : 'Reader profile'}
                  </span>

                  <h1 className="font-serif text-5xl mt-2 mb-2">
                    {profile.name}
                  </h1>

                  {isOwnProfile && (
                    <p className="text-sm text-stone-500 mb-3">
                      {profile.email}
                    </p>
                  )}

                  <p className="text-stone-500 max-w-xl leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-stone-100">
            <div className="p-6 text-center border-b sm:border-b-0 sm:border-r border-stone-100">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {profile.stats.booksRead}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Books read
              </p>
            </div>

            <div className="p-6 text-center border-b sm:border-b-0 sm:border-r border-stone-100">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {profile.stats.clubsJoined}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Clubs
              </p>
            </div>

            <div className="p-6 text-center">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {isOwnProfile ? profile.stats.readingStreak : '—'}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                {isOwnProfile ? 'Reading streak' : 'Private'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="border-b border-stone-200 pb-4 mb-5">
                <h2 className="font-serif text-3xl mb-1">Favorite books</h2>
                <p className="text-sm text-stone-500">
                  Books this reader loves most.
                </p>
              </div>

              {profile.favoriteBooks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profile.favoriteBooks.map((book) => (
                    <div
                      key={book}
                      className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent block mb-2">
                        Favorite
                      </span>
                      <h3 className="font-serif text-xl">{book}</h3>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
                  <p className="text-stone-500 text-sm">
                    No favorite books added yet.
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="border-b border-stone-200 pb-4 mb-5">
                <h2 className="font-serif text-3xl mb-1">
                  {isOwnProfile ? 'Your current reads' : 'Currently reading'}
                </h2>
                <p className="text-sm text-stone-500">
                  Books connected to active club reading.
                </p>
              </div>

              {profile.currentReads?.length > 0 ? (
                <div className="space-y-4">
                  {profile.currentReads.map((book) => (
                    <div
                      key={book._id}
                      className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <h3 className="font-serif text-xl mb-1">
                          {book.title}
                        </h3>
                        <p className="text-sm text-stone-500">
                          Reading with {book.clubName}
                        </p>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        {isOwnProfile ? 'Progress private' : 'No progress shown'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
                  <p className="text-stone-500 text-sm">
                    No current reads to show.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
              <h2 className="font-serif text-xl mb-4">Favorite genres</h2>

              {profile.favoriteGenres?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.favoriteGenres.map((genre) => (
                    <span
                      key={genre}
                      className="px-4 py-2 rounded-full text-sm bg-cream border border-stone-200 text-stone-600"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  No favorite genres added yet.
                </p>
              )}
            </section>

            <section className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
              <h2 className="font-serif text-xl mb-4">
                {isOwnProfile ? 'My clubs' : 'Public clubs'}
              </h2>

              {profile.clubs?.length > 0 ? (
                <div className="space-y-3">
                  {profile.clubs.map((club) => (
                    <Link
                      key={club._id}
                      to={`/clubs/${club._id}`}
                      className="block bg-cream rounded-xl p-4 border border-stone-100 hover:border-accent transition"
                    >
                      <h3 className="font-serif text-lg mb-1">{club.name}</h3>
                      <p className="text-xs text-stone-500">
                        Current book: {club.currentBookTitle}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  No public clubs to show.
                </p>
              )}
            </section>

            {!isOwnProfile && (
              <section className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
                <h2 className="font-serif text-xl mb-3">Privacy note</h2>

                <p className="text-sm text-stone-500 leading-relaxed">
                  Email address and personal reading progress are private and
                  are not shown on public profiles.
                </p>
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

export default Profile;