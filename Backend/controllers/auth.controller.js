const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const crypto = require('crypto');
const schedulerService = require('../services/scheduler.service');
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
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
    status: 'active',
    isEmailVerified: true  
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
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    const user = new User({ 
      name, 
      email, 
      password, 
      role: role || 'user',
      status: 'pending',
      verificationToken,
      verificationTokenExpires,
      isEmailVerified: false
    });
    
    await user.save();
    try {
      await schedulerService.sendVerificationEmail(email, verificationToken);
      res.status(201).json({ 
        message: 'User registered successfully! Please check your email to verify your account.',
        userId: user._id
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(201).json({ 
        message: 'User registered successfully! However, there was an issue sending the verification email. Please contact support.',
        userId: user._id
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status === 'disabled') {
      return res.status(401).json({ error: 'Account is disabled. Please contact support.' });
    }
    if (user.provider === 'local' && !user.isEmailVerified) {
      return res.status(401).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        needsVerification: true
      });
    }
    if (user.status === 'pending') {
      return res.status(401).json({ 
        error: 'Account is pending verification. Please check your email.',
        needsVerification: true
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isEmailVerified: user.isEmailVerified
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token. Please request a new verification email.' 
      });
    }
    
    user.status = 'active';
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ 
      message: 'Email verified successfully! You can now log in to your account.',
      success: true
    });
    
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Email verification failed. Please try again.' });
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
      return res.status(200).json({ 
        message: 'If an account exists with this email, a verification email will be sent.' 
      });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        error: 'This email address is already verified.' 
      });
    }
    if (user.provider !== 'local') {
      return res.status(400).json({ 
        error: 'Social login accounts do not require email verification.' 
      });
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();
    try {
      await schedulerService.sendVerificationEmail(email, verificationToken);
      res.status(200).json({ 
        message: 'Verification email sent successfully. Please check your inbox.' 
      });
    } catch (emailError) {
      console.error('Resend verification email error:', emailError);
      res.status(500).json({ 
        error: 'Failed to send verification email. Please try again later.' 
      });
    }
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