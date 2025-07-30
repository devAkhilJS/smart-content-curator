const Post = require('../models/post.model');

exports.createPost = async (req, res) => {
  try {
    const post = new Post({
      ...req.body,
      author: req.user.userId,
      status: req.body.status || 'draft',
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.author = req.user.userId;
    }
    if (req.query.status) query.status = req.query.status;
    const posts = await Post.find(query).populate('author', 'name email role').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email role');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (req.user.role !== 'admin' && post.author._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (req.user.role !== 'admin' && post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role !== 'admin' && post.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft posts' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
