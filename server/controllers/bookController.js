const Book = require('../models/Book');
const Club = require('../models/Club');
const {
  safelyDeleteManagedBookCover,
} = require('../utils/cloudinaryImages');


const searchGoogleBooks = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    if (!process.env.GOOGLE_BOOKS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Books API key is not configured',
      });
    }

    const encodedQuery = encodeURIComponent(query.trim());

    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=10&key=${process.env.GOOGLE_BOOKS_API_KEY}`;

    const googleResponse = await fetch(googleBooksUrl);

    if (!googleResponse.ok) {
      return res.status(502).json({
        success: false,
        message: 'Failed to search Google Books',
      });
    }

    const googleData = await googleResponse.json();

    const books = (googleData.items || []).map((item) => {
      const volumeInfo = item.volumeInfo || {};

      return {
        googleBooksId: item.id || '',
        title: volumeInfo.title || '',
        author: Array.isArray(volumeInfo.authors)
          ? volumeInfo.authors.join(', ')
          : 'Unknown author',
        authors: volumeInfo.authors || [],
        description: volumeInfo.description || '',
        coverImage:
          volumeInfo.imageLinks?.thumbnail ||
          volumeInfo.imageLinks?.smallThumbnail ||
          '',
        pageCount: volumeInfo.pageCount || null,
        publishedDate: volumeInfo.publishedDate || '',
        language: volumeInfo.language || '',
        infoLink: volumeInfo.infoLink || '',
        categories: volumeInfo.categories || [],
      };
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const club = await Club.findById(req.body.club);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can add books to this club',
      });
    }

    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBooks = async (req, res, next) => {
  try {
    const { club, search, genre } = req.query;

    const filter = {};

    if (club) {
      filter.club = club;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre) {
      filter.genres = genre;
    }

    const books = await Book.find(filter)
      .populate('club', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'club',
      'name image creator'
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const club = await Club.findById(book.club);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can update this book',
      });
    }

    const oldCoverImagePublicId = book.coverImagePublicId;

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('club', 'name image');

    if (
      oldCoverImagePublicId &&
      oldCoverImagePublicId !== updatedBook.coverImagePublicId
    ) {
      await safelyDeleteManagedBookCover(
        oldCoverImagePublicId,
        `replaced book cover ${book._id}`
      );
    }

    res.status(200).json({
      success: true,
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const club = await Club.findById(book.club);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can delete this book',
      });
    }

    if (club.currentBook && club.currentBook.toString() === book._id.toString()) {
      club.currentBook = null;
      await club.save();
    }

    club.previousBooks = club.previousBooks.filter(
      (bookId) => bookId.toString() !== book._id.toString()
    );
    await club.save();

    await Book.findByIdAndDelete(req.params.id);

    await safelyDeleteManagedBookCover(
      book.coverImagePublicId,
      `deleted book cover ${book._id}`
    );

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchGoogleBooks,
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
};
