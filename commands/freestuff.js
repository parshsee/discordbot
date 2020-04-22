const jsonReader = require('../util/jsonReader');
const Discord = require('discord.js');

module.exports = {
    name: 'freestuff',
    aliases: [],
    description: 'Shows all available free games',
    args: false,
    usage: ' ',
    async execute(message, args) {
        if(message.channel.name === 'freebies') {
            const embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setAuthor('Immature Allies', message.guild.iconURL())
                .setThumbnail(message.guild.iconURL())
                .setTimestamp()
                .setFooter('Parshotan Seenanan')
                .setTitle('Available Games');
            
            let reply = '';
            //Returns json array
            const gamesArray = await jsonReader('./games.json');
            
            //Loops through array, gets all game names, adds to reply
            gamesArray.forEach(function(game) {
                reply += `➡️ **${game.name}**\n\n`;
            });
            embed  
                .setDescription(reply);

            return message.channel.send(embed);
        }
        
        message.channel.send('This command can only be used in \'freebies\' channel');
    }
}