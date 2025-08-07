
exports.register = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  next();
};
exports.login = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  next();
};
exports.forgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  next();
};
exports.createPost = (req, res, next) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: 'Title must be 200 characters or less' });
  }
  if (body.length > 5000) {
    return res.status(400).json({ error: 'Body must be 5000 characters or less' });
  }
  next();
};
exports.updatePost = (req, res, next) => {
  const { title, body } = req.body;
  if (title && title.length > 200) {
    return res.status(400).json({ error: 'Title must be 200 characters or less' });
  }
  if (body && body.length > 5000) {
    return res.status(400).json({ error: 'Body must be 5000 characters or less' });
  }
  next();
};
exports.getPostsQuery = (req, res, next) => {
  const { page, limit, sortBy, status, channel } = req.query;
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({ error: 'Page must be a positive number' });
  }
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 50)) {
    return res.status(400).json({ error: 'Limit must be between 1 and 50' });
  }
  const validSortOptions = ['createdAt', 'newest', 'oldest', 'title', 'scheduledAt', 'publishedAt'];
  if (sortBy && !validSortOptions.includes(sortBy)) {
    return res.status(400).json({ 
      error: `Invalid sortBy option. Valid options are: ${validSortOptions.join(', ')}` 
    });
  }
  const validStatuses = ['draft', 'scheduled', 'published', 'pending', 'rejected', 'all'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` 
    });
  }
  
  next();
};