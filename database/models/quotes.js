const mongoose = require('mongoose');

// Create a schema (template) for the quotes document (table)
// Default ensures that if blank, inserts a value automatically
const quotesSchema = mongoose.Schema({
	id: { type: Number, required: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	quote: { type: String, requirequiredre: true },
	timestamp: { type: Date, required: true, default: Date.now },
});

// Export the model as 'Quotes' to be used when adding
module.exports = mongoose.model('Quotes', quotesSchema);