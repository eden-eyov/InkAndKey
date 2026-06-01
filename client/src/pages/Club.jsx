import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Club() {
  const { clubId } = useParams();
  const { user } = useAuth();

  const isGuest = !user;

  // TEMPORARY DESIGN TEST ONLY:
  // This demo club is used only while the backend is not ready.
  // SERVER TODO:
  // When the backend is ready, replace this object with data from:
  // GET /clubs/:clubId
  const club = {
    _id: clubId || 'demo-club-1',
    name: 'Midnight Readers',
    description:
      'A cozy mystery and thriller club for readers who love late-night plot twists, careful theories, and spoiler-free chapter discussions.',
    membersCount: 128,
    currentBook: {
      title: 'The Silent Patient',
      author: 'Alex Michaelides',
      coverUrl:
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
      totalChapters: 20,
    },
    userCurrentChapter: 7,
  };

  // TEMPORARY DESIGN TEST ONLY:
  // These demo threads are used only while the backend is not ready.
  // SERVER TODO:
  // When the backend is ready, threads should come from an endpoint like:
  // GET /clubs/:clubId/threads
  //
  // For logged-in users:
  // The backend should return threads according to the user's reading progress.
  //
  // For guests:
  // The backend should return only spoiler-free threads/reviews.
  const threads = [
    {
      _id: 'thread-1',
      chapterNumber: 2,
      title: 'The opening chapters feel so tense',
      body: 'I love how the story creates suspense without revealing too much too early.',
      authorName: 'Maya',
      spoilerFree: true,
      repliesCount: 8,
    },
    {
      _id: 'thread-2',
      chapterNumber: 5,
      title: 'The narrator feels unreliable',
      body: 'There are a few small details that made me question how much we should trust what we are being told.',
      authorName: 'Noa',
      spoilerFree: false,
      repliesCount: 12,
    },
    {
      _id: 'thread-3',
      chapterNumber: 12,
      title: 'That reveal changes everything',
      body: 'This discussion contains details from later chapters.',
      authorName: 'Daniel',
      spoilerFree: false,
      repliesCount: 21,
    },
  ];

  // SERVER TODO:
  // Later this should come from:
  // GET /clubs/:clubId/surveys
  // Guests should not see surveys.
  const activeSurveys = [];

  const visibleThreads = threads.map((thread) => {
    if (isGuest) {
      return {
        ...thread,
        isLocked: !thread.spoilerFree,
        lockedReason: 'Members only — sign in to unlock chapter discussions',
      };
    }

    const isAheadOfProgress =
      thread.chapterNumber > club.userCurrentChapter && !thread.spoilerFree;

    return {
      ...thread,
      isLocked: isAheadOfProgress,
      lockedReason: `Locked — reach chapter ${thread.chapterNumber} to unlock`,
    };
  });

  const progressPercent =
    club.currentBook.totalChapters > 0
      ? Math.min(
          Math.round(
            (club.userCurrentChapter / club.currentBook.totalChapters) * 100
          ),
          100
        )
      : 0;

  const handleUpdateProgress = () => {
    // SERVER TODO:
    // Later this should open a modal or form that lets the logged-in user
    // update their personal reading progress in this specific club.
    //
    // Possible endpoint:
    // PUT /clubs/:clubId/progress
    //
    // Body example:
    // { currentChapter: newChapterNumber }
  };

  const handleJoinClub = () => {
    // SERVER TODO:
    // Later this should join the logged-in user to the club.
    //
    // Possible endpoint:
    // POST /clubs/:clubId/join
  };

  const handleStartDiscussion = () => {
    // SERVER TODO:
    // Later this should navigate to a create-thread page
    // or open a modal for creating a new discussion.
    //
    // Possible endpoint:
    // POST /clubs/:clubId/threads
  };

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-7xl mx-auto">
        {isGuest && (
          <div className="mb-8 bg-white/70 border border-stone-200/70 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl mb-1">
                You are previewing this club as a guest
              </h2>

              <p className="text-sm text-stone-500">
                Guests can read spoiler-free discussions. To join the club,
                track progress, vote in surveys, or write comments, create an
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

        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
            <div className="bg-cream p-8 flex justify-center items-center border-b lg:border-b-0 lg:border-r border-stone-200/60">
              <img
                src={club.currentBook.coverUrl}
                alt={`${club.currentBook.title} cover`}
                className="w-44 h-64 object-cover rounded-xl shadow-sm"
              />
            </div>

            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1">
                  Active Club
                </span>

                <span className="text-xs text-stone-400">
                  {club.membersCount} members
                </span>
              </div>

              <h1 className="font-serif text-5xl mb-3">{club.name}</h1>

              <p className="text-stone-500 max-w-3xl mb-6 leading-relaxed">
                {club.description}
              </p>

              <div className="bg-cream rounded-2xl p-5 border border-stone-100 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                  Currently reading
                </span>

                <h2 className="font-serif text-2xl mb-1">
                  {club.currentBook.title}
                </h2>

                <p className="text-sm text-stone-500">
                  by {club.currentBook.author}
                </p>
              </div>

              {isGuest ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/login"
                    className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition text-center"
                  >
                    Sign in to join
                  </Link>

                  <Link
                    to="/register"
                    className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
                  >
                    Create account
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-white border border-stone-200/70 rounded-2xl p-5">
                    <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
                      <span>
                        Your reading progress: chapter{' '}
                        {club.userCurrentChapter} of{' '}
                        {club.currentBook.totalChapters}
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
                      onClick={handleUpdateProgress}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Update progress
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleJoinClub}
                      className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                    >
                      Join club
                    </button>

                    <button
                      type="button"
                      onClick={handleStartDiscussion}
                      className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                    >
                      Start a discussion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className={`grid grid-cols-1 gap-10 ${
            isGuest ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[1fr_340px]'
          }`}
        >
          <div>
            <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
              <div>
                <h2 className="font-serif text-3xl mb-1">Discussions</h2>

                <p className="text-sm text-stone-500">
                  Spoiler-aware threads based on reading progress.
                </p>
              </div>

              {!isGuest && (
                <button
                  type="button"
                  onClick={handleStartDiscussion}
                  className="hidden sm:inline-block px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  New thread
                </button>
              )}
            </div>

            <div className="space-y-4">
              {visibleThreads.map((thread) => (
                <article
                  key={thread._id}
                  className={`bg-white p-6 rounded-2xl border shadow-sm transition ${
                    thread.isLocked
                      ? 'border-stone-200/60 opacity-80'
                      : 'border-stone-200/60 hover:border-accent'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1">
                      Chapter {thread.chapterNumber}
                    </span>

                    {thread.spoilerFree && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-stone-100 rounded-full px-3 py-1">
                        Spoiler-free
                      </span>
                    )}

                    {thread.isLocked && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 rounded-full px-3 py-1">
                        Locked
                      </span>
                    )}
                  </div>

                  {thread.isLocked ? (
                    <>
                      <h3 className="font-serif text-xl mb-2 blur-sm select-none">
                        {thread.title}
                      </h3>

                      <p className="text-stone-500 text-sm blur-sm select-none mb-4">
                        {thread.body}
                      </p>

                      <div className="bg-cream border border-stone-100 rounded-xl p-4">
                        <p className="text-sm text-stone-500">
                          {thread.lockedReason}
                        </p>

                        {isGuest && (
                          <Link
                            to="/register"
                            className="inline-block mt-3 text-sm font-medium text-accent hover:underline"
                          >
                            Create an account to unlock more
                          </Link>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-serif text-xl mb-2">
                        {thread.title}
                      </h3>

                      <p className="text-stone-500 text-sm mb-4">
                        {thread.body}
                      </p>

                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span>Posted by {thread.authorName}</span>
                        <span>{thread.repliesCount} replies</span>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>

          {isGuest ? (
            <aside>
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl mb-4">How spoilers work</h2>

                <p className="text-sm text-stone-500 leading-relaxed mb-5">
                  Guests only see spoiler-free discussions. Members can unlock
                  chapter discussions by tracking their personal reading
                  progress.
                </p>

                <div className="bg-cream border border-stone-100 rounded-xl p-4 mb-5">
                  <h3 className="font-serif text-lg mb-2">Guest preview</h3>

                  <p className="text-sm text-stone-500 leading-relaxed">
                    You can explore this club, but surveys, joining, comments,
                    and progress tracking require an account.
                  </p>
                </div>

                <Link
                  to="/register"
                  className="block text-center px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  Create account
                </Link>
              </div>
            </aside>
          ) : (
            <aside>
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl mb-4">Active Surveys</h2>

                {/* SERVER TODO:
                    Later this section should render real surveys for this club.
                    Guests should not see this section.
                    Possible endpoint:
                    GET /clubs/:clubId/surveys
                */}

                {activeSurveys.length === 0 ? (
                  <div className="text-center bg-cream p-6 rounded-xl border border-stone-100">
                    <h4 className="font-serif text-lg text-ink mb-2 italic">
                      No active surveys
                    </h4>

                    <p className="text-xs text-stone-500 leading-relaxed">
                      There are currently no open votes in this club.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSurveys.map((survey) => (
                      <div key={survey._id}>
                        <h3 className="text-sm font-medium text-ink mb-3">
                          {survey.title}
                        </h3>

                        {/* SERVER TODO:
                            Later render real survey options here.
                        */}
                      </div>
                    ))}
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
            </aside>
          )}
        </section>
      </div>
    </main>
  );
}

export default Club;