require('dotenv').config();
// Require the mongoose package
const mongoose = require('mongoose');

// Export connection to MongoDB
// DB_URL & DB_URI are 2 accounts from MLabs --> Will be shutdown in November
// DB_URI_2 is 1 account from Mongo Atlas, currently in use
module.exports = mongoose.connect(process.env.DB_URI_2, { useNewUrlParser: true, useUnifiedTopology: true });
