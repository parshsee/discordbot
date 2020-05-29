require('dotenv').config();
const Discord = require('discord.js');

module.exports = {
	name: 'commands',
	aliases: ['help', 'guide'],
	description: 'List all my commands or info about a specific command.',
	usage: '[command name]',
	execute(message, args) {
		const data = [];
		// Get all commands (as objects) from message
		const { commands } = message.client;
		// Create generic Embedded Message with necessary fields
		const embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter('Parshotan Seenanan');
		// If the message guild exists (message is in server) set the author and thumbnail
		// Else set it static values (message would be dm then)
		if(message.guild) {
			embed
				.setAuthor(message.guild.name, message.guild.iconURL())
				.setThumbnail(message.guild.iconURL());
		} else {
			embed
				.setAuthor('Immature Bot');
		}


		// If no arguments given (i.e just !help)
		if(!args.length) {
			// Add appropriate title and description to embedded message
			embed
				.setTitle('Commands')
				.setDescription('Here\'s a list of all my commands!');
			// Add a field in the message for every command, and their description
			for(const command of commands) {
				embed.addField(`__**${command[1].name}**__`, command[1].description);
			}
			// Add a blank field and an 'Additional Help' field
			embed
				.addField('\u200B', '\u200B')
				.addField('Additional Help', `You can send '${process.env.PREFIX}help ${this.usage}' to get more detailed information on that command!`);

			return message.channel.send(embed);
		}

		// Gets the first argument (should be the specific command to expand upon)
		const name = args[0].toLowerCase();
		// Gets the command object based on command name or aliase
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		// If command is not one of the ones recognized reply not valid
		if(!command) {
			return message.reply('that\'s not a valid command!');
		}

		if(command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if(command.description) data.push(`**Description:** ${command.description}`);
		if(command.usage) data.push(`**Usage:** ${process.env.PREFIX}${command.name} ${command.usage}`);

		// Create embedded message detailing the command
		embed
			.setTitle(`Command - ${command.name}`)
			.setDescription(data);
		message.channel.send(embed);
	},

};