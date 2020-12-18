const mongoose = require('mongoose');

// Create schema (template) for the leaderboards document (table)
const leaderboardsSchema = mongoose.Schema({
	id: { type: Number, required: true },
	leaderboard: { type: Object, required: true },
});

// Export the model as 'Leaderboards'
module.exports = mongoose.model('Leaderboards', leaderboardsSchema);

// Leaderboard Object
/*
exampleLeaderboard = {
    name = 'exampleLeaderboardName',
    players = Array of Object,
}

examplePlayer = {
    name = 'examplePlayerName',
    wins = 12,
    loss = 10,
}

exampleLeaderboard = {
    name = 'exampleLeaderboardName',
    players = [
        {
            name: 'examplePlayerName',
            wins: 12,
            losses: 10,
        },
        {
            name: 'examplePlayerName2',
            wins: 10,
            losses: 12,
        },
    ],
}


*/