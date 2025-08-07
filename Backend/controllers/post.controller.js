const Post = require('../models/post.model');

exports.createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user.userId,
      status: req.body.status || 'draft',
    };
    delete postData.publishedAt;
    delete postData.approval;
    const validStatuses = ['draft', 'scheduled', 'pending'];
    if (!validStatuses.includes(postData.status)) {
      return res.status(400).json({ error: 'Invalid status for new post. Use draft, scheduled, or pending.' });
    }
    if (postData.status === 'scheduled') {
      if (!postData.scheduledAt) {
        return res.status(400).json({ error: 'Scheduled date and time are required for scheduled posts' });
      }
      const scheduledDate = new Date(postData.scheduledAt);
      
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduled date format' });
      }
      
      const now = new Date();
      if (scheduledDate <= now) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
    }
    const post = new Post(postData);
    await post.save();
    await post.populate('author', 'name email role');
    
    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: 'Failed to create post' });
  }
};
exports.getPosts = async (req, res) => {
  try {
    const {
      status,
      channel,
      search,
      sortBy = 'createdAt',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); 
    const skip = (pageNum - 1) * limitNum;
    let query = {};
    if (req.user.role !== 'admin') {
      query.author = req.user.userId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (channel && channel !== 'all') {
      query.channel = channel;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { body: searchRegex }
      ];
    }
    let sortObject = {};
    switch (sortBy) {
      case 'title':
        sortObject = { title: 1 };
        break;
      case 'scheduledAt':
        sortObject = { scheduledAt: -1, createdAt: -1 };
        break;
      case 'publishedAt':
        sortObject = { publishedAt: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortObject = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortObject = { createdAt: -1 };
        break;
    }
    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name email role')
        .sort(sortObject)
        .skip(skip)
        .limit(limitNum)
        .lean(), 
      Post.countDocuments(query)
    ]);
    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;
    res.json({
      posts,
      total,
      page: pageNum,
      totalPages,
      hasMore,
      limit: limitNum,
      filters: {
        status: status || 'all',
        channel: channel || 'all',
        search: search || '',
        sortBy
      }
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};
exports.getPostById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role')
      .populate('approval.reviewer', 'name email');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (req.user.role !== 'admin' && post.author._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own posts.' });
    }
    res.json(post);
  } catch (err) {
    console.error('Error fetching post by ID:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (req.user.role !== 'admin' && post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role !== 'admin' && ['published', 'pending', 'rejected'].includes(post.status)) {
      return res.status(400).json({ error: 'Cannot edit published or reviewed posts' });
    }
    if (req.user.role !== 'admin') {
      delete req.body.status;
      delete req.body.publishedAt;
    }
    if (req.body.status === 'scheduled') {
      if (!req.body.scheduledAt) {
        return res.status(400).json({ error: 'Scheduled date and time are required for scheduled posts' });
      }
      const scheduledDate = new Date(req.body.scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduled date format' });
      }
      const now = new Date();
      if (scheduledDate <= now) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
    }
    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};
exports.deletePost = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (req.user.role !== 'admin' && post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }
    if (req.user.role !== 'admin') {
      if (['published'].includes(post.status)) {
        return res.status(400).json({ error: 'Cannot delete published posts. Contact an administrator.' });
      }
      if (['pending', 'rejected'].includes(post.status)) {
        return res.status(400).json({ error: 'Cannot delete posts under review. Contact an administrator.' });
      }
    }
    if (post.status === 'scheduled' && post.scheduledAt) {
      console.log(`TODO: Cancel scheduled publishing for post ${post._id} at ${post.scheduledAt}`);
    }

    await post.deleteOne();
    
    res.json({ 
      message: 'Post deleted successfully',
      deletedPost: {
        id: post._id,
        title: post.title,
        status: post.status
      }
    });
  } catch (err) {
    console.error('Error deleting post:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    res.status(500).json({ error: 'Failed to delete post' });
  }
};
exports.duplicatePost = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (req.user.role !== 'admin' && originalPost.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only duplicate your own posts.' });
    }
    const duplicatedPostData = {
      title: `${originalPost.title} (Copy)`,
      body: originalPost.body,
      tags: originalPost.tags ? [...originalPost.tags] : [],
      author: req.user.userId, 
      status: 'draft', 
      channel: originalPost.channel,
      aiGenerated: originalPost.aiGenerated || false,
      scheduledAt: null,
      publishedAt: null,
      approval: null
    };
    const duplicatedPost = new Post(duplicatedPostData);
    await duplicatedPost.save();
    await duplicatedPost.populate('author', 'name email role');

    res.status(201).json({
      message: 'Post duplicated successfully',
      post: duplicatedPost,
      originalPostId: req.params.id
    });
  } catch (err) {
    console.error('Error duplicating post:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid post data for duplication' });
    }
    res.status(500).json({ error: 'Failed to duplicate post' });
  }
};
exports.reviewPost = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { action, comment } = req.body; 
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!['pending'].includes(post.status)) return res.status(400).json({ error: 'Only pending posts can be reviewed' });

    if (action === 'approve') {
      post.status = 'scheduled';
    } else if (action === 'reject') {
      post.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    post.approval = {
      reviewer: req.user.userId,
      reviewedAt: new Date(),
      comment,
    };
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.getWeeklyDigest = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    let query = { createdAt: { $gte: since } };
    if (req.user.role !== 'admin') {
      query.author = req.user.userId;
    }
    const posts = await Post.find(query)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      total: posts.length,
      posts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getDraftPosts = async (req, res) => {
  try {
    let query = { status: 'draft' };
    if (req.user.role !== 'admin') {
      query.author = req.user.userId;
    }
    const drafts = await Post.find(query)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ drafts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getPostStats = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.author = req.user.userId;
    }
    const [
      totalPosts,
      draftPosts,
      scheduledPosts,
      publishedPosts,
      pendingPosts,
      rejectedPosts
    ] = await Promise.all([
      Post.countDocuments(query),
      Post.countDocuments({ ...query, status: 'draft' }),
      Post.countDocuments({ ...query, status: 'scheduled' }),
      Post.countDocuments({ ...query, status: 'published' }),
      Post.countDocuments({ ...query, status: 'pending' }),
      Post.countDocuments({ ...query, status: 'rejected' })
    ]);
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const recentPosts = await Post.countDocuments({
      ...query,
      createdAt: { $gte: since }
    });
    res.json({
      total: totalPosts,
      draft: draftPosts,
      scheduled: scheduledPosts,
      published: publishedPosts,
      pending: pendingPosts,
      rejected: rejectedPosts,
      recent: recentPosts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};