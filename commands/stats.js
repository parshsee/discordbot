const Discord = require('discord.js');

module.exports = {
	name: 'stats',
	aliases: ['server'],
	description: 'Show information on the server or on a specific user from their user id or mention',
	args: false,
	usage: ' **OR** \nia!stats [user id] **OR** \nia!stats [@mention]',
	execute(message, args) {

		console.log(message, args);

		if(args.length > 1) {
			return message.channel.send('Incorrect usage, use \'ia!help stats\' for more information on how to use this command');
		} else if (args.length === 1) {
			// If command is !stats [@mention] or [user id]
			// Ternary Operator, check to see if there was a mention, if true get first mention else get user gave an id, get member from id
			const member = message.mentions.members.size() === 1 ? message.mentions.members.first() : message.guild.members.cache.get(args[0]);

			if(member) {
				// Send embed with info
				const embed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTimestamp()
					.setFooter('Parshotan Seenanan');

			} else {
				// Send error message, couldn't find user
				// Error can be caused because id couldnt be
				return message.channel.send('Could not find that id or user in the server');
			}

		} else {
			// If command is just !stats
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTimestamp()
				.setFooter('Parshotan Seenanan');

		}

	},
};