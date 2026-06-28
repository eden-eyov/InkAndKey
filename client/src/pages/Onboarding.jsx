import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [bookInput, setBookInput] = useState('');
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const displayedProfileImage = imagePreview || user?.profileImage || '';

  // Available genres to choose from
  const availableGenres = [
    'Fantasy', 'Science Fiction', 'Romance', 'Thriller',
    'Historical Fiction', 'Non-Fiction', 'Mystery', 'Classics', 'Horror'
  ];
  useEffect(() => {
    if (!user) return;

    setSelectedGenres(user.favoriteGenres || []);
    setFavoriteBooks(user.favoriteBooks || []);
  }, [user]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

    const trimmedBook = bookInput.trim();

    if (!trimmedBook) return;

    if (favoriteBooks.includes(trimmedBook)) {
      setError('This book is already in your list');
      return;
    }

    if (favoriteBooks.length >= 3) {
      setError('You can add up to 3 favorite books');
      return;
    }

    setFavoriteBooks((prevBooks) => [...prevBooks, trimmedBook]);
    setBookInput('');
  };

  const handleRemoveBook = (bookToRemove) => {
    setFavoriteBooks((prevBooks) =>
      prevBooks.filter((book) => book !== bookToRemove)
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setError('');
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const profileResponse = await api.patch('/auth/me', {
        favoriteGenres: selectedGenres,
        favoriteBooks,
      });

      const profileUser =
        profileResponse.data.data || profileResponse.data.user || {};

      let finalUpdatedUser = profileUser;

      if (profileImage) {
        const formData = new FormData();
        formData.append('image', profileImage);

        const imageResponse = await api.put('/users/me/profile-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const imageUser =
          imageResponse.data.data || imageResponse.data.user || {};

        finalUpdatedUser = {
          ...profileUser,
          ...imageUser,
        };
      }

      if (finalUpdatedUser && updateUser) {
        updateUser(finalUpdatedUser);
      }

      navigate('/dashboard');
    } catch (err) {
      console.log('ONBOARDING ERROR:', err.response?.data || err);
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
          <p className="text-stone-500 text-sm">Let's personalize your reading experience.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Section 1: Profile Picture */}
          <section className="flex flex-col items-center">
            <div className="relative group cursor-pointer mb-3">
              <div className="w-24 h-24 rounded-full bg-cream border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden transition group-hover:border-accent">
                {displayedProfileImage ? (
                  <img
                    src={displayedProfileImage}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-stone-300">+</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload profile picture"
              />
            </div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Upload Avatar</span>
            {profileImage && (
              <span className="text-xs text-stone-400 mt-2">
                {profileImage.name}
              </span>
            )}
          </section>

          {/* Section 2: Favorite Genres */}
          <section>
            <h2 className="font-serif text-xl mb-1">What do you love to read?</h2>
            <p className="text-xs text-stone-400 mb-4">Select all your favorite genres.</p>

            <div className="flex flex-wrap gap-2">
              {availableGenres.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-4 py-2 rounded-full text-sm transition border ${selectedGenres.includes(genre)
                    ? 'bg-accent border-accent text-white'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-accent hover:text-accent'
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Favorite Books */}
          <section>
            <h2 className="font-serif text-xl mb-1">Top 3 Favorite Books</h2>
            <p className="text-xs text-stone-400 mb-4">Add some books you absolutely loved.</p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder={
                  favoriteBooks.length >= 3
                    ? 'You can add up to 3 books'
                    : 'e.g., The Secret History'
                }
                value={bookInput}
                onChange={(e) => setBookInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBook(e)}
                disabled={favoriteBooks.length >= 3}
                className="flex-grow p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleAddBook}
                disabled={favoriteBooks.length >= 3}
                className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Display added books as tags */}
            {favoriteBooks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {favoriteBooks.map((book) => (
                  <div key={book} className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg text-sm text-stone-700">
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

          {/* Submit Area */}
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