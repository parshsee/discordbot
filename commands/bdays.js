const Birthday = require('../database/models/birthdays');
const Discord = require('discord.js');


async function birthdayDBCall() {
	// Create a query getting all documents, sorting by firstname THEN lastname
	// Await the query to the array of document objects
	const query = Birthday.find().sort({ firstName: 1, lastName: 1 });
	const doc = await query;

	// Get current date
	const currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);
	// Initalize arrays for dates before and after current day
	const afterCurrDate = [];
	const beforeCurrDate = [];

	// For each document check if its before or after current day
	doc.forEach(function(birthday) {
		// Check if the month is ahead
		if (birthday.birthday.getMonth() + 1 > currentDate.getMonth() + 1) {
			// Add to array of dates AFTER current day
			afterCurrDate.push({
				bday: birthday.birthday,
				fullName: `${birthday.firstName} ${birthday.lastName}`,
			});
			// If the month is the same, check if the date is ahead
		} else if (birthday.birthday.getMonth() + 1 === currentDate.getMonth() + 1 && birthday.birthday.getDate() > currentDate.getDate()) {
			// Add to array of dates AFTER current day
			afterCurrDate.push({
				bday: birthday.birthday,
				fullName: `${birthday.firstName} ${birthday.lastName}`,
			});
			// Else the month/day is in the past
		} else {
			// Add to array of dates BEFORE current day
			beforeCurrDate.push({
				bday: birthday.birthday,
				fullName: `${birthday.firstName} ${birthday.lastName}`,
			});
		}
	});

	// Return an array of arrays
	return [afterCurrDate, beforeCurrDate];
}


function sortArr(arr, currentDate) {
	// Get the current month
	const currMonth = currentDate.getMonth() + 1;

	// Sort the array using sort method
	// Returning -1 to sort, sorts a to an index lower than b (i.e. a comes first)
	// Returning 0 to sort, leave a and b unchanged with respect to each other, but sorted with respect to all different elements
	// Returning 1 to sort, sorts b to an index lower than a (i.e. b comes first)
	arr.sort((a, b) => {
		// Get the birthday month and day of the SECOND value (idk why is does second value as a)
		const bdayMonth = a.bday.getMonth() + 1;
		const bdayDay = a.bday.getDate();

		// Get the birthday month and day of the FIRST value
		const bdayMonth2 = b.bday.getMonth() + 1;
		const bdayDay2 = b.bday.getDate();

		// If the second month is less than the first month swap them
		if(bdayMonth - currMonth < bdayMonth2 - currMonth) {
			return -1;
		} else if(bdayMonth - currMonth === bdayMonth2 - currMonth && bdayDay < bdayDay2) {
			return -1;
		}
	});
	return arr;
}


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
	usage: ' **OR**\nia!bdays [first name] [last name]',
	async execute(message, args) {

		let reply = '';
		// If no arguments are given (i.e just ia!bdays)
		if(!args.length) {
			// Get current date
			const currentDate = new Date();
			currentDate.setTime(0, 0, 0, 0);
			// Get two arrays,
			// One containing dates after current day
			// One containing dates before current day
			const [ afterCurrDate, beforeCurrDate ] = await birthdayDBCall();

			// Get the sorted arrays
			const sortedAfterDates = sortArr(afterCurrDate, currentDate);
			// For each object in the array, format the date and add to reply
			sortedAfterDates.forEach(birthday => {
				// Format the date to mm/dd/yyyy
				const date = `${birthday.bday.toLocaleDateString()}`;
				// Add to the reply
				reply += `:birthday: **${birthday.fullName}** \n Birthday: ${date} \n\n`;
			});

			// Get the sorted arrays
			const sortedBeforeDates = sortArr(beforeCurrDate, currentDate);
			// For each object in the array, format the date and add to reply
			sortedBeforeDates.forEach(birthday => {
				// Format the date to mm/dd/yyyy
				const date = `${birthday.bday.toLocaleDateString()}`;
				// Add to the reply
				reply += `:birthday: **${birthday.fullName}** \n Birthday: ${date} \n\n`;
			});

			// If the reply is empty, return error message
			if(reply === '') {
				reply += 'No birthdays in database.\nTo add a birthday use ia!bday add [first name] [last name] [mm/dd/yyyy]\n\n';
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
		const date = `${birthday.toLocaleDateString()}`;

		// Add to the reply
		reply += `:birthday: **${firstName} ${lastName}** \n Birthday: ${date} \n\n`;

		// Create and send embed
		return sendEmbeds(reply, message);
	},
};