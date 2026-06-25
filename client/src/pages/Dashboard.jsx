import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import LoadingSpinner from '../components/LoadingSpinner';
// import ErrorMessage from '../components/ErrorMessage';
import { fetchUserClubs } from '../store/clubsSlice';

function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const { list: clubs, loading, error } = useSelector((state) => state.clubs);

  useEffect(() => {
    dispatch(fetchUserClubs());
  }, [dispatch]);

  // if (loading) return <LoadingSpinner message="Loading your book clubs..." />;
  if (loading) {
  return (
    <div className="min-h-screen bg-cream flex justify-center items-center">
      <p className="font-serif text-stone-500 italic text-lg animate-pulse">
        Loading your book clubs...
      </p>
    </div>
  );
}
  // if (error) return <ErrorMessage message={error} />;
if (error) {
  return (
    <div className="min-h-screen bg-cream flex justify-center items-center px-4">
      <p className="font-serif text-stone-500 italic text-base">
        {error || 'Something went wrong. Please try again later.'}
      </p>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-5xl mx-auto">
        
        <div className="space-y-12">
          
          {/* Top Header */}
          <header className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-serif text-4xl mb-2">Hello, {user?.username || 'reader'}</h1>
              <p className="text-stone-500">Here is a glimpse of your current reading progress.</p>
            </div>
            <Link 
              to="/clubs" 
              className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition shadow-sm"
            >
              Discover new clubs
            </Link>
          </header>

          {/* User's Book Clubs Section */}
          <section>
            <h2 className="font-serif text-2xl mb-6">My Clubs</h2>
            
            {clubs?.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-stone-500 mb-4">You are not a member of any book clubs yet.</p>
                <Link to="/clubs" className="text-accent hover:underline font-medium">Browse clubs to join</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clubs?.map((club) => {
                  const totalChapters = club.totalChapters || 0;
                  const userCurrentChapter = club.userCurrentChapter || 0;

                  const progressPercent =
                    totalChapters > 0
                      ? Math.min(
                          Math.round((userCurrentChapter / totalChapters) * 100),
                          100
                        )
                      : 0;

                  return (
                    <div key={club._id} className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:border-accent transition group flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 block">
                          {club.currentBookTitle || 'No active book'}
                        </span>
                        <h3 className="font-serif text-xl mb-2 group-hover:text-accent transition">
                          <Link to={`/clubs/${club._id}`}>{club.name}</Link>
                        </h3>
                        <p className="text-stone-500 text-sm line-clamp-2 mb-4">{club.description}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex justify-between text-xs text-stone-500 mb-2 font-medium">
                          <span>Chapter {userCurrentChapter} of {totalChapters}</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-accent h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
