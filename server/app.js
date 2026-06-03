// const dotenv = require("dotnev").config()
// const port = process.env.PORT
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ink & Key API is running',
  });
});

module.exports = app;