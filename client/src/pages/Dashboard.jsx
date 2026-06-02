// import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserClubs } from '../store/clubsSlice';

function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const { list: clubs, loading, error } = useSelector((state) => state.clubs);

  // SERVER TODO:
  // When the backend is ready, fetchUserClubs should call a protected endpoint,
  // for example: GET /clubs/my-clubs or GET /users/me/clubs.
  // The backend should return only clubs that the logged-in user joined.
  // useEffect(() => {
  //   dispatch(fetchUserClubs());
  // }, [dispatch]);

  // TEMPORARY DESIGN TEST ONLY:
  // If the backend is not ready and you want to see the dashboard design,
  // you can use these demo clubs below.
  // To use them, change:
  // const displayedClubs = clubs;
  // to:
  // const displayedClubs = clubs?.length ? clubs : demoClubs;
  const demoClubs = [
    {
      _id: 'demo-club-1',
      name: 'Midnight Readers',
      description:
        'A cozy club for mystery, thriller, and late-night page turners.',
      currentBookTitle: 'The Silent Patient',
      userCurrentChapter: 7,
      totalChapters: 20,
    },
    {
      _id: 'demo-club-2',
      name: 'The Fantasy Shelf',
      description:
        'A place for dragons, magic systems, quests, and long discussions.',
      currentBookTitle: 'The Hobbit',
      userCurrentChapter: 5,
      totalChapters: 19,
    },
  ];

  // Use real Redux data by default.
  // For design testing without backend, you can temporarily use:
  // const displayedClubs = clubs?.length ? clubs : demoClubs;
  const displayedClubs = clubs?.length ? clubs : demoClubs;

  // SERVER TODO:
  // Later this should come from Redux or from an API endpoint.
  // Example endpoint: GET /surveys/my-active-surveys.
  const activeSurveys = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center">
        <p className="font-serif text-stone-500 italic text-lg animate-pulse">
          Loading your book clubs...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center max-w-md">
          <h2 className="font-serif text-2xl mb-2">Something went wrong</h2>
          <p className="text-stone-500 text-sm mb-5">
            We could not load your book clubs right now.
          </p>

          <button
            type="button"
            onClick={() => dispatch(fetchUserClubs())}
            className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          <header className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-serif text-4xl mb-2">
                Hello, {user?.name || 'reader'}
              </h1>

              <p className="text-stone-500">
                Here is a glimpse of your current reading progress.
              </p>
            </div>

            <Link
              to="/clubs"
              className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition shadow-sm"
            >
              Discover new clubs
            </Link>
          </header>

          <section>
            <h2 className="font-serif text-2xl mb-6">My Clubs</h2>

            {displayedClubs?.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-stone-500 mb-4">
                  You are not a member of any book clubs yet.
                </p>

                <Link
                  to="/clubs"
                  className="text-accent hover:underline font-medium"
                >
                  Browse clubs to join
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedClubs?.map((club) => {
                  const currentChapter = club.userCurrentChapter || 0;
                  const totalChapters = club.totalChapters || 0;

                  const progressPercent =
                    totalChapters > 0
                      ? Math.min(
                          Math.round((currentChapter / totalChapters) * 100),
                          100
                        )
                      : 0;

                  return (
                    <div
                      key={club._id}
                      className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:border-accent transition group flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 block">
                          {club.currentBookTitle || 'No active book'}
                        </span>

                        <h3 className="font-serif text-xl mb-2 group-hover:text-accent transition">
                          <Link to={`/clubs/${club._id}`}>{club.name}</Link>
                        </h3>

                        <p className="text-stone-500 text-sm line-clamp-2 mb-4">
                          {club.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
                          <span>
                            Chapter {currentChapter} of {totalChapters}
                          </span>
                          <span>{progressPercent}%</span>
                        </div>

                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-accent h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm sticky top-24">
            <h2 className="font-serif text-xl mb-6 text-ink border-b border-stone-100 pb-3">
              Active Surveys
            </h2>

            <div className="space-y-6">
              {activeSurveys.length === 0 ? (
                <div className="text-center bg-cream p-8 rounded-xl border border-stone-100 flex flex-col items-center">
                  <h4 className="font-serif text-lg text-ink mb-2 italic">
                    No active surveys
                  </h4>

                  <p className="text-xs text-stone-500 mb-6 leading-relaxed px-4">
                    There are currently no open votes in your book clubs.
                  </p>

                  {/* SERVER TODO:
                      Later this button should probably navigate to a page/modal
                      where club creators can create a survey.
                      Regular members may only vote, depending on permissions.
                  */}
                  <button className="px-6 py-2.5 bg-white border border-stone-200 text-ink text-xs font-bold uppercase tracking-wider rounded-full hover:border-accent hover:text-accent transition shadow-sm">
                    Propose a book
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 block">
                    Midnight Readers
                  </span>

                  <h4 className="text-sm font-medium text-ink mb-3">
                    Vote for our next thriller read
                  </h4>

                  {/* SERVER TODO:
                      Later this should render real survey options from the backend.
                      Example: activeSurveys.map(...)
                  */}
                  <form className="space-y-2">
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition cursor-pointer border border-transparent hover:border-stone-100">
                      <input
                        type="radio"
                        name="poll1"
                        className="text-accent focus:ring-accent w-4 h-4"
                      />
                      <span className="text-sm text-stone-600">
                        The Silent Patient
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition cursor-pointer border border-transparent hover:border-stone-100">
                      <input
                        type="radio"
                        name="poll1"
                        className="text-accent focus:ring-accent w-4 h-4"
                      />
                      <span className="text-sm text-stone-600">Gone Girl</span>
                    </label>

                    <button
                      type="button"
                      className="w-full mt-4 py-2.5 bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-stone-200 transition"
                    >
                      Submit Vote
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;