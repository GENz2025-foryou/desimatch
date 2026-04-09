const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

// Twilio configuration (replace with your credentials)
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone.startsWith('+91')) {
      return res.status(400).json({ error: 'Only Indian numbers (+91) allowed' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    // In production, store OTP in Redis with expiry
    req.session = req.session || {};
    req.session.otp = otp;
    req.session.phone = phone;

    await client.messages.create({
      body: `Your DesiMatch OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, phone } = req.body;
    
    if (req.session.otp != otp || req.session.phone != phone) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/face-verify', async (req, res) => {
  try {
    const { userId, selfie } = req.body;
    
    // Simple face verification logic (integrate with face-api.js or AWS Rekognition)
    const isVerified = true; // Replace with actual AI verification
    
    await User.findByIdAndUpdate(userId, {
      selfie,
      isVerified: true,
      verifiedAt: new Date()
    });

    res.json({ success: true, verified: isVerified });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;