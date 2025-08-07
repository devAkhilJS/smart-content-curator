const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

router.use(auth);

router.post('/', validate.createPost, postController.createPost);
router.get('/stats', postController.getPostStats);
router.get('/weekly-digest', postController.getWeeklyDigest); 
router.get('/drafts', postController.getDraftPosts);          
router.get('/', validate.getPostsQuery, postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', validate.updatePost, postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/duplicate', postController.duplicatePost);
router.post('/:id/review', role('admin'), postController.reviewPost);

module.exports = router;