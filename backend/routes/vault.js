const express = require('express');
const jwt = require('jsonwebtoken');
const Password = require('../models/Password');
const crypto = require('crypto');
const router = express.Router();

const algorithm = 'aes-256-cbc';

function deriveKey(masterPassword) {
  return crypto.scryptSync(masterPassword, 'salt', 32);
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(data, key) {
  const [ivHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

// Middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ msg: 'Unauthorized' });
  }
}

router.post('/add', verifyToken, async (req, res) => {
  const { site, username, password, masterPassword } = req.body;
  const key = deriveKey(masterPassword);
  const encryptedPassword = encrypt(password, key);

  await Password.create({ userId: req.userId, site, username, encryptedPassword });
  res.json({ msg: 'Password saved' });
});

router.get('/', verifyToken, async (req, res) => {
  const entries = await Password.find({ userId: req.userId });
  res.json(entries);
});

router.post('/decrypt/:id', verifyToken, async (req, res) => {
  const { masterPassword } = req.body;
  const entry = await Password.findById(req.params.id);
  if (!entry || entry.userId.toString() !== req.userId) return res.status(404).json({ msg: 'Not found' });

  const key = deriveKey(masterPassword);
  try {
    const decrypted = decrypt(entry.encryptedPassword, key);
    res.json({ password: decrypted });
  } catch {
    res.status(401).json({ msg: 'Wrong master password' });
  }
});


router.put('/:id', verifyToken, async (req, res) => {
  const { site, username, password, masterPassword } = req.body;
  const entry = await Password.findById(req.params.id);

  if (!entry || entry.userId.toString() !== req.userId) {
    return res.status(404).json({ msg: 'Not found' });
  }

  const key = deriveKey(masterPassword);
  try {
    // Verify master password by attempting to decrypt the existing password
    decrypt(entry.encryptedPassword, key);

    const updateData = { site, username };
    if (password) {
      updateData.encryptedPassword = encrypt(password, key);
    }

    await Password.findByIdAndUpdate(req.params.id, updateData);
    res.json({ msg: 'Password updated' });
  } catch (error) {
    res.status(401).json({ msg: 'Wrong master password or decryption failed' });
  }
});

module.exports = router;
