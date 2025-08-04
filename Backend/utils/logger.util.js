const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/app.log');

function log(message) {
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(entry.trim());
}

module.exports = { log };
