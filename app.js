const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);

// Handle undefined routes (for redirection)
app.get('/:shortCode', urlRoutes);

module.exports = app;
