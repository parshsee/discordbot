const Leaderboard = require('../database/models/leaderboards');
const Discord = require('discord.js');

async function addLeaderboard(message, args) {
	// Get the full tournament name
	const tournamentName = args.join(' ');
	// Create a tournament object to store in DB
	const tournamentObject = {
		name: tournamentName,
		players: [],
	};
	// Get all documents in DB sorting by id
	const query = await Leaderboard.find().sort({ id: 1 });
	// Check if the array is empty (meaning nothing in db)
	// True = Get the id of the last entry and add 1
	// False = Set the id to 1
	const idNumber = query.length ? query[query.length - 1].id + 1 : 1;

	// Construct a new Leaderboard document from the model
	const leaderboard = new Leaderboard({
		id: idNumber,
		leaderboard: tournamentObject,
	});

	// Save the Leaderboard to the database
	(async () => {
		try {
			await leaderboard.save();
			console.log('Leaderboard added to Database');
			return message.channel.send('Leaderboard Added Successfully');
		} catch (err) {
			console.log('error: ' + err);
			return message.channel.send('Error saving leaderboard.');
		}
	})();
}

async function endLeaderboard(message, args) {
	// Create the MessageEmbed
	const embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTimestamp()
		.setFooter('Immature Bot');
	// If the message guild exists (message is in server) set the author and thumbnail
	// Else set it static values (message would be dm then)
	if (message.guild) {
		embed
			.setAuthor(message.guild.name, message.guild.iconURL())
			.setThumbnail(message.guild.iconURL());
	} else {
		embed
			.setAuthor('Immature Bot');
	}

	// Check if given a tournament ID or name
	if (args.length === 1 && Number(args[0])) {
		const tournamentId = args[0];
		// Create a query to find and delete the tournament based on tournamentId
		// Returns an array of docs (even though if found it will only have 1 doc)
		const query = await Leaderboard.findOneAndDelete({ id: tournamentId });
		// If there are no tournaments in database, send error message
		if (!query) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all leaderboards');

		// Destructured tournament name from query
		const { name } = query.leaderboard;

		await updateCollectionIDs();

		console.log('Leaderboard removed from Database');
		// Return a message saying deletion was successful
		message.channel.send(`${name} has ended. Here are the scores: `);
		return createEmbeddedColumns(message, query.leaderboard.players, embed, 'Name', 'Wins', 'Losses');
	} else {
		const tournamentName = args.join(' ');
		// Create a query to find and delete the tournament based on tournamentName
		// Returns an array of docs (even though if found it will only have 1 doc)
		// Searching through an object is done with quotation marks
		const query = await Leaderboard.findOneAndDelete({ 'leaderboard.name': tournamentName });
		// If there are no tournaments in database, send error message
		if (!query) return message.channel.send('Could not find leaderboard name in database.\nUse \'ia!leaderboard list\' to see all leaderboards.\n Make sure it is spelt exactly the same or use the ID instead');

		// Destructured tournament name from query
		const { name } = query.leaderboard;

		await updateCollectionIDs();

		console.log('Leaderboard removed from Database');
		// Return a message saying deletion was successful
		message.channel.send(`${name} has ended. Here are the scores: `);
		return createEmbeddedColumns(message, query.leaderboard.players, embed, 'Name', 'Wins', 'Losses');
	}
}

async function addPlayer(message, args) {
	// Get the tournamentId (last element) from args and remove it
	const tournamentId = args.pop();
	// Check if tournamentId is an actual number
	if (isNaN(tournamentId)) return message.channel.send('Please enter a valid leaderboard ID. \nUse \'ia!leaderboard list\' to see all leaderboards');
	// Get the player name, capitalizing the first letter in each arg (if more than one) and lowercasing the rest
	const playerName = args.map((s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase()).join(' ');
	// Construct the playerObject
	const playerObject = {
		name: playerName,
		wins: 0,
		losses: 0,
	};

	// Check to see if tournament exists in DB
	// Since it's find (generic) it will return an array of docs
	const query = await Leaderboard.find({ id: tournamentId });
	if (query.length < 1) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all leaderboard');
	// Get tournament object (should be first and only object in array)
	const tournament = query[0];
	// Add the playerObject to the players array of the leaderboard object
	tournament.leaderboard.players.push(playerObject);

	try {
		// Tell the DB that this part of the document has been modified (MUST DO for updates)
		tournament.markModified('leaderboard');
		// Save the updated document to the DB
		await tournament.save();
		console.log(`${playerName} has been added to ${tournament.leaderboard.name} leaderboard`);
		return message.channel.send(`${playerName} has been added to ${tournament.leaderboard.name}`);
	} catch (error) {
		console.log(error);
		return message.channel.send('There was an error adding that player to the leaderboard');
	}
}

async function removePlayer(message, args) {
	// Get the tournamentId (last element) from the args and remove it
	const tournamentId = args.pop();
	// Check if tournamentId is an actual number
	if (isNaN(tournamentId)) return message.channel.send('Please enter a valid leaderboard ID. \nUse \'ia!leaderboard list\' to see all leaderboards');
	// Get the player name, capitalizing the first letter in each arg (if more than one) and lowercasing the rest
	const playerName = args.map((s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase()).join(' ');

	// Check to see if tournament exists in DB
	const query = await Leaderboard.find({ id: tournamentId });
	if (query.length < 1) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all leaderboards');
	// Get tournament object (should be first and only object in array)
	const tournament = query[0];

	// Check to see if name exists in tournament
	const playerIndex = tournament.leaderboard.players.findIndex(player => {
		return player.name === playerName;
	});
	if (playerIndex < 0) return message.channel.send('Player not found in leaderboard.\nUse \'ia!leaderboard list\' to see all leaderboards.\nUse \'ia!leaderboard list [leaderboardID]\' to see all players in that leaderboard');

	// Remove the player object from the array
	tournament.leaderboard.players.splice(playerIndex, 1);

	try {
		// Tell the DB that this part of the document has been modified (MUST DO for updates)
		tournament.markModified('leaderboard');
		// Save the updated document to the DB
		await tournament.save();
		console.log(`${playerName} has been removed from ${tournament.leaderboard.name} leaderboard`);
		return message.channel.send(`${playerName} has been removed from ${tournament.leaderboard.name}`);
	} catch (error) {
		console.log(error);
		return message.channel.send('There was an error removing that player from the leaderboard');
	}

}

async function updateScores(message, args) {
	// win [name] lose [name] [tournamentId]
	// First Args: Winner Name
	// Second Args; lose/loss
	// Third Args: Loser Name
	// Get the tournamentId (last element) from the args and remove it
	const tournamentId = args.pop();
	// Check if tournamentId is an actual number
	if (isNaN(tournamentId)) return message.channel.send('Please enter a valid leaderboard ID. \nUse \'ia!leaderboard list\' to see all leaderboards');

	// Find the index of the word loss (to split the differnece between winner name and loser)
	const lossIndex = args.findIndex(x => {
		return (x === 'lose' || x === 'lost' || x === 'loss');
	});

	// Get the winners name splicing from the args array, then capitalizing the first letter in each arg (if more than one) and lowercasing the rest
	const winnerName = args.splice(0, lossIndex).map((s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase()).join(' ');
	// Get the loser name splicing from the args array, then capitalizing the first letter in each arg (if more than one) and lowercasing the rest
	const loserName = args.splice(1).map((s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase()).join(' ');

	// Check to see if tournament exists in DB
	const query = await Leaderboard.find({ id: tournamentId });
	if (query.length < 1) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all leaderboards');
	// Get tournament object (should be first and only object in array)
	const tournament = query[0];

	// Check to see if each player exists in tournament
	const winnerIndex = tournament.leaderboard.players.findIndex(player => {
		return player.name === winnerName;
	});
	const loserIndex = tournament.leaderboard.players.findIndex(player => {
		return player.name === loserName;
	});
	if (winnerIndex < 0 || loserIndex < 0) return message.channel.send('One or more players not found in leaderboard.\nUse \'ia!leaderboard list\' to see all leaderboards.\nUse \'ia!leaderboard list [leaderboardID]\' to see all players in that leaderboard');

	// Update the scores for the winner and loser
	tournament.leaderboard.players[winnerIndex].wins += 1;
	tournament.leaderboard.players[loserIndex].losses += 1;

	try {
		// Tell the DB that this part of the document has been modified (MUST DO for updates)
		tournament.markModified('leaderboard');
		// Save the updated document to the DB
		await tournament.save();
		console.log(`${tournament.leaderboard.players[winnerIndex].name} has won against ${tournament.leaderboard.players[loserIndex].name} in ${tournament.leaderboard.name} leaderboard`);
		return message.channel.send(`Scores updated. \n${tournament.leaderboard.players[winnerIndex].name} is at: ${tournament.leaderboard.players[winnerIndex].wins} W - ${tournament.leaderboard.players[winnerIndex].losses} L\n${tournament.leaderboard.players[loserIndex].name} is at: ${tournament.leaderboard.players[loserIndex].wins} W - ${tournament.leaderboard.players[loserIndex].losses} L`);
	} catch (error) {
		console.log(error);
		return message.channel.send('There was an error updating the scores');
	}

}

async function listLeaderboard(message, args) {
	// Create the MessageEmbed
	const embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTimestamp()
		.setFooter('Immature Bot');
	// If the message guild exists (message is in server) set the author and thumbnail
	// Else set it static values (message would be dm then)
	if (message.guild) {
		embed
			.setAuthor(message.guild.name, message.guild.iconURL())
			.setThumbnail(message.guild.iconURL());
	} else {
		embed
			.setAuthor('Immature Bot');
	}

	// If no arguments, then show all current tournaments
	if (args.length === 0) {
		// Get all tournaments in DB
		const query = await Leaderboard.find().sort({ id: 1 });
		// Check to see if any tournaments exist
		if (query.length < 1) return message.channel.send('No leaderboards are currently active.\nUse \'ia!leaderboard start [leaderboard name]\' to start one');

		return createEmbeddedColumns(message, query, embed, 'ID', 'Leaderboard Name', '\u200b');
		// Else if one arg (tournamentID, show all players and their scores)
	} else if (args.length === 1) {
		const tournamentId = args.pop();
		// Check if tournamentId is an actual number
		if (isNaN(tournamentId)) return message.channel.send('Please enter a valid leaderboard ID. \nUse \'ia!leaderboard list\' to see all leaderboards');

		// Check to see if tournament exists in DB
		const query = await Leaderboard.find({ id: tournamentId });
		if (query.length < 1) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all leaderboards');
		// Get tournament object (should be first and only object in array)
		const tournament = query[0];

		return createEmbeddedColumns(message, tournament.leaderboard.players, embed, 'Name', 'Wins', 'Losses');
	} else {
		return message.channel.send('Command needs at most two (2) arguments, run \'ia!help leaderboard\' for more info');
	}
}

async function resetLeaderboard(message, args) {
	// Get the tournamentId (last element) from the args and remove it
	const tournamentId = args.pop();
	// Check if tournamentId is an actual number
	if (isNaN(tournamentId)) return message.channel.send('Please enter a valid leaderboard ID. \nUse \'ia!leaderboard list\' to see all leaderboards');

	// Check to see if tournament exists in DB
	const query = await Leaderboard.find({ id: tournamentId });
	if (query.length < 1) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all leaderboards');
	// Get tournament object (should be first and only object in array)
	const tournament = query[0];

	console.log(tournament.leaderboard.players);
	// Go through every player in the tournament and reset their scores
	tournament.leaderboard.players.forEach((player) => {
		player.wins = 0;
		player.losses = 0;
	});

	try {
		// Tell the DB that this part of the document has been modified (MUST DO for updates)
		tournament.markModified('leaderboard');
		// Save the updated document to the DB
		await tournament.save();
		console.log(`${tournament.leaderboard.name} has been reset`);
		return message.channel.send(`${tournament.leaderboard.name} has been reset`);
	} catch (error) {
		console.log(error);
		return message.channel.send('There was an error resetting the scores');
	}
}

// After removing a tournament, go through the collection
// Update all ids to be in order
// Solves issue of having ids [1, 2, 3, 4] deleting id 3, and now ids show as [1, 2, 4]
async function updateCollectionIDs() {
	// Get number of documents in collection
	const numberOfDocs = await Leaderboard.countDocuments();

	for (let i = 0; i < numberOfDocs; i++) {
		// Find all documents matching the condition (id > i)
		// Update the first documents id to be i + 1
		// Function takes a filter, an update, and a callback
		Leaderboard.updateOne(
			{ id: { $gt: i } },
			{ id: i + 1 },
			(err) => {
				if (err) console.log(err);
			});
	}


}

// Creates a embedded with 3 columns: ID, Array of Docs, Name
// Uses information from array of documents
// Sends embedded back to channel
function createEmbeddedColumns(message, doc, embed, titleOne, titleTwo, titleThree) {
	// The limit of how many objects can be in an embed
	// Only have 25 fields
	// Need to set the ID, Array of Docs, and Name each column is a different field (so 3)
	// 8 * 3 = 24, Only 8 objects can be in an embed at a time
	let limit = 8;

	// Loop through the array of objects getting each object and index
	doc.forEach((x, index) => {
		// If the index = the limit
		if (index === limit) {
			// Ternary Operator, set initial title for first embed and the titles for the others
			embed.setTitle(index === 8 ?
				(titleOne === 'ID' ? 'All Leaderboards' : 'All Players') :
				(titleOne === 'ID' ? 'All Leaderboard Cont.' : 'All Players Cont.'));
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
			embed.addField(`${titleOne}`, titleOne === 'ID' ? `${x.id}` : `${x.name}`, true);
			embed.addField(`${titleTwo}`, titleTwo === 'Leaderboard Name' ? `${x.leaderboard.name}` : `${x.wins}`, true);
			embed.addField(`${titleThree}`, titleThree === '\u200b' ? '\u200b' : `${x.losses}`, true);
			// Else its not the first row, titles can be blank
		} else {
			embed.addField('\u200b', titleOne === 'ID' ? `${x.id}` : `${x.name}`, true);
			embed.addField('\u200b', titleTwo === 'Leaderboard Name' ? `${x.leaderboard.name}` : `${x.wins}`, true);
			embed.addField('\u200b', titleThree === '\u200b' ? '\u200b' : `${x.losses}`, true);
		}
	});
	// Return the remaining embed after it exits for loop
	// Ensures that the last objects are sent
	// I.e if 28 objects in db, 24 will get sent with code above, last 4 will get sent with this
	return message.channel.send(embed);
}

module.exports = {
	name: 'leaderboard',
	aliases: ['lb'],
	description: 'Starts or ends a leaderboard, Adds or removes a person from the leaderboard, and monitors wins and losses. ',
	args: true,
	usage: 'start [leaderboard name] --- Creates a new leaderboard' +
		'\n**•**ia!leaderboard end [leaderboard ID] --- Ends a leaderboard and displays scores' +
		'\n**•**ia!leaderboard add [name] [leaderboard ID] --- Adds a player to a leaderboard' +
		'\n**•**ia!leaderboard remove [name] [leaderboard ID] --- Removes a player from a leaderboard' +
		'\n**•**ia!leaderboard win [player name] loss [player name] [leaderboard ID] --- Updates scores for winning/losing players in leaderboard' +
		'\n**•**ia!leaderboard list --- Lists all leaderboard' +
		'\n**•**ia!leaderboard list [leaderboard ID] --- Lists all players and the scores in the leaderboard' +
		'\n**•**ia!leaderboard reset [leaderboard ID] --- Resets a leaderboard, setting all wins/losses to 0 for all players',
	execute(message, args) {
		// Get the first argument and remove it from the array
		const firstArg = args.shift().toLowerCase();

		if (firstArg === 'start') {
			// Message sends total number of args needed(add + 1 args)
			if (args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return addLeaderboard(message, args);
		} else if (firstArg === 'add') {
			// Message sends total number of args needed(add + 1 args)
			if (args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return addPlayer(message, args);
		} else if (firstArg === 'remove') {
			// Message sends total number of args needed(remove + 1 args)
			if (args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return removePlayer(message, args);
		} else if (firstArg === 'win') {
			// Message sends total number of args needed(win + 3 args)
			if (args.length < 3) {
				return message.channel.send('Command needs at least four (4) arguments, run \'ia!help leaderboard\' for more info');
			}
			return updateScores(message, args);
		} else if (firstArg === 'end') {
			// Message sends total number of args needed(end  + 1 args)
			if (args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return endLeaderboard(message, args);
		} else if (firstArg === 'list') {
			// Special Case: Can be ia!leaderboard list OR list [tournamentID]
			if (args.length > 1) {
				return message.channel.send('Command needs at most two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return listLeaderboard(message, args);
		} else if (firstArg === 'reset') {
			// Message sends total number of args needed(reset + 1 args)
			if (args.lengt > 1) {
				return message.channel.send('Command needs two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return resetLeaderboard(message, args);
		} else {
			return message.channel.send('Incorrect command usage. For proper usage use ia!help leaderboard');
		}
	},
};