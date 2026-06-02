import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { useAuth } from '../context/AuthContext';
import { fetchAllClubs } from '../store/clubsSlice';

import ClubCard from '../components/ClubCard';

function DiscoverClubs() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const { list: clubs, loading, error } = useSelector((state) => state.clubs);

  const [searchTerm, setSearchTerm] = useState('');

  // SERVER TODO:
  // When the backend is ready, fetchAllClubs should call a public endpoint,
  // for example: GET /clubs.
  // This route should be available for both guests and logged-in users.
  // useEffect(() => {
  //   dispatch(fetchAllClubs());
  // }, [dispatch]);

  // TEMPORARY DESIGN TEST ONLY:
  // If the backend is not ready and you want to see the page design,
  // change:
  // const displayedClubs = clubs;
  // to:
  // const displayedClubs = clubs?.length ? clubs : demoClubs;
  const demoClubs = [
    {
      _id: 'demo-club-1',
      name: 'Midnight Readers',
      description:
        'A cozy mystery and thriller club for readers who love late-night plot twists.',
      currentBookTitle: 'The Silent Patient',
      membersCount: 128,
      genre: 'Thriller',
      imageUrl:
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    },
    {
      _id: 'demo-club-2',
      name: 'The Fantasy Shelf',
      description:
        'A warm space for epic fantasy, magical worlds, and chapter-by-chapter discussions.',
      currentBookTitle: 'The Hobbit',
      membersCount: 94,
      genre: 'Fantasy',
      imageUrl: '',
    },
    {
      _id: 'demo-club-3',
      name: 'Classics & Coffee',
      description:
        'Slow reading, thoughtful notes, and spoiler-free discussions about classic literature.',
      currentBookTitle: 'Pride and Prejudice',
      membersCount: 76,
      genre: 'Classics',
      imageUrl:
        'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
    },
  ];

  // Use real Redux data by default.
  // For frontend design testing without backend, temporarily use:
  // const displayedClubs = clubs?.length ? clubs : demoClubs;
  const displayedClubs = clubs?.length ? clubs : demoClubs;

  const filteredClubs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return displayedClubs || [];

    return (displayedClubs || []).filter((club) => {
      const name = club.name?.toLowerCase() || '';
      const description = club.description?.toLowerCase() || '';
      const currentBookTitle = club.currentBookTitle?.toLowerCase() || '';
      const genre = club.genre?.toLowerCase() || '';

      return (
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        currentBookTitle.includes(normalizedSearch) ||
        genre.includes(normalizedSearch)
      );
    });
  }, [displayedClubs, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center">
        <p className="font-serif text-stone-500 italic text-lg animate-pulse">
          Finding book clubs...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center max-w-md">
          <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>

          <p className="text-stone-500 text-sm mb-5">
            We could not load the book clubs right now.
          </p>

          <button
            type="button"
            onClick={() => dispatch(fetchAllClubs())}
            className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 border-b border-stone-200 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Discover
              </span>

              <h1 className="font-serif text-5xl mt-2 mb-3">
                Find your next book club
              </h1>

              <p className="text-stone-500 max-w-2xl">
                Browse spoiler-free reading communities, preview public
                discussions, and join the clubs that match your reading taste.
              </p>
            </div>

            <div className="w-full lg:w-80">
              <label
                htmlFor="club-search"
                className="block text-xs uppercase tracking-wider text-stone-500 mb-2"
              >
                Search clubs
              </label>

              <input
                id="club-search"
                type="text"
                placeholder="Search by club, book, or genre"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm shadow-sm"
              />
            </div>
          </div>
        </header>

        {!user && (
          <div className="mb-8 bg-white/70 border border-stone-200/70 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl mb-1">Browsing as a guest</h2>
              <p className="text-sm text-stone-500">
                You can explore clubs and preview spoiler-free content. To join
                a club, comment, or track your reading progress, create an
                account.
              </p>
            </div>

            <Link
              to="/register"
              className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition text-center"
            >
              Join Ink & Key
            </Link>
          </div>
        )}

        {filteredClubs.length === 0 ? (
          <section className="bg-white p-10 text-center rounded-2xl border border-stone-200/60 shadow-sm">
            <h2 className="font-serif text-2xl mb-2">No clubs found</h2>

            <p className="text-stone-500 text-sm">
              Try searching for a different book, genre, or club name.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard key={club._id} club={club} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default DiscoverClubs;