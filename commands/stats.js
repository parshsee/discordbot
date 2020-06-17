const Discord = require('discord.js');

module.exports = {
	name: 'stats',
	aliases: ['server', 'stat'],
	description: 'Show information on the server or on a specific user from their user id or mention',
	args: false,
	usage: ' **OR** \nia!stats [user id] **OR** \nia!stats [@mention]',
	execute(message, args) {

		if(message.channel.type === 'dm') return message.channel.send('This command can\'t be used as a DM');

		if(args.length > 1) {
			return message.channel.send('Incorrect usage, use \'ia!help stats\' for more information on how to use this command');
		} else if (args.length === 1) {
			// If command is !stats [@mention] or [user id]
			// Ternary Operator, check to see if there was a mention, if true get first mention else get user gave an id, get member from id
			const member = message.mentions.members.size === 1 ? message.mentions.members.first() : message.guild.members.cache.get(args[0]);

			if(member) {
				// Send embed with info
				const embed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTimestamp()
					.setFooter('Parshotan Seenanan')
					.setAuthor(`${member.user.usename} (${member.id})`, member.user.displayAvatarURL())
					.setThumbnail(member.user.displayAvatarURL())
					.addField('Created On', member.user.createdAt.toLocaleString(), true)
					.addField('Joined On', member.joinedAt.toLocaleString(), true)
					.addField('Tag', member.user.tag)
					.addField('ID', member.id)
					.addField('Nickname', member.nickname ? member.nickname : 'None')
					.addField('Presence', member.presence.status)
					.setDescription(`${member.roles.cache.map(role => role.toString()).join(' ')}`);

				return message.channel.send(embed);
			} else {
				// Send error message, couldn't find user
				// Error can be caused because id couldnt be
				return message.channel.send('Could not find that id or user in the server');
			}

		} else {
			const { guild } = message;
			// If command is just !stats
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTimestamp()
				.setFooter('Parshotan Seenanan')
				.setAuthor(`${guild.name}`, guild.iconURL())
				.setThumbnail(guild.iconURL())
				.addField('Created On', guild.createdAt.toLocaleString())
				.addField('Server Owner', guild.owner.user.username)
				.addField('ID', guild.id)
				.addField('Total Members', guild.memberCount)
				.addField('Total Real Members', guild.members.cache.filter(member => !member.user.bot).size)
				.addField('Total Bots', guild.members.cache.filter(member => member.user.bot).size)
				.addField('Total Channels', guild.channels.cache.size)
				.addField('Total Categories', guild.channels.cache.filter(ch => ch.type === 'category').size)
				.addField('Total Text Channels', guild.channels.cache.filter(ch => ch.type === 'text').size)
				.addField('Total Voice Channels', guild.channels.cache.filter(ch => ch.type === 'voice').size)
				.setDescription(`${guild.roles.cache.map(role => role.toString()).join(' ')}`);

			return message.channel.send(embed);


		}

	},
};