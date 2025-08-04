const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid credentials or account disabled' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'the link has been sent to your account.' });
    }

    
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    

    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });
    const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `<p>You requested a password reset. <a href="${resetUrl}">Click here to reset your password</a></p>`,
    });

    res.status(200).json({ message: 'the link has been sent to your account.' });
  } catch (err) {
    console.error('Forgot Password Error:', err); 
    res.status(500).json({ error: err.message });
  }
};