const axios = require('axios');

const webhooks = {
  contentApproval: process.env.N8N_CONTENT_APPROVAL_WEBHOOK,
  postScheduler: process.env.N8N_POST_SCHEDULER_WEBHOOK,
  weeklyDigest: process.env.N8N_WEEKLY_DIGEST_WEBHOOK,
  draftReminder: process.env.N8N_DRAFT_REMINDER_WEBHOOK,
  analyticsReport: process.env.N8N_ANALYTICS_REPORT_WEBHOOK,
};
exports.triggerWorkflow = async ( workflowName, params = {}) => {
  const url = webhooks[workflowName ];
  if (!url) throw new Error( 'Unknown workflow');
  const  response = await axios.post( url, params);
  return  response.data;
};