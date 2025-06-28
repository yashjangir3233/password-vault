const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  hashedPassword: String,
  twoFASecret: String, // base32 TOTP secret
  is2FAEnabled: { type: Boolean, default: false },
});


module.exports = mongoose.model('User', userSchema);
