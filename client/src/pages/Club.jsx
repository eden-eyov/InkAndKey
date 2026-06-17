import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import ThreadCard from '../components/ThreadCard';
import AddThreadForm from '../components/AddThreadForm';
import ProgressTracker from '../components/ProgressTracker';

function Club() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isGuest = !user;
  const [showAddThreadForm, setShowAddThreadForm] = useState(false);
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClub = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get(`/clubs/${clubId}`);

        let clubData = data.data;

        if (user && clubData.currentBook?._id) {
          try {
            const progressResponse = await api.get('/reading-progress', {
              params: {
                club: clubId,
                book: clubData.currentBook._id,
              },
            });

            const progress = progressResponse.data.data?.[0];

            clubData = {
              ...clubData,
              userCurrentChapter: progress?.currentChapter || 0,
            };
          } catch (progressError) {
            console.log(
              'FETCH PROGRESS ERROR:',
              progressError.response?.data || progressError
            );

            clubData = {
              ...clubData,
              userCurrentChapter: 0,
            };
          }
        }
        const currentUserId = user?.id || user?._id;

        const userIsMember = clubData.members?.some((member) => {
          const memberId = member._id || member;
          return memberId.toString() === currentUserId;
        });

        if (clubData.currentBook?._id) {
          await fetchThreads(clubData.currentBook._id, !user || !userIsMember);
        }

        setClub(clubData);
      } catch (err) {
        console.log('FETCH CLUB ERROR:', err.response?.data || err);

        setError(
          err.response?.data?.message ||
            'Failed to load club. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [clubId, user]);

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


  // SERVER TODO:
  // Later this should come from:
  // GET /clubs/:clubId/surveys
  // Guests should not see surveys.
  const activeSurveys = [];

  const mapCommentsToThreads = (comments) => {
    const topLevelComments = comments.filter((comment) => !comment.parentComment);
    const replies = comments.filter((comment) => comment.parentComment);

    return topLevelComments.map((comment) => {
      const commentReplies = replies.filter((reply) => {
        const parentId = reply.parentComment?._id || reply.parentComment;
        return parentId?.toString() === comment._id.toString();
      });

      return {
        _id: comment._id,
        title:
          comment.title ||
          (comment.isSpoilerFreeReview
            ? 'Spoiler-free review'
            : `Chapter ${comment.chapterNumber} discussion`),
        body: comment.text || '',
        chapterNumber: comment.chapterNumber,
        spoilerFree: comment.isSpoilerFreeReview,
        authorName: comment.user?.username || 'Reader',
        isLocked: comment.isLocked,
        lockedReason: comment.isLocked
          ? `Locked — reach chapter ${comment.unlockChapter} to unlock`
          : '',
        likesCount: comment.likesCount || 0,
        isLikedByMe: Boolean(comment.isLikedByMe),
        repliesCount: commentReplies.length,
        replies: commentReplies.map((reply) => ({
          _id: reply._id,
          body: reply.text || '',
          authorName: reply.user?.username || 'Reader',
          likesCount: reply.likesCount || 0,
          isLikedByMe: Boolean(reply.isLikedByMe),
        })),
      };
    });
  };

  const fetchThreads = async (bookId, shouldUsePublicRoute = false) => {
    if (!bookId) return;

    try {
      setThreadsLoading(true);

      const endpoint = shouldUsePublicRoute ? '/comments/public' : '/comments';

      const { data } = await api.get(endpoint, {
        params: {
          club: clubId,
          book: bookId,
        },
      });

      setThreads(mapCommentsToThreads(data.data || []));
    } catch (err) {
      console.log('FETCH THREADS ERROR:', err.response?.data || err);
    } finally {
      setThreadsLoading(false);
    }
  };

  const handleUpdateProgress = async (newChapter) => {
    if (!currentBook || !isMember) return;

    try {
      const { data } = await api.post('/reading-progress', {
        club: clubId,
        book: currentBook._id,
        currentChapter: newChapter,
      });

      setClub((prevClub) => ({
        ...prevClub,
        userCurrentChapter: data.data.currentChapter,
      }));
    } catch (err) {
      console.log('UPDATE PROGRESS ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to update reading progress. Please try again.'
      );
    }
  };

  const handleJoinClub = async () => {
    if (isGuest) return;

    try {
      setError('');

      const { data } = await api.post(`/clubs/${clubId}/join`);
      const updatedClub = data.data;

      setClub((prevClub) => ({
        ...updatedClub,
        userCurrentChapter: prevClub?.userCurrentChapter || 0,
      }));

      if (updatedClub.currentBook?._id) {
        await fetchThreads(updatedClub.currentBook._id, false);
      }
    } catch (err) {
      console.log('JOIN CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to join club. Please try again.'
      );
    }
  };

  const handleLeaveClub = async () => {
    if (isGuest || !club) return;

    try {
      setError('');

      const { data } = await api.post(`/clubs/${clubId}/leave`);
      const updatedClub = data.data;

      setClub((prevClub) => ({
        ...updatedClub,
        userCurrentChapter: prevClub?.userCurrentChapter || 0,
      }));

      if (updatedClub.currentBook?._id) {
        await fetchThreads(updatedClub.currentBook._id, true);
      }
    } catch (err) {
      console.log('LEAVE CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to leave club. Please try again.'
      );
    }
  };

  const handleDeleteClub = async () => {
    if (isGuest || !club) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this club? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.delete(`/clubs/${clubId}`);

      navigate('/clubs');
    } catch (err) {
      console.log('DELETE CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to delete club. Please try again.'
      );
    }
  };

  const handleStartDiscussion = () => {
    if (isGuest) return;

    // Opens the new discussion form on this page.
    // SERVER TODO:
    // The actual thread creation happens in handleSubmitThread.
    setShowAddThreadForm(true);
  };

  const handleSubmitThread = async (threadData) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        title: threadData.title,
        text: threadData.body,
        chapterNumber: threadData.chapterNumber,
        isSpoilerFreeReview: threadData.spoilerFree,
        parentComment: null,
      });

      setShowAddThreadForm(false);

      await fetchThreads(currentBook._id, false);
    } catch (err) {
      console.log('CREATE THREAD ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to publish discussion. Please try again.'
      );
    }
  };

  const handleSubmitReply = async (thread, replyText) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post('/comments', {
        club: clubId,
        book: currentBook._id,
        text: replyText,
        chapterNumber: thread.chapterNumber,
        isSpoilerFreeReview: thread.spoilerFree,
        parentComment: thread._id,
      });

      await fetchThreads(currentBook._id, false);
    } catch (err) {
      console.log('CREATE REPLY ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to publish reply. Please try again.'
      );
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!currentBook || !isMember) return;

    try {
      await api.post(`/comments/${commentId}/like`);

      await fetchThreads(currentBook._id, false);
    } catch (err) {
      console.log('TOGGLE LIKE ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to update like. Please try again.'
      );
    }
  };

  if (loading) {
  return (
    <div className="min-h-screen bg-cream flex justify-center items-center">
      <p className="font-serif text-stone-500 italic text-lg animate-pulse">
        Loading club...
      </p>
    </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center max-w-md">
          <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
          <p className="text-stone-500 text-sm mb-5">{error}</p>

          <Link
            to="/clubs"
            className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            Back to clubs
          </Link>
        </div>
      </div>
    );
  }

  if (!club) {
    return null;
  }
  const currentBook = club.currentBook;

  const currentBookTitle = currentBook?.title || 'No active book yet';
  const currentBookAuthor = currentBook?.author || '';
  const currentBookCover = currentBook?.coverImage || '';
  const hasCurrentBookCover = Boolean(currentBookCover);

  const totalChapters = currentBook?.totalChapters || 0;
  const userCurrentChapter = club.userCurrentChapter || 0;

  const membersCount = club.members?.length || club.membersCount || 0;

  const currentUserId = user?.id || user?._id;

  const isMember = club.members?.some((member) => {
    const memberId = member._id || member;

    return memberId?.toString() === currentUserId?.toString();
  });


  const creatorId = club.creator?._id || club.creator;

  const isCreator =
    Boolean(currentUserId) &&
    Boolean(creatorId) &&
    creatorId.toString() === currentUserId.toString();

  const visibleThreads = threads.map((thread) => {
    if (isGuest) {
      return {
        ...thread,
        isLocked: !thread.spoilerFree,
        lockedReason: 'Members only — sign in to unlock chapter discussions',
      };
    }

    const isAheadOfProgress =
      thread.chapterNumber > userCurrentChapter && !thread.spoilerFree;

    return {
      ...thread,
      isLocked: isAheadOfProgress,
      lockedReason: `Locked — reach chapter ${thread.chapterNumber} to unlock`,
    };
  });

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
              {hasCurrentBookCover ? (
                <img
                  src={currentBookCover}
                  alt={`${currentBookTitle} cover`}
                  className="w-44 h-64 object-cover rounded-xl shadow-sm"
                />
              ) : (
                <div className="w-44 h-64 bg-ink rounded-xl shadow-sm flex items-center justify-center p-5 text-center">
                  <span className="font-serif text-xl italic text-cream leading-tight">
                    {currentBook ? currentBookTitle : 'No active book'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-cream border border-stone-200 rounded-full px-3 py-1">
                  Active Club
                </span>

                <span className="text-xs text-stone-400">
                  {membersCount} members
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
                  {currentBookTitle}
                </h2>

                <p className="text-sm text-stone-500">
                  {currentBookAuthor && `by ${currentBookAuthor}`}
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
                  {isMember && currentBook ? (
                    <ProgressTracker
                      currentChapter={userCurrentChapter}
                      totalChapters={totalChapters}
                      onUpdateProgress={handleUpdateProgress}
                    />
                  ) : (
                    <div className="bg-cream border border-stone-100 rounded-xl p-4 text-sm text-stone-500">
                      {currentBook
                        ? 'Join this club to track your reading progress.'
                        : 'This club does not have an active book yet.'}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    {!isMember && !isCreator && (
                      <button
                        type="button"
                        onClick={handleJoinClub}
                        className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                      >
                        Join club
                      </button>
                    )}

                    {isMember && !isCreator && (
                      <button
                        type="button"
                        onClick={handleLeaveClub}
                        className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                      >
                        Leave club
                      </button>
                    )}

                    {isCreator && (
                      <>
                        <Link
                          to={`/clubs/${club._id}/edit`}
                          className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
                        >
                          Edit club
                        </Link>

                        <button
                          type="button"
                          onClick={handleDeleteClub}
                          className="px-6 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-full hover:bg-red-100 transition"
                        >
                          Delete club
                        </button>
                      </>
                    )}

                    {!isGuest && isMember && (
                      <button
                        type="button"
                        onClick={handleStartDiscussion}
                        className="px-6 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition"
                      >
                        Start a discussion
                      </button>
                    )}
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

              {!isGuest && isMember && (
                <button
                  type="button"
                  onClick={handleStartDiscussion}
                  className="hidden sm:inline-block px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  New thread
                </button>
              )}
            </div>
            {showAddThreadForm && !isGuest && currentBook && (
              <AddThreadForm
                totalChapters={totalChapters}
                onCancel={() => setShowAddThreadForm(false)}
                onSubmitThread={handleSubmitThread}
              />
            )}
            <div className="space-y-4">
              {visibleThreads.map((thread) => (
                <ThreadCard
                  key={thread._id}
                  thread={thread}
                  isGuest={isGuest}
                  canLike={isMember}
                  onSubmitReply={handleSubmitReply}
                  onToggleLike={handleToggleLike}
                />
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
