const Quote = require('../database/models/quotes');
const Discord = require('discord.js');

module.exports = {
	name: 'quotes',
	aliases: [],
	description: 'Gets a random quote, specific quote, or lists all quotes',
	args: false,
	usage: ' **OR** \nia!quotes [first name] [last name] **OR** \nia!quotes [ID] **OR** \nia!quotes list',
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {

		const embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter('Parshotan Seenanan');

		embed.addField('ID', 1, true);
		embed.addField('Quote', 'Big booty butchers', true);
		embed.addField('Person', 'Brandon', true);

		embed.addField('\u200b', 2, true);
		embed.addField('\u200b', 'Covfefe', true);
		embed.addField('\u200b', 'Trump', true);

		let reply = '';
		// If no args given (i.e just ia!quotes)
		if(!args.length) {
			const query = Quote.find().sort({ id: 1 });
			const doc = await query;

			console.log(doc);
			if(!doc) return message.channel.send('No quotes in database.\nTo add a quote use ia!quote [first name] [last name] [quote]');

			const numberOfEmbeds = (doc.length / 25) + 1;

			// If more than 25 quotes, it wont get send
			// Somehow have to make it loop through the array of docs
			// And add fields for each doc
			// If it reaches 25, then send that embed and create a new one

		}

		return message.channel.send(embed);
	},
};