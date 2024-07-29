const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const BASE_URL = process.env.BASE_URL;
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();


  

// Middleware
app.use(cors({
    origin: `${BASE_URL}`, // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization','x-auth-token'],
    credentials: true,
}));

app.options('*', cors()); 

app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
