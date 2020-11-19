require('dotenv').config();
const axios = require('axios');
const discord = require('discord.js');

async function apiCalls(gameName, gameYear) {
	// Create game information object
	let gameInformation = {};
	// Create inital search query
	// Search for the game name, return info on cover (specifically url), game_modes (specifically name), summary, name of EACH game,
	// Cover.url removes call to game cover endpoint to retrieve url
	// Game_modes.name removes call to game modes endpoint to retrieve each game mode
	// Make sure the cover isn't null (usually indicates game infomration is missing)
	let searchQuery = `search "${gameName}"; fields cover.url, game_modes.name, name, summary; where cover != null`;
	// If given a game year add that to the search query
	// Else close the query
	if(gameYear) {
		searchQuery = searchQuery + ` & release_dates.y = ${gameYear};`;
	} else {
		searchQuery = searchQuery + ';';
	}

	try {
		// API call to search for game
		// based on user input
		// Returns array of objects, each object is a game with similar name
		const searchResult = (await axios({
			url: process.env.GAME_API,
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Client-ID': process.env.TWITCH_CLIENT_ID,
				'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
			},
			// In the body (data), use the search query provided
			data: searchQuery,
			// Data without the [0] because it is an array of search ids
		})).data;

		// Go through each object of games
		// Check if the search result game name is the same as the user game name
		// If true, add to gameInformation object
		searchResult.forEach(result => {
			if (result.name.toLowerCase() === gameName) {
				gameInformation = result;
			}
		});

		// If the search has no results (empty array) || If gameInformation object has no keys (empty object)
		// Return error and errorMessage
		if (!searchResult.length || !Object.keys(gameInformation).length) {
			gameInformation.error = true;
			gameInformation.errorMessage = 'Search Result Failed: Game not in Database';
			console.log('Call to IGDB API: Successful');
			return gameInformation;
		}

		// Go through each object (mode) in array with the index
		// Add that mode to the array of game_modes in gameInfomration
		// Essentially updates the arrays from the IDs to the actual modes
		if(gameInformation.game_modes) {
			gameInformation.game_modes.forEach((mode, index) => {
				gameInformation.game_modes[index] = mode.name;
			});
		} else {
			gameInformation.game_modes = 'Unknown';
		}

		// Format game cover to proper URL
		gameInformation.cover = `https:${gameInformation.cover.url}`;

		console.log('Call to IGDB API: Successful');
		return gameInformation;
	} catch (error) {
		console.log('Call to IGDB API: Failure', error);
		gameInformation.error = true;
		gameInformation.errorMessage = 'Search Result Failed: Error connecting to Database. Please try again in a minute';
		return gameInformation;
	}

}

module.exports = {
	name: 'info',
	aliases: ['gameinfo'],
	description: 'Retrieves information about the specified game with optional searching for specific year',
	args: true,
	usage: '[game name] **OR** \nia!info [game name] --- [year]',
	async execute(message, args) {
		// If used as a DM
		// Return error message
		if(message.channel.type === 'dm') return message.channel.send('This command can\'t be used as a DM');

		// Get the game name from the args
		// Make all relevant api calls from game name
		let gameArr = args.join(' ').toLowerCase().split('---');
		// Go through array and remove whitespaces from each element
		gameArr = gameArr.map(value => {
			return value.trim();
		});
		// Check if there is a second element in array (which should be the year)
		// And check if the second element is a number
		// Return error message if not
		if(gameArr[1] && isNaN(gameArr[1])) return message.channel.send('Optional second parameter isn\'t a valid year');

		const gameInformation = await apiCalls(gameArr[0], gameArr[1]);

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
			.setThumbnail(gameInformation.cover)
			.setTitle(gameInformation.name)
			.addFields(
				{ name: 'Game Information', value: gameSummary, inline: true },
				{ name: 'Game Modes', value: gameInformation.game_modes, inline: true },
			);
		// Return the embed
		message.channel.send(embed);
	},
};