// const mongoose = require('mongoose');

// const passwordSchema = new mongoose.Schema({
//   userId: mongoose.Schema.Types.ObjectId,
//   site: String,
//   username: String,
//   encryptedPassword: String,
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Password', passwordSchema);

const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  site: { type: String, required: true },
  username: { type: String, required: true },
  encryptedPassword: { type: String, required: true },
  encryptedNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Password', passwordSchema);