require('dotenv').config();
// Require the mongoose package
const mongoose = require('mongoose');

// Export connection to MongoDB
module.exports = mongoose.connect(process.env.DB_URI_2, { useNewUrlParser: true, useUnifiedTopology: true });
