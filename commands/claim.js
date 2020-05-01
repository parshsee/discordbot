const jsonReader = require('../util/jsonReader');
const jsonWriter = require('../util/jsonWriter');
const jsonFormatter = require('../util/jsonFormatter');
const { gamesFile } = require('../config.json');

module.exports = {
	name: 'claim',
	aliases: ['get'],
	description: 'Claim a game and recieve the steam key for it!\nKey will be sent as a DM to the user',
	args: true,
	usage: '[game name]',
	async execute(message, args) {
		const jsonArray = await jsonReader(gamesFile);
		const gameName = args.join(' ');

		if(message.channel.name !== 'freebies') {
			return message.channel.send('This command can only be used in \'freebies\' channel');
		}

		const index = jsonArray.findIndex(game => game.name.toLowerCase() === gameName.toLowerCase());

		if(index !== -1) {
			const { name, key } = jsonArray[index];
			jsonArray.splice(index, 1);

			const jsonString = JSON.stringify(jsonArray);
			// Write to the games file (overwriting it with added game)
			await jsonWriter(gamesFile, jsonString);
			// Format the file so the added game get alphabetized & ids get updated
			await jsonFormatter(gamesFile);

			message.channel.send(`A copy of ${name} has been claimed by ${message.author}`);
			return message.author.send(`Game Claimed: ${name}\nKey: ${key}`);
		}

		// https://stackoverflow.com/questions/48176905/javascript-delete-object-from-json-array
		return message.channel.send('Game could not be found. Please make sure it is typed correctly');
	},
};