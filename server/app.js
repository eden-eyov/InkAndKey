// const dotenv = require("dotnev").config()
// const port = process.env.PORT
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// routes imports
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const bookRoutes = require('./routes/bookRoutes');
const readingProgressRoutes = require('./routes/readingProgressRoutes');
const commentRoutes = require('./routes/commentRoutes');

// middleware imports
const errorHandler = require('./middleware/errorHandler');
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reading-progress', readingProgressRoutes);
app.use('/api/comments', commentRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ink & Key API is running',
  });
});
app.use(errorHandler);
module.exports = app;