const mongoose = require('mongoose');

// Create a schema (template) for the event document (table)
// Array ensures that it is stored in an array, could be optional if no other people join
const eventSchema = mongoose.Schema({
	eventId: { type: Number, requried: true },
	eventName: { type: String, required: true },
	eventDate: { type: Date, required: true },
	eventAuthor: { type: String, required: true },
	eventPeople: [{ type: String }],
	reminderType: { type: String, requried: true },
});

// Export the model as 'Events' to be used when adding
module.exports = mongoose.model('Events', eventSchema);