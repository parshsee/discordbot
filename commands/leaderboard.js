const Leaderboard = require('../database/models/leaderboards');

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
	// Check if given a tournament ID or name
	if(args.length === 1 && Number(args[0])) {
		const tournamentId = args[0];
		// Create a query to find and delete the tournament based on tournamentId
		// Returns an array of docs (even though if found it will only have 1 doc)
		const query = await Leaderboard.findOneAndDelete({ id: tournamentId });
		// If there are no tournaments in database, send error message
		if(!query) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all tournaments');

		console.log(query);
		// Destructured tournament name from query
		const { name } = query.leaderboard;

		await updateCollectionIDs();

		console.log('Leaderboard removed from Database');
		// Return a message saying deletion was successful
		return message.channel.send(`${name} has ended.`);
	} else {
		const tournamentName = args.join(' ');
		// Create a query to find and delete the tournament based on tournamentName
		// Returns an array of docs (even though if found it will only have 1 doc)
		// Searching through an object is done with quotation marks
		const query = await Leaderboard.findOneAndDelete({ 'leaderboard.name': tournamentName });
		// If there are no tournaments in database, send error message
		if(!query) return message.channel.send('Could not find tournament name in database.\nUse \'ia!leaderboard list\' to see all tournaments.\n Make sure it is spelt exactly the same or use the ID instead');

		console.log(query);
		// Destructured tournament name from query
		const { name } = query.leaderboard;

		await updateCollectionIDs();

		console.log('Leaderboard removed from Database');
		// Return a message saying deletion was successful
		return message.channel.send(`${name} has ended.`);
	}
}

async function addPlayer(message, args) {
	// Get the tournamentId (last element) from args and remove it
	const tournamentId = args.pop();
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
	if(query.length < 1) return message.channel.send('Could not find ID in database.\nUse \'ia!leaderboard list\' to see all tournaments');
	// Get tournament object (should be first and only object in array)
	const tournament = query[0];
	// Add the playerObject to the players array of the leaderboard object
	tournament.leaderboard.players.push(playerObject);

	try {
		// Tell the DB that this part of the document has been modified (MUST DO for updates)
		tournament.markModified('leaderboard');
		// Save the updated document to the DB
		await tournament.save();
		console.log(`${playerName} has been added to ${tournament.leaderboard.name}`);
		return message.channel.send(`${playerName} has been added to ${tournament.leaderboard.name}`);
	} catch (error) {
		console.log(error);
		return message.channel.send('There was an error adding that player to the tournament');
	}
}

async function removePlayer(message, args) {

}

async function updateScores(message, args) {

}

// After removing a tournament, go through the collection
// Update all ids to be in order
// Solves issue of having ids [1, 2, 3, 4] deleting id 3, and now ids show as [1, 2, 4]
async function updateCollectionIDs() {
	// Get number of documents in collection
	const numberOfDocs = await Leaderboard.countDocuments();

	for(let i = 0; i < numberOfDocs; i++) {
		// Find all documents matching the condition (id > i)
		// Update the first documents id to be i + 1
		// Function takes a filter, an update, and a callback
		Leaderboard.updateOne(
			{ id: { $gt:i } },
			{ id: i + 1 },
			(err) => {
				if (err) console.log(err);
			});
	}


}

module.exports = {
	name: 'leaderboard',
	alias: [],
	description: 'Starts or ends a tournament, Adds or removes a person from the tournament, and monitors wins and losses. ',
	args: true,
	usage: '',
	execute(message, args) {
		// Get the first argument and remove it from the array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'start') {
			// Message sends total number of args needed(add + 1 args)
			if(args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info');
			}
			return addLeaderboard(message, args);
		} else if(firstArg === 'add') {
			// Message sends total number of args needed(add + 1 args)
			if(args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info')
			}
			return addPlayer(message, args);
		} else if(firstArg === 'remove') {
			// Message sends total number of args needed(remove + 1 args)
			if (args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info')
			}
			return removePlayer(message, args);
		} else if(firstArg === 'win') {
			// Message sends total number of args needed(win + 3 args)
			if(args.length < 3) {
				return message.channel.send('Command needs at least four (4) arguments, run \'ia!help leaderboard\' for more info')
			}
			return updateScores(message, args);
		} else if(firstArg === 'end') {
			// Message sends total number of args needed(end  + 1 args)
			if(args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run \'ia!help leaderboard\' for more info')
			}
			return endLeaderboard(message, args);
		} else {
			return message.channel.send('Incorrect command usage. For proper usage use ia!help leaderboard');
		}
	},
};