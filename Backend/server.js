const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGO_URI ? 'Loaded' : 'Not loaded'}`);
});