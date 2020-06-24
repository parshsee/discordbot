const mongoose = require('mongoose');

// Create a schema (template) for the games document (table)
// Unique ensures that the Steam Key is always unique
const quotesSchema = mongoose.Schema({
	id: { type: Number, require: true },
	firstName: { type: String, require: true },
	lastName: { type: String, require: true },
	quote: { type: String, require: true },
	timestamp: { type: Date, require: true },
});

// Export the model as 'Games' to be used when adding
module.exports = mongoose.model('Quotes', quotesSchema);