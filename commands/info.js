require('dotenv').config();
const axios = require('axios');
const discord = require('discord.js');

async function apiCalls(gameName) {
	let gameInformation = {};

	// API call to search for game
	// based on user input
	// Returns array of objects, each object is a game with similar name
	const searchResult = (await axios({
		url: process.env.GAME_API,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'user-key': process.env.API_KEY,
		},
		// Search for the game name, return info on cover, game_modes, summary, name of EACH game,
		// Make sure the cover isn't null (usually indicates game infomration is missing)
		data: `search "${gameName}"; fields cover, game_modes, name, summary; where cover != null;`,
	// Data without the [0] because it is an array of search ids
	})).data;

	console.log(searchResult);

	// Go through each object of games 
	// Check if the search result game name is the same as the user game name
	// If true, add to gameInformation object
	searchResult.forEach(result => {
		if(result.name.toLowerCase() === gameName) {
			gameInformation = result;
		}
	});

	console.log(gameInformation);
	// If the search has no results (empty array) || If gameInformation object has no keys (empty object)
	// Return error and errorMessage
	if(!searchResult.length || !Object.keys(gameInformation).length) {
		gameInformation.error = true;
		gameInformation.errorMessage = 'Search Result Failed: Game not in Database';
		return gameInformation;
	}

	// // API call to get game information
	// // based on first search result
	// const gameInfo = (await axios({
	// 	url: process.env.GAME_API,
	// 	method: 'POST',
	// 	headers: {
	// 		'Accept': 'application/json',
	// 		'user-key': process.env.API_KEY,
	// 	},
	// 	data: `fields cover, game_modes, name, summary; where id = ${firstGameID};`,
	// // Data with the [0] because it only has one object in the array
	// })).data[0];

	// console.log(gameInfo);

	// // Get and store the games name and summary in gameInformation object
	// // Initiates the gameModes as an array
	// const { name, summary } = gameInfo;
	// gameInformation = { name, summary };
	// gameInformation.gameModes = [];

	// // If the game doesn't have any results
	// // Return error and errorMessage
	// if(!gameInfo.cover) {
	// 	console.log('Second error');
	// 	gameInformation.error = true;
	// 	gameInformation.errorMessage = 'Search Result Failed';
	// 	return gameInformation;
	// }

	// // Get game cover id, used to make api call for cover url
	// const gameCover = gameInfo.cover;

	// // API call to get the game cover info
	// // based on cover id
	// const gameCoverInfo = (await axios({
	// 	url: process.env.GAME_COVER_API,
	// 	method: 'POST',
	// 	headers: {
	// 		'Accept': 'application/json',
	// 		'user-key': process.env.API_KEY,
	// 	},
	// 	data: `fields url; where id = ${gameCover};`,
	// // Data with the [0] because it only has one object in the array
	// })).data[0];

	// // Stores the game cover url in gameInformation object
	// gameInformation.coverImage = `https:${gameCoverInfo.url}`;

	// // Loop through all the game modes from the gameInfo API call
	// // INEFFIECENT, Better way?
	// for(const gameMode of gameInfo.game_modes) {

	// // API call to get the game modes info
	// // based on game mode ids
	// const gameModesInfo = (await axios({
	// 	url: process.env.GAME_MODE_API,
	// 	method: 'POST',
	// 	headers: {
	// 		'Accept': 'application/json',
	// 		'user-key': process.env.API_KEY,
	// 	},
	// 	data: `fields name; where id = ${gameMode};`,
	// 	// Data with the [0] because it only has one object in the array
	// })).data[0];

	// 	// Add the game mode name to the array of game modes in gameInformation
	// 	gameInformation.gameModes.push(gameModesInfo.name);
	// }

	// return gameInformation;
}

module.exports = {
	name: 'info',
	aliases: ['gameinfo'],
	description: 'Retrieves information about the specified game',
	args: true,
	usage: '[game name]',
	async execute(message, args) {

		// If not in the freebies channel
		// Return error message
		if(message.channel.name !== 'freebies') {
			return message.channel.send('This command can only be used in \'freebies\' channel');
		}

		// Get the game name from the args
		// Make all relevant api calls from game name
		const gameName = args.join(' ').toLowerCase();
		const gameInformation = await apiCalls(gameName);

		// If error during API call
		// Return the error message
		if(gameInformation.error) {
			return message.channel.send(gameInformation.errorMessage);
		}

		let gameSummary = gameInformation.summary;

		// If the summary is longer than 1024 characters
		// Get a new length within 1024 characters that ends in a newline
		// Set the summary to the shorten version
		if(gameSummary.length > 1024) {
			const newLength = gameSummary.substr(0, 1024).lastIndexOf('\n');
			gameSummary = gameSummary.substr(0, newLength);
		}

		// Construct the embed with the game information
		const embed = new discord.MessageEmbed()
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter('Parshotan Seenanan')
			.setAuthor(message.guild.name, message.guild.iconURL())
			.setThumbnail(gameInformation.coverImage)
			.setTitle(gameInformation.name)
			.addFields(
				{ name: 'Game Information', value: gameSummary, inline: true },
				{ name: 'Game Modes', value: gameInformation.gameModes, inline: true },
			);
		// Return the embed
		message.channel.send(embed);
	},
};