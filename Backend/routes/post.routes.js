const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

router.use(auth);

router.post('/', postController.createPost);
router.get('/stats', postController.getPostStats);
router.get('/weekly-digest', postController.getWeeklyDigest); 
router.get('/drafts', postController.getDraftPosts);          
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/review', role('admin'), postController.reviewPost);

module.exports = router;