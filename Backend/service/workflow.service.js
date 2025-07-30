const axios = require('axios');

const webhooks = {
  contentApproval: process.env.N8N_CONTENT_APPROVAL_WEBHOOK,
};
exports.triggerWorkflow = async ( workflowName, params = {}) => {
  const url = webhooks[workflowName ];
  if (!url) throw new Error( 'Unknown workflow');
  const  response = await axios.post( url, params);
  return  response.data;
};