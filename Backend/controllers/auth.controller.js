const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const findOrCreateSocialUser = async (profile, provider) => {
  const { id, email, name, picture } = profile;
  
  let user = await User.findOne({ 
    [`${provider}Id`]: id 
  });
  
  if (user) {
    return user;
  }
  user = await User.findOne({ email });
  
  if (user) {
    user[`${provider}Id`] = id;
    if (picture && !user.profilePicture) {
      user.profilePicture = picture;
    }
    await user.save();
    return user;
  }
  const userData = {
    name,
    email,
    [`${provider}Id`]: id,
    provider,
    status: 'active'
  };
  
  if (picture) {
    userData.profilePicture = picture;
  }
  
  user = new User(userData);
  await user.save();
  return user;
};

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
    const token = generateToken(user._id, user.role);
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
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    console.error('Reset Password Error:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If an account exists, verification email will be sent' });
    }
    res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (err) {
    console.error('Resend Verification Error:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.googleAuth = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=profile email`;
  res.redirect(googleAuthUrl);
};
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'SOCIAL_LOGIN_ERROR',
                error: 'Access denied. Please try again.'
              }, '${process.env.FRONTEND_URL}');
              window.close();
            </script>
          </body>
        </html>
      `);
    }
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });
    const { access_token } = tokenResponse.data;
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = {
      id: profileResponse.data.id,
      email: profileResponse.data.email,
      name: profileResponse.data.name,
      picture: profileResponse.data.picture,
    };
    const user = await findOrCreateSocialUser(profile, 'google');
    const token = generateToken(user._id, user.role);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'SOCIAL_LOGIN_SUCCESS',
              token: '${token}'
            }, '${process.env.FRONTEND_URL}');
            window.close();
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'SOCIAL_LOGIN_ERROR',
              error: 'OAuth authentication failed. Please try again.'
            }, '${process.env.FRONTEND_URL}');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
};