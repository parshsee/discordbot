const mongoose = require('mongoose');

// Create a schema (template) for the birthday document (table)
// Require ensures that the field can't be left blank
const birthdaySchema = mongoose.Schema({
	firstName: { type: String, require: true },
	lastName: { type: String, require: true },
	birthday: { type: Date, require: true },
});

// Export the model as 'Birthdays' to be used when adding
module.exports = mongoose.model('Birthdays', birthdaySchema);