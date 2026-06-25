// const dotenv = require("dotnev").config()
// const port = process.env.PORT
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// routes imports
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const pollRoutes = require('./routes/pollRoutes');
const bookRoutes = require('./routes/bookRoutes');
const readingProgressRoutes = require('./routes/readingProgressRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');


// middleware imports
const errorHandler = require('./middleware/errorHandler');
const app = express();

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api', generalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/clubs/:clubId/polls', pollRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reading-progress', readingProgressRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ink & Key API is running',
  });
});
app.use(errorHandler);
module.exports = app;
