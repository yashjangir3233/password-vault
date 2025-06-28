const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');


router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ email, hashedPassword });
    res.status(201).json({ msg: 'User created' });
  } catch (err) {
    res.status(400).json({ msg: 'User exists' });
  }
});

router.post('/login', async (req, res) => {
  try{

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
  }catch(err){
    res.status(500).json({error:err.message})
  }
});

// router.post('/login', async (req, res) => {
//   try{

//   const { email, password, token } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

//   const isMatch = await bcrypt.compare(password, user.hashedPassword);
//   if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

//   // If 2FA is enabled, verify token
//   if (user.is2FAEnabled) {
//     const isValidToken = speakeasy.totp.verify({
//       secret: user.twoFASecret,
//       encoding: 'base32',
//       token,
//     });
//     if (!isValidToken) return res.status(401).json({ msg: '2FA token invalid' });
//   }

//   const jwtToken = jwt.sign({ userId: user._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
//   res.json({ token: jwtToken, userId: user._id });
//   }catch(err){
//     res.status(500).json({error:err.message})
//   }
// });


router.get('/2fa/setup', async (req, res) => {
  const userId = req.query.userId; // From frontend after login
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: 'User not found' });

  const secret = speakeasy.generateSecret({ name: `MyVault (${user.email})` });

  user.twoFASecret = secret.base32;
  await user.save();

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    res.json({ qrCodeUrl: data_url });
  });
});

router.post('/2fa/verify', async (req, res) => {
  const { userId, token } = req.body;
  const user = await User.findById(userId);
  if (!user || !user.twoFASecret) return res.status(400).json({ msg: 'Setup required' });

  const verified = speakeasy.totp.verify({
    secret: user.twoFASecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    user.is2FAEnabled = true;
    await user.save();
    return res.json({ msg: '2FA enabled' });
  }

  res.status(400).json({ msg: 'Invalid token' });
});


module.exports = router;
