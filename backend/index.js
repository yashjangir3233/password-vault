const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const vaultRoutes = require('./routes/vault');

app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));