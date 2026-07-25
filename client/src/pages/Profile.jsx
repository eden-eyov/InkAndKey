import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { userId } = useParams();
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const viewedUserId = userId || user?._id || user?.id;

  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [imageUploadMessage, setImageUploadMessage] = useState('');

  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

  const [ratingLoadingId, setRatingLoadingId] = useState('');

  const [ratingActionError, setRatingActionError] = useState('');
  const [ratingActionMessage, setRatingActionMessage] = useState('');

  const profileImageInputRef = useRef(null);

  const isOwnProfile = useMemo(() => {
    const currentUserId = user?._id || user?.id;

    return (
      Boolean(currentUserId) &&
      Boolean(viewedUserId) &&
      currentUserId.toString() === viewedUserId.toString()
    );
  }, [user, viewedUserId]);

  const fetchProfileData = async () => {
    if (!viewedUserId) return;

    try {
      setLoading(true);
      setError('');

      const [profileResponse, clubsResponse, completedResponse] =
        await Promise.all([
          api.get(`/users/${viewedUserId}`),
          api.get(`/users/${viewedUserId}/created-clubs`),
          api.get(`/users/${viewedUserId}/completed-books`),
        ]);

      setProfile(profileResponse.data.data);
      setClubs(clubsResponse.data.data || []);
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

  useEffect(() => {
    fetchProfileData();
  }, [viewedUserId]);

  useEffect(() => {
    if (!selectedProfileImage) {
      setProfileImagePreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedProfileImage);
    setProfileImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedProfileImage]);

  const initials = profile?.username
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleEditProfile = () => {
    navigate('/onboarding');
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountLoading) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account?\n\n' +
      'Your profile will be deactivated, clubs you created will be archived, ' +
      'and you will be removed from other clubs.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleteAccountLoading(true);
      setDeleteAccountError('');

      await deleteAccount();

      navigate('/', {
        replace: true,
        state: {
          accountDeleted: true,
        },
      });
    } catch (err) {
      console.log(
        'DELETE ACCOUNT ERROR:',
        err.response?.data || err
      );

      setDeleteAccountError(
        err.response?.data?.message ||
        'Failed to delete your account. Please try again.'
      );
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const clearSelectedProfileImage = () => {
    setSelectedProfileImage(null);

    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];

    setImageUploadError('');
    setImageUploadMessage('');

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please choose an image file.');
      clearSelectedProfileImage();
      return;
    }

    setSelectedProfileImage(file);
  };

  const handleProfileImageUpload = async () => {
    if (!selectedProfileImage || imageUploadLoading) return;

    setImageUploadLoading(true);
    setImageUploadError('');
    setImageUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('image', selectedProfileImage);

      const response = await api.put('/users/me/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data.data;

      setProfile((currentProfile) => ({
        ...currentProfile,
        ...updatedUser,
      }));

      clearSelectedProfileImage();
      setImageUploadMessage(
        response.data.message || 'Profile image updated successfully.'
      );
    } catch (err) {
      console.log('PROFILE IMAGE UPLOAD ERROR:', err.response?.data || err);
      setImageUploadError(
        err.response?.data?.message ||
        'Failed to upload profile image. Please try again.'
      );
    } finally {
      setImageUploadLoading(false);
    }
  };


  const handleRateCompletedBook = async (progress, rating) => {
    if (!progress?._id || ratingLoadingId) return;

    setRatingLoadingId(progress._id);
    setRatingActionError('');
    setRatingActionMessage('');

    try {
      await api.patch(`/reading-progress/${progress._id}/rating`, {
        rating,
      });

      setRatingActionMessage('Book rating saved.');
      await fetchProfileData();
    } catch (err) {
      console.log('PROFILE RATING ERROR:', err.response?.data || err);

      setRatingActionError(
        err.response?.data?.message ||
        'Failed to save rating. Please try again.'
      );
    } finally {
      setRatingLoadingId('');
    }
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

  const currentProfileImage = isOwnProfile
    ? profile.profileImage || user?.profileImage
    : profile.profileImage;
  const displayedProfileImage = profileImagePreview || currentProfileImage;

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-6xl mx-auto">
        <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-10">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex flex-col items-start sm:items-center gap-3">
                  <div className="w-28 h-28 rounded-full bg-cream border border-stone-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {displayedProfileImage ? (
                      <img
                        src={displayedProfileImage}
                        alt={`${profile.username} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-4xl text-stone-400">
                        {initials || '?'}
                      </span>
                    )}
                  </div>

                  {isOwnProfile && (
                    <div className="w-full sm:w-44 space-y-2">
                      <input
                        ref={profileImageInputRef}
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="sr-only"
                      />

                      <label
                        htmlFor="profile-image-upload"
                        className="block cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-stone-500 transition hover:border-accent hover:text-accent"
                      >
                        Change photo
                      </label>

                      {selectedProfileImage && (
                        <div className="space-y-2">
                          <p className="truncate text-center text-xs text-stone-400">
                            {selectedProfileImage.name}
                          </p>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleProfileImageUpload}
                              disabled={imageUploadLoading}
                              className="flex-1 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {imageUploadLoading ? 'Uploading...' : 'Save'}
                            </button>

                            <button
                              type="button"
                              onClick={clearSelectedProfileImage}
                              disabled={imageUploadLoading}
                              className="flex-1 rounded-full border border-stone-200 px-4 py-2 text-xs font-medium text-stone-500 transition hover:border-stone-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {imageUploadError && (
                        <p className="text-center text-xs text-red-500">
                          {imageUploadError}
                        </p>
                      )}

                      {imageUploadMessage && (
                        <p className="text-center text-xs text-accent">
                          {imageUploadMessage}
                        </p>
                      )}
                    </div>
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
                <div className="flex flex-col items-stretch md:items-end gap-3">
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    disabled={deleteAccountLoading}
                    className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit profile
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountLoading}
                    className="px-6 py-3 border border-red-200 text-red-600 text-sm font-medium rounded-full hover:bg-red-50 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteAccountLoading
                      ? 'Deleting account...'
                      : 'Delete account'}
                  </button>

                  {deleteAccountError && (
                    <p className="max-w-xs text-right text-xs text-red-600">
                      {deleteAccountError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-stone-100">
            <div className="p-6 text-center border-b sm:border-b-0 sm:border-r border-stone-100">
              <h2 className="font-serif text-3xl text-accent mb-1">
                {completedBooks.length}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Reading history
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
                {profile.favoriteGenres?.length || 0}
              </h2>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Favorite genres
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
                <h2 className="font-serif text-3xl mb-1">Reading history</h2>
                <p className="text-sm text-stone-500">
                  Books this reader has completed or marked as DNF.
                </p>
                {ratingActionError && (
                  <p className="mt-3 text-sm text-red-500">
                    {ratingActionError}
                  </p>
                )}

                {ratingActionMessage && (
                  <p className="mt-3 text-sm text-accent">
                    {ratingActionMessage}
                  </p>
                )}
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
                        <p className="text-xs text-stone-400 mb-2">
                          {progress.club?.isArchived
                            ? 'Club no longer available'
                            : `Tracked with ${progress.club?.name || 'a book club'}`}
                        </p>
                        {Number(progress.book?.ratingsCount) > 0 && (
                          <p className="text-xs text-stone-400 mb-2">
                            Average rating: {progress.book.averageRating}/5 · {progress.book.ratingsCount}{' '}
                            {progress.book.ratingsCount === 1 ? 'rating' : 'ratings'}
                          </p>
                        )}
                        <span className="inline-block mb-2 px-3 py-1 rounded-full bg-cream border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          {progress.status === 'dnf' ? 'DNF' : 'Completed'}
                        </span>
                        <div className="mt-2">
                          {progress.status === 'completed' ? (
                            <>
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((ratingValue) => {
                                  const isSelected = Number(progress.rating) >= ratingValue;
                                  const canRate = isOwnProfile && ratingLoadingId !== progress._id;

                                  return (
                                    <button
                                      key={ratingValue}
                                      type="button"
                                      onClick={() => handleRateCompletedBook(progress, ratingValue)}
                                      disabled={!isOwnProfile || ratingLoadingId === progress._id}
                                      className={`text-lg leading-none transition ${isSelected ? 'text-accent' : 'text-stone-300'
                                        } ${canRate
                                          ? 'hover:text-accent cursor-pointer'
                                          : 'cursor-default'
                                        }`}
                                      aria-label={`Rate ${progress.book?.title || 'book'} ${ratingValue} out of 5`}
                                      title={
                                        isOwnProfile
                                          ? `Rate ${ratingValue}/5`
                                          : progress.rating
                                            ? `Rating: ${progress.rating}/5`
                                            : 'No rating yet'
                                      }
                                    >
                                      ★
                                    </button>
                                  );
                                })}
                              </div>

                              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                                {ratingLoadingId === progress._id
                                  ? 'Saving rating...'
                                  : progress.rating
                                    ? `Your rating: ${progress.rating}/5`
                                    : isOwnProfile
                                      ? 'Add your rating'
                                      : 'No rating'}
                              </p>
                            </>
                          ) : (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                              Not rated
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm text-center">
                  <p className="text-stone-500 text-sm">
                    No previous books to show yet.
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
                {isOwnProfile
                  ? 'Clubs you created'
                  : `Clubs created by ${profile.username}`}
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
                  {isOwnProfile
                    ? 'You have not created any clubs yet.'
                    : `${profile.username} has not created any public clubs yet.`}
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
