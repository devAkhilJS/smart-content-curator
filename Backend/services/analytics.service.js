const Post = require('../models/post.model');
const User = require('../models/user.model');

async function getWeeklyAnalytics() {
  const now = new Date();
  const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const totalPosts = await Post.countDocuments({ createdAt: { $gte: lastWeek } });
  const activeUsers = await Post.distinct('author', { createdAt: { $gte: lastWeek } });
  const activeUsersCount = activeUsers.length;
  const topAuthorAgg = await Post.aggregate([
    { $match: { createdAt: { $gte: lastWeek } } },
    { $group: { _id: '$author', posts: { $sum: 1 } } },
    { $sort: { posts: -1 } },
    { $limit: 1 }
  ]);
  let topAuthor = {};
  if (topAuthorAgg.length) {
    const user = await User.findById(topAuthorAgg[0]._id);
    topAuthor = {
      id: user._id,
      name: user.name,
      posts: topAuthorAgg[0].posts
    };
  }
  const failedPosts = await Post.countDocuments({ createdAt: { $gte: lastWeek }, status: 'failed' });

  const dayAgg = await Post.aggregate([
    { $match: { createdAt: { $gte: lastWeek } } },
    { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);
  let mostActiveDay = '';
  if (dayAgg.length) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    mostActiveDay = days[dayAgg[0]._id - 1];
  }

  return {
    totalPosts,
    activeUsers: activeUsersCount,
    topAuthor,
    failedPosts,
    mostActiveDay
  };
}

module.exports = { getWeeklyAnalytics };