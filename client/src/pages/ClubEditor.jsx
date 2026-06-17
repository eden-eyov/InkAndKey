import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GENRES from '../utils/genres';

function ClubEditor() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditMode = Boolean(clubId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    genres: [],
    isPublic: true,
  });

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditMode) return;

    const fetchClub = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get(`/clubs/${clubId}`);
        const clubData = data.data;

        const currentUserId = user?.id || user?._id;
        const creatorId = clubData.creator?._id || clubData.creator;

        if (
          currentUserId &&
          creatorId &&
          creatorId.toString() !== currentUserId.toString()
        ) {
          setError('Only the club creator can edit this club.');
          return;
        }

        setClub(clubData);

        setFormData({
          name: clubData.name || '',
          description: clubData.description || '',
          image: clubData.image || '',
          genres: clubData.genres || [],
          isPublic: clubData.isPublic ?? true,
        });
      } catch (err) {
        console.log('FETCH CLUB FOR EDIT ERROR:', err.response?.data || err);

        setError(
          err.response?.data?.message ||
            'Failed to load club details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [clubId, isEditMode, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenreToggle = (genre) => {
    setFormData((prev) => {
      const alreadySelected = prev.genres.includes(genre);

      return {
        ...prev,
        genres: alreadySelected
          ? prev.genres.filter((item) => item !== genre)
          : [...prev.genres, genre],
      };
    });
  };

  const validateForm = () => {
    const trimmedName = formData.name.trim();

    if (trimmedName.length < 2) {
      return 'Club name must be at least 2 characters.';
    }

    if (trimmedName.length > 80) {
      return 'Club name cannot exceed 80 characters.';
    }

    if (formData.description.trim().length > 500) {
      return 'Description cannot exceed 500 characters.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        genres: formData.genres,
        isPublic: formData.isPublic,
      };

      if (isEditMode) {
        const { data } = await api.patch(`/clubs/${clubId}`, payload);
        const updatedClub = data.data;

        navigate(`/clubs/${updatedClub._id || clubId}`);
      } else {
        const { data } = await api.post('/clubs', payload);
        const newClub = data.data;

        navigate(`/clubs/${newClub._id}`);
      }
    } catch (err) {
      console.log('SAVE CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} club. Please try again.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!isEditMode || !club) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this club? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');

      await api.delete(`/clubs/${clubId}`);

      navigate('/clubs');
    } catch (err) {
      console.log('DELETE CLUB ERROR:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          'Failed to delete club. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center">
        <p className="font-serif text-stone-500 italic text-lg animate-pulse">
          Loading club editor...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream font-sans text-ink pt-24 px-6 md:px-12 pb-16">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link
            to={isEditMode ? `/clubs/${clubId}` : '/clubs'}
            className="text-sm text-stone-500 hover:text-accent transition"
          >
            ← {isEditMode ? 'Back to club' : 'Back to clubs'}
          </Link>

          <div className="mt-6 bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {isEditMode ? 'Club management' : 'New club'}
            </span>

            <h1 className="font-serif text-5xl mt-2 mb-3">
              {isEditMode ? 'Edit club' : 'Create a new club'}
            </h1>

            <p className="text-stone-500 max-w-2xl">
              {isEditMode
                ? 'Update your club details, image, and genres.'
                : 'Start a new spoiler-free reading space for your community.'}
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8 space-y-7"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-2"
            >
              Club name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. The Midnight Readers"
              className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-2"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the club, reading style, or community rules..."
              rows="5"
              className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
            />

            <p className="mt-2 text-xs text-stone-400">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="image"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-2"
            >
              Club image URL
            </label>

            <input
              id="image"
              name="image"
              type="text"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/club-image.jpg"
              className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
            />

            {formData.image && (
              <div className="mt-4 bg-cream border border-stone-100 rounded-xl p-4 inline-block">
                <img
                  src={formData.image}
                  alt="Club preview"
                  className="w-32 h-44 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs uppercase tracking-wider text-stone-500 mb-3">
              Genres
            </span>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GENRES.map((genre) => {
                const selected = formData.genres.includes(genre);

                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-4 py-2.5 rounded-full border text-sm transition ${
                      selected
                        ? 'bg-ink text-white border-ink'
                        : 'bg-cream text-stone-600 border-stone-200 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 bg-cream border border-stone-100 rounded-xl p-4 cursor-pointer">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="w-4 h-4 accent-stone-900"
            />

            <span>
              <span className="block text-sm font-medium text-ink">
                Public club
              </span>

              <span className="block text-xs text-stone-500">
                Public clubs can be discovered by guests and other readers.
              </span>
            </span>
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-stone-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={saving || deleting}
                className="px-7 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {saving
                  ? isEditMode
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Save changes'
                    : 'Create club'}
              </button>

              <Link
                to={isEditMode ? `/clubs/${clubId}` : '/clubs'}
                className="px-7 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition text-center"
              >
                Cancel
              </Link>
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={handleDeleteClub}
                disabled={saving || deleting}
                className="px-7 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-full hover:bg-red-100 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete club'}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

export default ClubEditor;