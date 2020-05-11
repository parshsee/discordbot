const axios = require('axios');
const discord = require('discord.js');
const { gameAPI, coverAPI, gameModeAPI, APIKey } = require('../config.json');

async function apiCalls(gameName) {
	let gameInformation = {};

	// fields *; where id = 740;
	// search "Halo";
	// API call to search for game
	// based on user input
	const searchResult = (await axios({
		url: gameAPI,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'user-key': APIKey,
		},
		data: `search "${gameName}";`,
	// Data without the [0] because it is an array of search ids
	})).data;

	// If the search has no results
	// Return error and errorMessage
	if(!searchResult.length) {
		gameInformation.error = true;
		gameInformation.errorMessage = 'Search Result Failed';
		return gameInformation;
	}

	// Get the id for the first search result (should be most accurate)
	const firstGameID = searchResult[0].id;

	// API call to get game information
	// based on first search result
	const gameInfo = (await axios({
		url: gameAPI,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'user-key': APIKey,
		},
		data: `fields cover, game_modes, name, summary; where id = ${firstGameID};`,
	// Data with the [0] because it only has one object in the array
	})).data[0];

	// Get and store the games name and summary in gameInformation object
	// Initiates the gameModes as an array
	const { name, summary } = gameInfo;
	gameInformation = { name, summary };
	gameInformation.gameModes = [];

	// Get game cover id, used to make api call for cover url
	const gameCover = gameInfo.cover;

	// API call to get the game cover info
	// based on cover id
	const gameCoverInfo = (await axios({
		url: coverAPI,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'user-key': APIKey,
		},
		data: `fields url; where id = ${gameCover};`,
	// Data with the [0] because it only has one object in the array
	})).data[0];

	// Stores the game cover url in gameInformation object
	gameInformation.coverImage = `https:${gameCoverInfo.url}`;

	// Loop through all the game modes from the gameInfo API call
	// INEFFIECENT, Better way?
	for(const gameMode of gameInfo.game_modes) {

		// API call to get the game modes info
		// based on game mode ids
		const gameModesInfo = (await axios({
			url: gameModeAPI,
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'user-key': APIKey,
			},
			data: `fields name; where id = ${gameMode};`,
		// Data with the [0] because it only has one object in the array
		})).data[0];

		// Add the game mode name to the array of game modes in gameInformation
		gameInformation.gameModes.push(gameModesInfo.name);
	}

	return gameInformation;
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
		const gameName = args.join(' ');
		const gameInformation = await apiCalls(gameName);

		// If error during API call
		// Return the error message
		if(gameInformation.error) {
			return message.channel.send(gameInformation.errorMessage);
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
				{ name: 'Game Information', value: gameInformation.summary, inline: true },
				{ name: 'Game Modes', value: gameInformation.gameModes, inline: true },
			);
		// Return the embed
		message.channel.send(embed);
	},
};