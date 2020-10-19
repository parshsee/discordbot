const mongoose = require('mongoose');

// Create a schema (template) for the Streamer document (table)
const streamersSchema = mongoose.Schema({
	id: { type: Number, required: true },
	streamerName: { type: String, required: true },
	gameTitle: { type: String },
	status: { type: String },
});

// Export the model as 'Streamers' to be used when adding
module.exports = mongoose.model('Streamers', streamersSchema);