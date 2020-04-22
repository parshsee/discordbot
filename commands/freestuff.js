const fs = require('fs');
const gamesJSON = require('../games.json');

module.exports = {
    name: 'freestuff',
    aliases: [],
    description: 'Shows all available free games',
    args: false,
    execute(message, args) {
        if(message.channel.name === 'freebies') {
            return message.channel.send('You are in the right channel');
        }
        
        message.channel.send("Step 1: Created");
        message.channel.send('Step 2: Profit');
    }
}