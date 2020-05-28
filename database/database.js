require('dotenv').config();
// Require the mongoose package
const mongoose = require('mongoose');

// Export connection to MongoDB
module.exports = mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
