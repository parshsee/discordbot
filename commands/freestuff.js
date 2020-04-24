const jsonReader = require('../util/jsonReader');
const Discord = require('discord.js');


function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
  //Check what str.substr(o, size) returns --- Should be the string until 2048th character
  // --- If it ends with \n\n then the last game is good (formatted correctly)
  // --- Else get the index of the last time it was formmated correctly (ending with \n\n)
  //      Create a new substring that ends when it was last formatted correctly
  //      Add that substring to the array
  //      Set o (the starting point of each substring) equal to its value - (size - y)
  //          Now when o increments by size again it will be where y left off instead of
  //          going to the next size and skipping all characters inbetween y and size. 
    //console.log("Substring Starting at: " + o + " : " + str.substr(o, size));
    if(str.substr(o, size).endsWith('\n\n')) {
      chunks[i] = str.substr(o, size);
    } else {
      const y = str.substr(o, size).lastIndexOf('\n\n') + 2;  //Reads \n as 1 character
      const z = str.substr(o, y);
      chunks[i] = z;
      o = o - (size -  y);
    }

  }
  return chunks;

}

async function sendEmbeds(text, channel) {
    const testArr = chunkSubstr(text, 2048);

    for (let chunk of testArr) { // Loop through every element
      let embed = new Discord.MessageEmbed()
        .setColor("00FFFF")
        .setDescription(chunk);
  
      await channel.send({ embed }); // Wait for the embed to be sent
    }
  }

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
                //reply += `➡️ **${game.name}**\n\n`;
                reply += `:arrow_right: **${game.name}** \n\n`
            });

            return sendEmbeds(reply, message.channel);
            // embed  
            //     .setDescription(reply);

            // return message.channel.send(embed);
        }
        
        message.channel.send('This command can only be used in \'freebies\' channel');
    }
}