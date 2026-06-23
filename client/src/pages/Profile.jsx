import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const viewedUserId = userId || user?._id || user?.id;

  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = useMemo(() => {
    const currentUserId = user?._id || user?.id;

    return (
      Boolean(currentUserId) &&
      Boolean(viewedUserId) &&
      currentUserId.toString() === viewedUserId.toString()
    );
  }, [user, viewedUserId]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!viewedUserId) return;

      try {
        setLoading(true);
        setError('');

        const [profileResponse, clubsResponse, currentResponse, completedResponse] =
          await Promise.all([
            api.get(`/users/${viewedUserId}`),
            api.get(`/users/${viewedUserId}/clubs`),
            api.get(`/users/${viewedUserId}/currently-reading`),
            api.get(`/users/${viewedUserId}/completed-books`),
          ]);

        setProfile(profileResponse.data.data);
        setClubs(clubsResponse.data.data || []);
        setCurrentlyReading(currentResponse.data.data || []);
        setCompletedBooks(completedResponse.data.data || []);
      } catch (err) {
        console.log('PROFILE ERROR:', err.response?.data || err);
        setError(
          err.response?.data?.message ||
          'Failed to load profile. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [viewedUserId]);

  const initials = profile?.username
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleEditProfile = () => {
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-cream flex justify-center items-center pt-24">
        <p className="font-serif text-stone-500 italic text-xl">
          Loading profile...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-cream flex justify-center items-center pt-24 px-6">
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-8 max-w-lg text-center">
          <h1 className="font-serif text-3xl mb-3">Profile not available</h1>
          <p className="text-sm text-stone-500 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-6xl mx-auto">
        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-10">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-cream border border-stone-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={`${profile.username} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-4xl text-stone-400">
                      {initials || '?'}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    {isOwnProfile ? 'Your profile' : 'Reader profile'}
                  </span>

                  <h1 className="font-serif text-5xl mt-2 mb-2">
                    {profile.username}
                  </h1>

                  {isOwnProfile && profile.email && (
                    <p className="text-sm text-stone-500 mb-3">
                      {profile.email}
                    </p>
                  )}

                  <p className="text-stone-500 max-w-xl leading-relaxed">
                    {isOwnProfile
                      ? 'This is your Ink & Key reading profile.'
                      : 'This reader shares their favorite books, genres, and book club activity.'}
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
                {completedBooks.length}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Books read
              </p>
            </div>

            <div className="p-6 text-center border-b sm:border-b-0 sm:border-r border-stone-100">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {clubs.length}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Clubs
              </p>
            </div>

            <div className="p-6 text-center">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {currentlyReading.length}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Current reads
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

              {currentlyReading.length > 0 ? (
                <div className="space-y-4">
                  {currentlyReading.map((progress) => (
                    <div
                      key={progress._id}
                      className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <h3 className="font-serif text-xl mb-1">
                          {progress.book?.title || 'Untitled book'}
                        </h3>
                        <p className="text-sm text-stone-500">
                          Reading with {progress.club?.name || 'a book club'}
                        </p>

                        {progress.currentChapter !== undefined && (
                          <p className="text-xs text-stone-400 mt-2">
                            Current chapter: {progress.currentChapter}
                          </p>
                        )}
                      </div>

                      {isOwnProfile ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/clubs/${progress.club?._id}`)}
                          className="px-4 py-2 bg-ink text-white text-xs font-bold uppercase tracking-widest rounded-full hover:opacity-90 transition"
                        >
                          Update progress
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                          View only
                        </span>
                      )}
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

            <section>
              <div className="border-b border-stone-200 pb-4 mb-5">
                <h2 className="font-serif text-3xl mb-1">Completed books</h2>
                <p className="text-sm text-stone-500">
                  Books this reader has finished through Ink & Key clubs.
                </p>
              </div>

              {completedBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedBooks.map((progress) => (
                    <div
                      key={progress._id}
                      className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden flex gap-4 p-4"
                    >
                      <div className="w-20 h-28 bg-cream rounded-xl overflow-hidden border border-stone-100 flex-shrink-0">
                        {progress.book?.coverImage ? (
                          <img
                            src={progress.book.coverImage}
                            alt={progress.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 font-serif text-2xl">
                            ✦
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-serif text-xl mb-1">
                          {progress.book?.title || 'Untitled book'}
                        </h3>
                        <p className="text-sm text-stone-500 mb-2">
                          {progress.book?.author}
                        </p>
                        <p className="text-xs text-stone-400 mb-3">
                          Read with {progress.club?.name || 'a book club'}
                        </p>

                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                          {progress.rating
                            ? `Rating: ${progress.rating}/5`
                            : 'No rating'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
                  <p className="text-stone-500 text-sm">
                    No completed books to show yet.
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

              {clubs.length > 0 ? (
                <div className="space-y-3">
                  {clubs.map((club) => (
                    <Link
                      key={club._id}
                      to={`/clubs/${club._id}`}
                      className="block bg-cream rounded-xl p-4 border border-stone-100 hover:border-accent transition"
                    >
                      <h3 className="font-serif text-lg mb-1">{club.name}</h3>
                      <p className="text-xs text-stone-500">
                        Current book:{' '}
                        {club.currentBook?.title || 'No current book'}
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
                  Email address and exact reading progress are private and are
                  not shown on public profiles.
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