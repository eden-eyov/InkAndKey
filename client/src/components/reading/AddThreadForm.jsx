import { useState } from 'react';

function AddThreadForm({
  totalChapters = 1,
  onCancel,
  onSubmitThread,
}) {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    chapterNumber: 1,
    spoilerFree: false,
  });

  const [error, setError] = useState('');

  const chapterOptions = Array.from(
    { length: totalChapters },
    (_, index) => index + 1
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please add a discussion title.');
      return;
    }

    if (!formData.body.trim()) {
      setError('Please write your comment.');
      return;
    }

    const newThreadData = {
      title: formData.title.trim(),
      body: formData.body.trim(),
      chapterNumber: Number(formData.chapterNumber),
      spoilerFree: formData.spoilerFree,
    };

    onSubmitThread(newThreadData);
  };

  return (
    <section className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/60 shadow-sm mb-8">
      <div className="mb-6">
        <h2 className="font-serif text-2xl mb-1">Start a new discussion</h2>
        <p className="text-sm text-stone-500">
          Share a thought, question, or theory with the club.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="thread-title"
            className="block text-xs uppercase tracking-wider text-stone-500 mb-1"
          >
            Title
          </label>

          <input
            id="thread-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Is the narrator hiding something?"
            className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="thread-body"
            className="block text-xs uppercase tracking-wider text-stone-500 mb-1"
          >
            Comment
          </label>

          <textarea
            id="thread-body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder="Write your thoughts here..."
            rows="4"
            className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="thread-chapter"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-1"
            >
              Chapter
            </label>

            <select
              id="thread-chapter"
              name="chapterNumber"
              value={formData.chapterNumber}
              onChange={handleChange}
              className="w-full p-3 bg-cream border border-stone-200 rounded-xl focus:outline-none focus:border-accent text-sm"
            >
              {chapterOptions.map((chapter) => (
                <option key={chapter} value={chapter}>
                  Chapter {chapter}
                </option>
              ))}
            </select>
          </div>

          <label className="bg-cream border border-stone-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-accent transition">
            <input
              type="checkbox"
              name="spoilerFree"
              checked={formData.spoilerFree}
              onChange={handleChange}
              className="mt-1 accent-[#7D6E5D]"
            />

            <span>
              <span className="block text-sm font-medium text-ink">
                Spoiler-free discussion
              </span>
              <span className="block text-xs text-stone-500 mt-1 leading-relaxed">
                Safe for guests and readers at any chapter.
              </span>
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-stone-500 hover:text-ink transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition"
          >
            Publish discussion
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddThreadForm;