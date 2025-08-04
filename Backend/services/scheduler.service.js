const cron = require('node-cron');
const logger = require('../utils/logger.util');

function startScheduledTasks() {
  cron.schedule('*/10 * * * *', () => {
    logger.log('Running scheduled post publishing task...');
    
  });

  cron.schedule('0 8 * * *', () => {
    logger.log('Running daily draft reminder task...');
    
  });

  cron.schedule('0 9 * * 1', () => {
    logger.log('Running weekly digest task...');
    
  });
}

module.exports = { startScheduledTasks };
