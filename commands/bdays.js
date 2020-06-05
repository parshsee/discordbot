const Birthday = require('../database/models/birthdays');
const Discord = require('discord.js');

function chunkSubstr(str, size) {
	// Gets the number of chunks (pretty much the amount of messages that will be sent)
	const numChunks = Math.ceil(str.length / size);
	// Creats an array with that many positions
	const chunks = new Array(numChunks);

	for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
		// Check what str.substr(o, size) returns --- Should be the string until 2048th character
		// --- If it ends with \n\n then the last game is good (formatted correctly)
		// --- Else get the index of the last time it was formmated correctly (ending with \n\n)
		//      Create a new substring that ends when it was last formatted correctly
		//      Add that substring to the array
		//      Set o (the starting point of each substring) equal to its value - (size - y)
		//          Now when o increments by size again it will be where y left off instead of
		//          going to the next size and skipping all characters inbetween y and size.
		// console.log("Substring Starting at: " + o + " : " + str.substr(o, size));
		if(str.substr(o, size).endsWith('\n\n')) {
			chunks[i] = str.substr(o, size);
		} else {
			// eslint-disable-next-line no-inline-comments
			const y = str.substr(o, size).lastIndexOf('\n\n') + 2; // Reads \n as 1 character
			const z = str.substr(o, y);
			chunks[i] = z;
			o = o - (size - y);
		}
	}
	return chunks;
}

/*
  Take a string and channel and sends 'x'  amount of messages to the channel depending
  on the length of the text.
  Async Function to allow for loop to create a message, send the message, then create another
  if the text was long enough to be broken into multiple arrays and send that
  ([a]wait for embed to be made before sending it)
  Taken from freestuff code
*/
async function sendEmbeds(text, message) {
	const testArr = chunkSubstr(text, 2048);
	// Create generic Embedded Message with necessary fields
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

	let count = 1;

	// Loop through every element
	for (const chunk of testArr) {
		// First Embedded Title this
		// Else every other embedded gets 'Games Cont'
		if(count === 1) {
			embed
				.setTitle('Birthdays');
			// .setThumbnail(message.guild.iconURL());
		} else {
			embed
				.setTitle('Birthdays Cont.');
			// .setThumbnail();
		}
		embed
			.setDescription(chunk);
		count += 1;

		// Wait for the embed to be sent
		await message.channel.send({ embed });
	}
}

module.exports = {
	name: 'bdays',
	aliases: [],
	description: 'Shows all birthdays or a specific one',
	args: false,
	usage: '[first name] [last name]',
	async execute(message, args) {

		let reply = '';
		// If no arguments are given (i.e just ia!bdays)
		if(!args.length) {
			// Create a query getting all documents, sorting by firstname THEN lastname
			// Await the query to the array of document objects
			const query = Birthday.find().sort({ firstName: 1, lastName: 1 });
			const doc = await query;

			// For each document format and add to the reply
			doc.forEach(function(birthday) {
				// Format the date to mm/dd/yyyy
				const date = `${birthday.birthday.getMonth() + 1}/${birthday.birthday.getDate()}/${birthday.birthday.getFullYear()}`;
				// Add to the reply
				reply += `:birthday: **${birthday.firstName} ${birthday.lastName}** \n Birthday: ${date} \n\n`;
			});

			// If the reply is empty, return error message
			if(reply === '') {
				reply += 'No birthdays in database.\nTo add a birthday use ia!bday add [first name] [last name] [birthday (mm/dd/yyyy)]\n\n';
			}
			// Create and send embed
			return sendEmbeds(reply, message);
		}

		// If not given exactly two arguments (first and last name) return error message
		if(args.length !== 2) return message.channel.send('Command requires two (2) arguments. Use ia!help [command] for proper usage');

		// Get the entered first and last names
		const userFirstName = args[0];
		const userLastName = args[1];

		// Create a query getting the document that matches the first and last name
		// Returns an array of all documents, slight chance it might return more than one
		const query = Birthday.find({ firstName: userFirstName, lastName: userLastName });
		// Doc is an array of objects in this case
		const doc = await query;

		// If the array is empty (no documents) send error message
		if(!doc.length) return message.channel.send('Person could not be found. Please use ia!bdays to view the full list of birthdays');

		// Get the fields from the document (first instance since it's an array)
		const { firstName, lastName, birthday } = doc[0];
		// Format the date to be mm/dd/yyyy
		const date = `${birthday.getMonth() + 1}/${birthday.getDate()}/${birthday.getFullYear()}`;

		// Add to the reply
		reply += `:birthday: **${firstName} ${lastName}** \n Birthday: ${date} \n\n`;

		// Create and send embed
		return sendEmbeds(reply, message);
	},
};