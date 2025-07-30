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


app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => res.send('API running'));

connectDB();

module.exports = app;