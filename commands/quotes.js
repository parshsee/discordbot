const Quote = require('../database/models/quotes');
const Discord = require('discord.js');

// Creates a embedded with 3 columns: ID, Quote, Name
// Uses information from array of documents
// Sends embedded back to channel
function createEmbeddedColumns(message, doc, embed) {
	// The limit of how many quotes can be in an embed
	// Only have 25 fields
	// Need to set the ID, Quote, and Name each column is a different field (so 3)
	// 8 * 3 = 24, Only 8 quotes can be in an embed at a time
	let limit = 8;

	// Loop through the array of docs getting the quote object and index
	doc.forEach((quote, index) => {
		// If the index = the limit
		if (index === limit) {
			// Ternary Operator, set initial title for first embed and the titles for the others
			embed.setTitle(index === 8 ? 'All Quotes' : 'All Quotes Cont.');
			// Increase the limit
			limit += 8;
			// Wait for the embed to be send
			// forEach function doesn't need it to be await for some reason
			message.channel.send({ embed });
			// Clear all fields from the embed
			// Allows me to add another 25 fields
			embed.fields = [];
		}

		// If the remainder is 0, indicates that this will be the first row in embed, set titles
		if (index % 8 === 0) {
			embed.addField('ID', `${quote.id}`, true);
			embed.addField('Quote', `"${quote.quote}"`, true);
			embed.addField('Person', `${quote.firstName} ${quote.lastName}`, true);
			// Else its not the first row, titles can be blank
		} else {
			embed.addField('\u200b', `${quote.id}`, true);
			embed.addField('\u200b', `"${quote.quote}"`, true);
			embed.addField('\u200b', `${quote.firstName} ${quote.lastName}`, true);
		}
	});
	// Return the remaining embed after it exits for loop
	// Ensures that the last quotes are sent
	// I.e if 28 quotes in db, 24 will get sent with code above, last 4 will get sent with this
	return message.channel.send(embed);
}

module.exports = {
	name: 'quotes',
	aliases: [],
	description: 'Gets a random quote, specific quote, or lists all quotes',
	args: false,
	usage: ' **OR** \nia!quotes [first name] [last name] **OR** \nia!quotes [ID] **OR** \nia!quotes list',
	async execute(message, args) {

		// Create the MessageEmbed
		const embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter('Parshotan Seenanan');
		// If the message guild exists (message is in server) set the author and thumbnail
		// Else set it static values (message would be dm then)
		if(message.guild) {
			embed
				.setAuthor(message.guild.name, message.guild.iconURL())
				.setThumbnail(message.guild.iconURL());
		} else {
			embed
				.setAuthor('Immature Bot');
		}

		// If no args given (i.e just ia!quotes)
		if(!args.length) {
			// Create a query getting all docs sorting by id
			// Await the query to get the array of docs
			const query = Quote.find().sort({ id: 1 });
			const doc = await query;
			// If there are no quotes in database, send error message
			if(!doc) return message.channel.send('No quotes in database.\nTo add a quote use ia!quote [first name] [last name] [quote]');

			// Call function to create and send 3 column embedded
			createEmbeddedColumns(message, doc, embed);

		// If the first arg is 'list'
		} else if(args[0].toLowerCase() === 'random') {
			// Get a number of all the documents in the collection
			const numberOfDocs = await Quote.countDocuments();

			// Get a random number from 0 to the number of docs
			const randomDoc = Math.floor(Math.random() * numberOfDocs);

			// Create a query finding one document and skipping straight to the index number
			// https://stackoverflow.com/questions/39277670/how-to-find-random-record-in-mongoose
			// Await the query to get the doc object
			const query = Quote.findOne().skip(randomDoc);
			const doc = await query;

			// If there are no quotes in database, send error message
			if(!doc) return message.channel.send('No quotes in database.\nTo add a quote use ia!quote [first name] [last name] [quote]');

			// Convert the timestamp to mm/yyyy
			const date = `${doc.timestamp.getMonth() + 1}/${doc.timestamp.getFullYear()}`;
			// Set the title of the embed to the quote, with users name and date
			embed
				.setTitle(`"${doc.quote}" --- ${doc.firstName}, ${date}`);

			// Send the embedded
			return message.channel.send(embed);
		// If the first arg is a number (integer)
		} else if(Number(args[0])) {
			// Store the number in a variable
			const idNumber = Number(args[0]);

			// Create a query gettingthe id that equals the user given id
			// Await the query to get an array of docs (even though it will only have one entry)
			const query = Quote.find({ id: idNumber });
			const doc = await query;

			// If there are no quotes in database, send error message
			if(!doc) return message.channel.send('Could not find ID in database.\nUse ia!quotes to see all quotes');

			// Get the fields from the document (first instance since it's an array)
			const { firstName, lastName, id, quote } = doc[0];

			// Add fields and title to embedded
			embed
				.addField('ID', `${id}`, true)
				.addField('Quote', `"${quote}"`, true)
				.addField('Person', `${firstName} ${lastName}`, true);

			// Send the embedded
			return message.channel.send(embed);
		// If there are two args (should only be first name and last name)
		} else if(args.length === 2) {
			// Get the first and last name
			const userFirstName = args[0];
			const userLastName = args[1];

			// Create a query getting the document that matches the first and last name
			// Returns an array of all documents matching it
			const query = Quote.find({ firstName: userFirstName, lastName: userLastName });
			const doc = await query;

			// If there are no quotes in database, send error message
			if(!doc) return message.channel.send('Could not find name in database.\nUse ia!quotes to see all quotes');

			// Call function to create and send 3 column embedded
			createEmbeddedColumns(message, doc, embed);
		} else {
			return message.channel.send('Incorrect command usage. For proper usage use ia!help quotes');
		}
	},
};