require('dotenv').config();
const Discord = require('discord.js');
// const jsonReader = require('../util/jsonReader');
const Games = require('../database/models/games');

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

*/
async function sendEmbeds(text, message) {
	const testArr = chunkSubstr(text, 2048);
	const embed = new Discord.MessageEmbed()
		.setColor('00FFFF')
		.setAuthor(message.guild.name, message.guild.iconURL())
		.setThumbnail(message.guild.iconURL())
		.setTimestamp()
		.setFooter('Parshotan Seenanan')
		.setTitle('Available Games');
	let count = 1;

	// Loop through every element
	for (const chunk of testArr) {
		// First Embedded Title this
		// Else every other embedded gets 'Games Cont'
		if(count === 1) {
			embed
				.setTitle('Available Games');
			// .setThumbnail(message.guild.iconURL());
		} else {
			embed
				.setTitle('Games Cont.');
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
	name: 'freestuff',
	aliases: ['freegames', 'free'],
	description: 'Shows all available games',
	args: false,
	usage: ' ',
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {
		if(message.channel.name === 'freebies') {
			let reply = '';
			// Returns json array, await so the program doesnt execute rest of lines
			// until it has fully read the file
			// const gamesArray = await jsonReader(process.env.GAMES_FILE);

			// Query the database, finding all documents in Games collection and sorting by name (1 is ascending, -1 is decending)
			// Await the query to get the json array of all documents
			const query = Games.find().sort({ gameName: 1 });
			const docs = await query;

			// Loops through array, gets all game names, adds to reply
			// formatted with arrow emoji + two newlines at end
			docs.forEach(function(game) {
				reply += `:free: **${game.gameName}** \n Type: ${game.gameType} \n\n`;
			});

			//	If no game in database, reply wouldn't have anything added to it, send modified reply
			//	\n\n allows chunk method to work without changes
			if(reply === '') {
				reply += 'No games in database.\nTo add a game use ia!add [game name] [steam key] [type: Game, DLC, Other]\n\n';
			}
			return sendEmbeds(reply, message);
		}

		message.channel.send('This command can only be used in \'freebies\' channel');
	},
};