const Quote = require('../database/models/quotes');

async function addQuote(message, args) {
	// Check if first and last name are strings
	if(!isNaN(args[0]) || !isNaN(args[1])) {
		return message.channel.send('Please enter a valid name');
	}

	// Gets the first & last names (capitalizing the first letter in each)
	// The rest of the args should be the quote
	// Replace any occurence of quotes special char (")
	const userFirstName = args[0].charAt(0).toUpperCase() + args[0].slice(1);
	const userLastName = args[1].charAt(0).toUpperCase() + args[1].slice(1);
	const userQuote = args.slice(2).join(' ').replace(/["]+/g, '');

	// Create a query getting all documents, sorting by id
	// Await the query to the array of document objects
	const query = Quote.find().sort({ id: 1 });
	const doc = await query;

	// Check if the array is empty (meaning nothing in db)
	// True = Get the id of the last entry and add 1
	// False = Set the id to 1
	const idNumber = doc.length ? doc[doc.length - 1].id + 1 : 1;

	// Construct a new quote document from the model
	const quote = new Quote({
		id: idNumber,
		firstName: userFirstName,
		lastName: userLastName,
		quote: userQuote,
	});

	// Save the Quote to the database
	(async () => {
		try {
			await quote.save();
			console.log('Quote added to Database');
			return message.channel.send('Quote Added Successfully');
		} catch (err) {
			console.log('error: ' + err);
			return message.channel.send('Error saving quote.');
		}
	})();


}

async function removeQuote(message, args) {
	// Check if id is a number
	if(isNaN(args[0])) return message.channel.send('Please enter a valid ID number');

	// Get the id number from the args
	const idNumber = args[0];

	// Create a query finding and deleting the doc with the id number
	// Await the query to get the document that was deleted
	const query = Quote.findOneAndDelete({ id: idNumber });
	const doc = await query;

	// If document is null (search result failed) return error message
	if(!doc) return message.channel.send('Quote could not be found. Please make sure the quote is in ia!quotes and that it is typed correctly ');

	// Destructure the first and last name from the doc object
	const { firstName, lastName } = doc;

	// Call to update the ids for the remaining docs
	updateCollectionIDs();

	console.log('Quote removed from Database');
	// Return a message saying deletion was successful
	return message.channel.send(`${firstName} ${lastName}'s quote has been removed from database.`);

}

// After removing a quote, go through the collection
// Update all ids to be in order
// Solves issue of having ids [1, 2, 3, 4] deleting id 3, and now ids show as [1, 2, 4]
async function updateCollectionIDs() {
	// Get number of documents in collection
	const numberOfDocs = await Quote.countDocuments();

	for(let i = 0; i < numberOfDocs; i++) {
		// Find all documents matching the condition (id > i)
		// Update the first documents id to be i + 1
		// Function takes a filter, an update, and a callback
		Quote.updateOne(
			{ id: { $gt:i } },
			{ id: i + 1 },
			(err) => {
				if (err) console.log(err);
			});
	}


}

module.exports = {
	name: 'quote',
	aliases: [],
	description: 'Adds or Removes a quote from the bot',
	args: true,
	usage: 'add [first name] [last name] [quote] --- Adds a quote to the bot' +
				'\n**•**ia!quote remove [ID] --- Removes a quote from the bot',
	execute(message, args) {
		// Get the first argument and remove it from array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 3 args)
			if(args.length < 3) {
				return message.channel.send('Command needs at least four (4) arguments, run help command for more info');
			}
			// Call addQuote function to add to database
			addQuote(message, args);
		} else if(firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 1 args)
			if(args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run help command for more info');
			}
			// Call removeQuote function to remove from database
			removeQuote(message, args);
		} else {
			return message.channel.send('Add or Remove not found. Use ia!help [command] for proper usage');
		}
	},
};