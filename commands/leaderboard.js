const Leaderboard = require('../database/models/leaderboards');

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

        } else if(firstArg === 'add') {

        } else if(firstArg === 'remove') {

        } else if(firstArg === 'win') {

        } else if(firstArg === 'end') {

        } else {
            return message.channel.send('Improper command usage. Use \'ia!help leaderboard\' to see all proper uses');
        }
    }
}