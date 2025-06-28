const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  site: String,
  username: String,
  encryptedPassword: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Password', passwordSchema);
