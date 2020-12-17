const Leaderboard = require('../database/models/leaderboards');

async function addLeaderboard(message, args) {
	const tournamentName = args.join(' ');
}

async function endLeaderboard(message, args) {
	
}

async function addPlayer(message, args) {
    
}

async function removePlayer(message, args) {

}

async function updateScores(message, args) {

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