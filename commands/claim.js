const jsonReader = require('../util/jsonReader');

module.exports = {
    name: 'claim',
    aliases: ['get'],
    description: 'Claim a game and recieve the steam key for it!',
    args: true,
    usage: '[game name]',
    async execute(message, args) {
        const jsonArray = jsonReader('./games.json');

        
    }
}