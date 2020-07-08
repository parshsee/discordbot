const mongoose = require('mongoose');

// Create a schema (template) for the quotes document (table)
// Default ensures that if blank, inserts a value automatically
const quotesSchema = mongoose.Schema({
	id: { type: Number, require: true },
	firstName: { type: String, require: true },
	lastName: { type: String, require: true },
	quote: { type: String, require: true },
	timestamp: { type: Date, require: true, default: Date.now },
});

// Export the model as 'Quotes' to be used when adding
module.exports = mongoose.model('Quotes', quotesSchema);