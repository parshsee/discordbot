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

		// Create the MessageEmbed
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

		// If no args given (i.e just ia!quotes)
		if(!args.length) {
			// Create a query getting all docs sorting by id
			// Await the query to get the array of docs
			const query = Quote.find().sort({ id: 1 });
			const doc = await query;
			// If there are no quotes in database, send error message
			if(!doc) return message.channel.send('No quotes in database.\nTo add a quote use ia!quote [first name] [last name] [quote]');
			// The limit of how many quotes can be in an embed
			// Only have 25 fields
			// Need to set the ID, Quote, and Name each column is a different field (so 3)
			// 8 * 3 = 24, Only 8 quotes can be in an embed at a time
			let limit = 8;

			// Loop through the array of docs
			// Can't use forEach because need index for checks
			for (let j = 0; j < doc.length; j++) {
				// If the index = the limit
				if (j === limit) {
					// Ternary Operator, set initial title for first embed and the titles for the others
					embed.setTitle(j === 8 ? 'All Quotes' : 'All Quotes Cont.');
					// Increase the limit
					limit += 8;
					// Wait for the embed to be send
					await message.channel.send({ embed });
					// Clear all fields from the embed
					// Allows me to add another 25 fields
					embed.fields = [];
				}

				// If the remainder is 0, indicates that this will be the first row in embed, set titles
				if (j % 8 === 0) {
					embed.addField('ID', `${doc[j].id}`, true);
					embed.addField('Quote', `"${doc[j].quote}"`, true);
					embed.addField('Person', `${doc[j].firstName} ${doc[j].lastName}`, true);
				// Else its not the first row, titles can be blank
				} else {
					embed.addField('\u200b', `${doc[j].id}`, true);
					embed.addField('\u200b', `"${doc[j].quote}"`, true);
					embed.addField('\u200b', `${doc[j].firstName} ${doc[j].lastName}`, true);
				}

			}
			// Return the remaining embed after it exits for loop
			// Ensures that the last quotes are sent
			// I.e if 28 quotes in db, 24 will get sent with code above, last 4 will get sent with this
			return message.channel.send(embed);

		}

		return message.channel.send(embed);
	},
};