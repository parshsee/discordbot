const mongoose = require('mongoose');

// Create schema (template) for the leaderboards document (table)
const leaderboardsSchema = mongoose.Schema({
    id: { type: Number, required: true },
    leaderboard: { type: Object, required: true},
}) 

// Export the model as 'Leaderboards'
module.exports = mongoose.model('Leaderboards', leaderboardsSchema);

// Leaderboard Object
/* 
exampleLeaderboard = {
    name = 'exampleLeaderboardName',
    players = Object,
}

examplePlayer = {
    name = 'examplePlayerName',
    wins = 12,
    loss = 10,
}
*/