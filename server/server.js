// const express = require("express")
// const path = require("path")
// const CryptoJS = require("crypto-js")
// const app = express()
// app.use(express.json())

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});