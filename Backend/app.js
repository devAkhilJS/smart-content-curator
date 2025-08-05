const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const app = express();
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const adminRoutes = require('./routes/admin.routes');
const workflowRoutes = require('./routes/workflow.routes');
const analyticsRoutes = require('./routes/analytics.routes');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => res.send('API running'));
connectDB();

module.exports = app;