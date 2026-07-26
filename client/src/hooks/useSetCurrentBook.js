import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

import {
  BOOK_SUGGESTION_MIN_QUERY_LENGTH,
  BOOK_SUGGESTION_DEBOUNCE_MS,
  emptySetBookFormErrors,
  buildBookSuggestionQuery,
  getApiErrorMessage,
} from '../utils/clubPageUtils';

const createEmptyNewBookData = () => ({
  title: '',
  author: '',
  totalChapters: '',
  description: '',
  coverImage: '',
  coverImagePublicId: '',
  coverImageDeleteToken: '',
  genres: [],
  googleBooksId: '',
  pageCount: null,
  publishedDate: '',
  language: '',
  infoLink: '',
});

function useSetCurrentBook({
  clubId,
  isCreator,
  onClubUpdated,
  onCommentsReset,
  onCommentsRefresh,
  onClubListsRefresh,
  onCurrentBookRemoved,
}) {
  const [showSetBookForm, setShowSetBookForm] = useState(false);
  const [settingCurrentBook, setSettingCurrentBook] = useState(false);
  const [removingCurrentBook, setRemovingCurrentBook] = useState(false);

  const [newBookData, setNewBookData] = useState(createEmptyNewBookData);
  const [googleBookResults, setGoogleBookResults] = useState([]);
  const [googleBooksLoading, setGoogleBooksLoading] = useState(false);
  const [googleBooksError, setGoogleBooksError] = useState('');
  const [bookSelectionMessage, setBookSelectionMessage] = useState('');
  const [newBookSuggestionsActive, setNewBookSuggestionsActive] =
    useState(false);
  const [suppressedNewBookSearchQuery, setSuppressedNewBookSearchQuery] =
    useState('');

  const [setBookFormErrors, setSetBookFormErrors] = useState(
    emptySetBookFormErrors
  );

  const [newBookCoverUploadLoading, setNewBookCoverUploadLoading] =
    useState(false);
  const [newBookCoverUploadError, setNewBookCoverUploadError] = useState('');

  const newBookDataRef = useRef(newBookData);
  const showSetBookFormRef = useRef(showSetBookForm);
  const bookFormSessionRef = useRef(0);

  const cleanupUploadedBookCover = async (publicId, deleteToken) => {
    if (!publicId || !deleteToken) return;

    try {
      await api.delete('/uploads/image', {
        data: {
          publicId,
          deleteToken,
        },
      });
    } catch (err) {
      console.log('BOOK COVER CLEANUP ERROR:', err.response?.data || err);
    }
  };

  const resetBookFormState = () => {
    const emptyBookData = createEmptyNewBookData();

    newBookDataRef.current = emptyBookData;

    setNewBookData(emptyBookData);
    setGoogleBookResults([]);
    setGoogleBooksError('');
    setGoogleBooksLoading(false);
    setSuppressedNewBookSearchQuery('');
    setNewBookSuggestionsActive(false);
    setSetBookFormErrors(emptySetBookFormErrors);
    setNewBookCoverUploadError('');
    setNewBookCoverUploadLoading(false);
    setBookSelectionMessage('');
  };

  useEffect(() => {
    newBookDataRef.current = newBookData;
  }, [newBookData]);

  useEffect(() => {
    showSetBookFormRef.current = showSetBookForm;
  }, [showSetBookForm]);

  useEffect(() => {
    return () => {
      const currentBookData = newBookDataRef.current;

      if (
        showSetBookFormRef.current &&
        currentBookData.coverImagePublicId &&
        currentBookData.coverImageDeleteToken
      ) {
        void cleanupUploadedBookCover(
          currentBookData.coverImagePublicId,
          currentBookData.coverImageDeleteToken
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!showSetBookForm || !newBookSuggestionsActive) {
      return;
    }

    const query = buildBookSuggestionQuery(newBookData);

    if (
      query.length < BOOK_SUGGESTION_MIN_QUERY_LENGTH ||
      query === suppressedNewBookSearchQuery
    ) {
      setGoogleBookResults([]);
      setGoogleBooksError('');
      setGoogleBooksLoading(false);
      return;
    }

    let isCurrent = true;

    const timer = setTimeout(async () => {
      try {
        setGoogleBooksLoading(true);
        setGoogleBooksError('');

        const { data } = await api.get('/books/google-search', {
          params: { query },
        });

        if (!isCurrent) return;

        setGoogleBookResults(data.data || []);
      } catch (err) {
        if (!isCurrent) return;

        console.log('GOOGLE BOOKS SEARCH ERROR:', err.response?.data || err);

        setGoogleBooksError(
          err.response?.data?.message || 'Failed to search Google Books.'
        );
      } finally {
        if (isCurrent) {
          setGoogleBooksLoading(false);
        }
      }
    }, BOOK_SUGGESTION_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [
    newBookData.author,
    newBookData.title,
    newBookSuggestionsActive,
    showSetBookForm,
    suppressedNewBookSearchQuery,
  ]);

  useEffect(() => {
    if (showSetBookForm) return;

    setGoogleBookResults([]);
    setGoogleBooksError('');
    setGoogleBooksLoading(false);
    setSetBookFormErrors(emptySetBookFormErrors);
    setNewBookSuggestionsActive(false);
    setNewBookCoverUploadError('');
  }, [showSetBookForm]);

  useEffect(() => {
    if (!bookSelectionMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setBookSelectionMessage('');
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [bookSelectionMessage]);

  const handleNewBookFieldsFocus = () => {
    setNewBookSuggestionsActive(true);
  };

  const handleNewBookFieldsBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }

    setNewBookSuggestionsActive(false);
  };

  const handleNewBookChange = (e) => {
    const { name, value } = e.target;

    if (name === 'title' || name === 'author') {
      setNewBookSuggestionsActive(true);
      setSuppressedNewBookSearchQuery('');
      setBookSelectionMessage('');
    }

    const shouldClearUploadedCover =
      name === 'coverImage' &&
      newBookData.coverImagePublicId &&
      value !== newBookData.coverImage;

    if (shouldClearUploadedCover) {
      void cleanupUploadedBookCover(
        newBookData.coverImagePublicId,
        newBookData.coverImageDeleteToken
      );
    }

    if (name === 'coverImage') {
      setNewBookCoverUploadError('');
    }

    setNewBookData((prev) => ({
      ...prev,
      [name]: value,
      ...(shouldClearUploadedCover
        ? {
          coverImagePublicId: '',
          coverImageDeleteToken: '',
        }
        : {}),
    }));

    setSetBookFormErrors((prev) => ({
      ...prev,
      general: '',
      ...(Object.prototype.hasOwnProperty.call(prev, name)
        ? { [name]: '' }
        : {}),
    }));
  };

  const handleNewBookGenreToggle = (genre) => {
    setNewBookData((prev) => {
      const alreadySelected = prev.genres.includes(genre);

      return {
        ...prev,
        genres: alreadySelected
          ? prev.genres.filter((item) => item !== genre)
          : [...prev.genres, genre],
      };
    });
  };

  const handleSelectGoogleBook = (book) => {
    const selectedQuery = buildBookSuggestionQuery(book);
    const previousPublicId = newBookData.coverImagePublicId;
    const previousDeleteToken = newBookData.coverImageDeleteToken;

    if (previousPublicId && previousDeleteToken) {
      void cleanupUploadedBookCover(
        previousPublicId,
        previousDeleteToken
      );
    }

    setNewBookData((prev) => ({
      ...prev,
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      coverImage: book.coverImage || '',
      coverImagePublicId: '',
      coverImageDeleteToken: '',
      googleBooksId: book.googleBooksId || '',
      pageCount: book.pageCount || null,
      publishedDate: book.publishedDate || '',
      language: book.language || '',
      infoLink: book.infoLink || '',
    }));

    setSuppressedNewBookSearchQuery(selectedQuery);
    setNewBookSuggestionsActive(false);
    setGoogleBookResults([]);
    setGoogleBooksError('');
    setNewBookCoverUploadError('');
    setBookSelectionMessage('Book selected.');
    setSetBookFormErrors((prev) => ({
      ...prev,
      general: '',
      title: '',
      author: '',
    }));
  };

  const handleNewBookCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const uploadSession = bookFormSessionRef.current;
    const previousCoverImage = newBookData.coverImage || '';
    const previousPublicId = newBookData.coverImagePublicId || '';
    const previousDeleteToken =
      newBookData.coverImageDeleteToken || '';
    const formData = new FormData();

    formData.append('image', file);

    try {
      setNewBookCoverUploadLoading(true);
      setNewBookCoverUploadError('');

      const { data } = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedImage = data.data;
      const latestBookData = newBookDataRef.current;

      const uploadCanStillApply =
        showSetBookFormRef.current &&
        uploadSession === bookFormSessionRef.current &&
        (latestBookData.coverImage || '') === previousCoverImage &&
        (latestBookData.coverImagePublicId || '') === previousPublicId &&
        (latestBookData.coverImageDeleteToken || '') ===
        previousDeleteToken;

      if (!uploadCanStillApply) {
        if (uploadedImage.publicId && uploadedImage.deleteToken) {
          await cleanupUploadedBookCover(
            uploadedImage.publicId,
            uploadedImage.deleteToken
          );
        }

        return;
      }

      setNewBookData((prev) => ({
        ...prev,
        coverImage: uploadedImage.url || '',
        coverImagePublicId: uploadedImage.publicId || '',
        coverImageDeleteToken: uploadedImage.deleteToken || '',
      }));

      if (
        previousPublicId &&
        previousDeleteToken &&
        previousPublicId !== uploadedImage.publicId
      ) {
        void cleanupUploadedBookCover(
          previousPublicId,
          previousDeleteToken
        );
      }
    } catch (err) {
      console.log('NEW BOOK COVER UPLOAD ERROR:', err.response?.data || err);

      setNewBookCoverUploadError(
        err.response?.data?.message ||
        'Failed to upload cover image. Please try again.'
      );
    } finally {
      setNewBookCoverUploadLoading(false);
    }
  };

  const handleCloseSetBookForm = async () => {
    bookFormSessionRef.current += 1;
    showSetBookFormRef.current = false;
    setShowSetBookForm(false);

    const currentBookData = newBookDataRef.current;

    if (
      currentBookData.coverImagePublicId &&
      currentBookData.coverImageDeleteToken
    ) {
      await cleanupUploadedBookCover(
        currentBookData.coverImagePublicId,
        currentBookData.coverImageDeleteToken
      );
    }

    resetBookFormState();
  };

  const handleToggleSetBookForm = async () => {
    if (showSetBookForm) {
      await handleCloseSetBookForm();
      return;
    }

    bookFormSessionRef.current += 1;
    showSetBookFormRef.current = true;
    setShowSetBookForm(true);
  };

  const handleSetCurrentBook = async (e) => {
    e.preventDefault();

    if (!isCreator) return;

    if (newBookCoverUploadLoading) {
      setNewBookCoverUploadError(
        'Please wait for the cover upload to finish before saving.'
      );
      return;
    }

    const title = newBookData.title.trim();
    const author = newBookData.author.trim();
    const totalChapters = Number(newBookData.totalChapters);
    const nextErrors = { ...emptySetBookFormErrors };

    if (!title) {
      nextErrors.title = 'Book title is required.';
    }

    if (!author) {
      nextErrors.author = 'Author is required.';
    }

    if (!Number.isInteger(totalChapters) || totalChapters < 1) {
      nextErrors.totalChapters =
        'Total chapters is required and must be at least 1.';
    }

    if (
      nextErrors.title ||
      nextErrors.author ||
      nextErrors.totalChapters
    ) {
      setSetBookFormErrors(nextErrors);
      return;
    }

    try {
      setSettingCurrentBook(true);
      setSetBookFormErrors(emptySetBookFormErrors);

      const createBookResponse = await api.post('/books', {
        title,
        author,
        totalChapters,
        description: newBookData.description.trim(),
        coverImage: newBookData.coverImage.trim(),
        coverImagePublicId: newBookData.coverImagePublicId,
        genres: newBookData.genres,
        googleBooksId: newBookData.googleBooksId,
        pageCount: newBookData.pageCount,
        publishedDate: newBookData.publishedDate,
        language: newBookData.language,
        infoLink: newBookData.infoLink,
        club: clubId,
      });

      const createdBook = createBookResponse.data.data;

      const setCurrentBookResponse = await api.patch(
        `/clubs/${clubId}/current-book`,
        {
          book: createdBook._id,
        }
      );

      const updatedClub = setCurrentBookResponse.data.data;

      onClubUpdated?.({
        ...updatedClub,
        userCurrentChapter: 0,
      });

      onCommentsReset?.();

      if (updatedClub.currentBook?._id) {
        await onCommentsRefresh?.(updatedClub.currentBook._id, false);
      }

      onClubListsRefresh?.();

      bookFormSessionRef.current += 1;
      showSetBookFormRef.current = false;
      setShowSetBookForm(false);
      resetBookFormState();
    } catch (err) {
      console.log('SET NEW CURRENT BOOK ERROR:', err.response?.data || err);

      const errorMessage = getApiErrorMessage(
        err,
        'Failed to create and set current book. Please try again.'
      );

      const serverErrors = {
        ...emptySetBookFormErrors,
        general: errorMessage,
      };

      if (/title/i.test(errorMessage)) {
        serverErrors.title = 'Book title is required.';
      }

      if (/author/i.test(errorMessage)) {
        serverErrors.author = 'Author is required.';
      }

      if (/chapter/i.test(errorMessage)) {
        serverErrors.totalChapters =
          'Total chapters is required and must be at least 1.';
      }

      setSetBookFormErrors(serverErrors);
    } finally {
      setSettingCurrentBook(false);
    }
  };

  const handleRemoveCurrentBook = async () => {
    if (!isCreator) return;

    const confirmed = window.confirm(
      'Remove the current book?\n\n' +
      'This will permanently delete:\n' +
      '• the current book\n' +
      '• all discussions\n' +
      '• all replies\n' +
      '• all reading progress\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setRemovingCurrentBook(true);

      const { data } = await api.delete(
        `/clubs/${clubId}/current-book`
      );

      onClubUpdated?.(data.data.club);

      onCommentsReset?.();

      onClubListsRefresh?.();

      bookFormSessionRef.current += 1;
      showSetBookFormRef.current = false;
      setShowSetBookForm(false);

      resetBookFormState();

      onCurrentBookRemoved?.();
    } catch (err) {
      console.log(
        'REMOVE CURRENT BOOK ERROR:',
        err.response?.data || err
      );

      setSetBookFormErrors({
        ...emptySetBookFormErrors,
        general: getApiErrorMessage(
          err,
          'Failed to remove current book.'
        ),
      });
    } finally {
      setRemovingCurrentBook(false);
    }
  };

  return {
    showSetBookForm,
    settingCurrentBook,
    removingCurrentBook,
    newBookData,
    setBookFormErrors,
    googleBookResults,
    googleBooksLoading,
    googleBooksError,
    bookSelectionMessage,
    newBookSuggestionsActive,
    newBookCoverUploadLoading,
    newBookCoverUploadError,

    handleToggleSetBookForm,
    handleCloseSetBookForm,
    handleNewBookChange,
    handleNewBookFieldsFocus,
    handleNewBookFieldsBlur,
    handleSelectGoogleBook,
    handleNewBookCoverUpload,
    handleNewBookGenreToggle,
    handleSetCurrentBook,
    handleRemoveCurrentBook,
  };
}

export default useSetCurrentBook;