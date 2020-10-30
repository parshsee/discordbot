const mongoose = require('mongoose');

// Create a schema (template) for the games document (table)
// Unique ensures that the Steam Key is always unique
const gameSchema = mongoose.Schema({
	gameName: { type: String },
	gameKey: { type: String, unique: true },
	gameType: { type: String },
	codeType: { type: String },
});

// Export the model as 'Games' to be used when adding
module.exports = mongoose.model('Games', gameSchema);