const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');


router.post('/trigger', workflowController.triggerWorkflow);

module.exports = router;