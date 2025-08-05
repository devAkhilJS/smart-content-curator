const Post = require('../models/post.model');

exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const totalPosts = await Post.countDocuments({ author: userId });
    const weeklyPosts = await Post.countDocuments({ author: userId, createdAt: { $gte: lastWeek } });
    const drafts = await Post.countDocuments({ author: userId, status: 'draft' });
    const scheduled = await Post.countDocuments({ author: userId, status: 'scheduled' });
    const published = await Post.countDocuments({ author: userId, status: 'published' });
    const failed = await Post.countDocuments({ author: userId, status: 'failed' });

    res.json({ totalPosts, weeklyPosts, drafts, scheduled, published, failed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};