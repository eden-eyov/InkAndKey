import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Onboarding() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [bookInput, setBookInput] = useState('');
  const [favoriteBooks, setFavoriteBooks] = useState([]);

  // SERVER TODO:
  // This file is currently only used for frontend preview.
  // When working on the server, we need to send it with FormData
  // and handle it with Multer on the backend.
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const availableGenres = [
    'Fantasy',
    'Science Fiction',
    'Romance',
    'Thriller',
    'Historical Fiction',
    'Non-Fiction',
    'Mystery',
    'Classics',
    'Horror',
  ];

  const handleGenreToggle = (genre) => {
    setSelectedGenres((prevGenres) => {
      if (prevGenres.includes(genre)) {
        return prevGenres.filter((g) => g !== genre);
      }

      return [...prevGenres, genre];
    });
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    setError('');

    const cleanBookName = bookInput.trim();

    if (!cleanBookName) return;

    if (favoriteBooks.includes(cleanBookName)) {
      setError('This book is already in your list.');
      return;
    }

    if (favoriteBooks.length >= 3) {
      setError('You can add up to 3 favorite books.');
      return;
    }

    setFavoriteBooks((prevBooks) => [...prevBooks, cleanBookName]);
    setBookInput('');
  };

  const handleRemoveBook = (bookToRemove) => {
    setFavoriteBooks((prevBooks) =>
      prevBooks.filter((book) => book !== bookToRemove)
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // SERVER TODO:
    // Later, validate file size/type also on the backend.
    // Frontend accept="image/jpeg, image/png, image/webp" helps the user,
    // but the real validation must happen in Multer/server middleware.
    setProfileImage(file);

    // This creates a temporary local preview only.
    // It does not upload or save the image.
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // SERVER TODO:
      // Right now we send only JSON because the backend is not ready.
      // When working on the server and adding Multer,
      // replace this JSON request with FormData:
      //
      // const onboardingData = new FormData();
      // onboardingData.append('genres', JSON.stringify(selectedGenres));
      // onboardingData.append('favoriteBooks', JSON.stringify(favoriteBooks));
      //
      // if (profileImage) {
      //   onboardingData.append('avatar', profileImage);
      // }
      //
      // await api.put('/users/profile', onboardingData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      await api.put('/users/profile', {
        genres: selectedGenres,
        favoriteBooks,
      });

      // SERVER TODO:
      // Make sure the backend route PUT /users/profile exists,
      // is protected with JWT middleware,
      // and updates the logged-in user's genres, favoriteBooks, and avatar.
      navigate('/dashboard');
    } catch (err) {
      // TEMPORARY DESIGN TEST ONLY:
      // If the backend is not running yet and you want to continue
      // checking the frontend flow, uncomment these two lines:
      //
      navigate('/dashboard');
      return;

      setError(
        err.response?.data?.message ||
          'Failed to save profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-ink pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-stone-200/60 shadow-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl mb-3">Welcome to Ink & Key</h1>
          <p className="text-stone-500 text-sm">
            Let&apos;s personalize your reading experience.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="flex flex-col items-center">
            <div className="relative group cursor-pointer mb-3">
              <div className="w-24 h-24 rounded-full bg-cream border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden transition group-hover:border-accent">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-stone-300">+</span>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload profile picture"
              />
            </div>

            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Upload Avatar
            </span>

            {profileImage && (
              <span className="text-xs text-stone-400 mt-2">
                {profileImage.name}
              </span>
            )}
          </section>

          <section>
            <h2 className="font-serif text-xl mb-1">
              What do you love to read?
            </h2>

            <p className="text-xs text-stone-400 mb-4">
              Select all your favorite genres.
            </p>

            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-4 py-2 rounded-full text-sm transition border ${
                    selectedGenres.includes(genre)
                      ? 'bg-accent border-accent text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-accent hover:text-accent'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl mb-1">Top 3 Favorite Books</h2>

            <p className="text-xs text-stone-400 mb-4">
              Add some books you absolutely loved.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g., The Secret History"
                value={bookInput}
                onChange={(e) => setBookInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddBook(e);
                  }
                }}
                disabled={favoriteBooks.length >= 3}
                className="flex-grow p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm disabled:opacity-50"
              />

              <button
                type="button"
                onClick={handleAddBook}
                disabled={favoriteBooks.length >= 3}
                className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {favoriteBooks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {favoriteBooks.map((book) => (
                  <div
                    key={book}
                    className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg text-sm text-stone-700"
                  >
                    <span>{book}</span>

                    <button
                      type="button"
                      onClick={() => handleRemoveBook(book)}
                      className="text-stone-400 hover:text-red-500 font-bold"
                      aria-label={`Remove ${book}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="pt-6 border-t border-stone-100 flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-stone-500 hover:text-ink transition"
            >
              Skip for now
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-ink text-white font-medium rounded-full hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;