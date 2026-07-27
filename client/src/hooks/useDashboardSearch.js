import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function useDashboardSearch({
  clubs,
  currentlyReading,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setUserSearchResults([]);
      setUserSearchError('');
      setUserSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setUserSearchLoading(true);
        setUserSearchError('');

        const response = await api.get('/users/search', {
          params: {
            username: trimmedQuery,
          },
          signal: controller.signal,
        });

        setUserSearchResults(
          Array.isArray(response.data.data)
            ? response.data.data
            : []
        );
      } catch (err) {
        if (
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }

        console.log(
          'DASHBOARD USER SEARCH ERROR:',
          err.response?.data || err
        );

        setUserSearchResults([]);
        setUserSearchError(
          err.response?.data?.message ||
            'Could not search for readers.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setUserSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const filteredClubs = useMemo(() => {
    const clubList = Array.isArray(clubs) ? clubs : [];

    if (!normalizedSearchQuery) {
      return clubList;
    }

    return clubList.filter((club) => {
      const searchableText = [
        club.name,
        club.description,
        club.currentBookTitle,
        club.currentBook?.title,
        club.currentBook?.author,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [clubs, normalizedSearchQuery]);

  const filteredCurrentReads = useMemo(() => {
    const currentReadsList = Array.isArray(currentlyReading)
      ? currentlyReading
      : [];

    if (!normalizedSearchQuery) {
      return currentReadsList;
    }

    return currentReadsList.filter((progress) => {
      const searchableText = [
        progress.book?.title,
        progress.book?.author,
        progress.club?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [currentlyReading, normalizedSearchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    normalizedSearchQuery,

    userSearchResults,
    userSearchLoading,
    userSearchError,

    filteredClubs,
    filteredCurrentReads,
  };
}

export default useDashboardSearch;