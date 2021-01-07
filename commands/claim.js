require('dotenv').config();
// const jsonReader = require('../util/jsonReader');
// const jsonWriter = require('../util/jsonWriter');
// const jsonFormatter = require('../util/jsonFormatter');
const Game = require('../database/models/games');

module.exports = {
	name: 'claim',
	aliases: ['get'],
	description: 'Claim a game and recieve the steam key for it!\n__*Key will be sent as a DM to the user*__',
	args: true,
	usage: '[game name] --- Claims a game from the bot',
	async execute(message, args) {
		// const jsonArray = await jsonReader(process.env.GAMES_FILE);
		const userGameName = args.join(' ');

		if(message.channel.name !== 'freebies') {
			return message.channel.send('This command can only be used in \'freebies\' channel');
		}

		// Query the database, finding the first instance of the game name and deleting it from database
		// Await the query to get the object of the document
		const query = Game.findOneAndDelete({ gameName: userGameName });
		const doc = await query;

		// If query failed, doc is null, return game not found message
		if(!doc) return message.channel.send('Game could not be found. Make sure it is typed exactly as shown on ia!freestuff');

		// Get gameName and gameKey from object
		const { gameName, gameKey, codeType } = doc;

		console.log('Game removed from Database');
		// Reply to the channel that user claimed and DM user the key
		message.channel.send(`A copy of ${gameName} has been claimed by ${message.author}`);
		return message.author.send(`Game Claimed: ${gameName}\nKey: ${gameKey}\nRedeemable On: ${codeType}`);

		// const index = jsonArray.findIndex(game => game.name.toLowerCase() === gameName.toLowerCase());

		// if(index !== -1) {
		// 	const { name, key } = jsonArray[index];
		// 	jsonArray.splice(index, 1);

		// 	const jsonString = JSON.stringify(jsonArray);
		// 	// Write to the games file (overwriting it with added game)
		// 	await jsonWriter(process.env.GAMES_FILE, jsonString);
		// 	// Format the file so the added game get alphabetized & ids get updated
		// 	await jsonFormatter(process.env.GAMES_FILE);

		// 	message.channel.send(`A copy of ${name} has been claimed by ${message.author}`);
		// 	return message.author.send(`Game Claimed: ${name}\nKey: ${key}`);
		// }

		// https://stackoverflow.com/questions/48176905/javascript-delete-object-from-json-array
		// return message.channel.send('Game could not be found. Please make sure it is typed correctly');
	},
};