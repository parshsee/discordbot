const Event = require('../database/models/events');
const Discord = require('discord.js');

// Creates a embedded with 3 columns: ID, Event, Datetime
// Uses information from array of documents
// Sends embedded back to channel
function createEmbeddedColumns(message, doc, embed) {
	// The limit of how many events can be in an embed
	// Only have 25 fields
	// Need to set the ID, Event, and Datetime each column is a different field (so 3)
	// 8 * 3 = 24, Only 8 events can be in an embed at a time
	let limit = 8;

	// Loop through the array of docs getting the event object and index
	doc.forEach((event, index) => {
		// If the index = the limit
		if (index === limit) {
			// Ternary Operator, set initial title for first embed and the titles for the others
			embed.setTitle(index === 8 ? 'All Events' : 'All Events Cont.');
			// Increase the limit
			limit += 8;
			// Wait for the embed to be send
			// forEach function doesn't need it to be await for some reason
			message.channel.send({ embed });
			// Clear all fields from the embed
			// Allows me to add another 25 fields
			embed.fields = [];
		}

		// If the remainder is 0, indicates that this will be the first row in embed, set titles
		if (index % 8 === 0) {
			embed.addField('ID', `${event.eventId}`, true);
			embed.addField('Event', `${event.eventName}`, true);
			embed.addField('Date', `${event.eventTime}`, true);
			// Else its not the first row, titles can be blank
		} else {
			embed.addField('\u200b', `${event.eventId}`, true);
			embed.addField('\u200b', `${event.eventName}`, true);
			embed.addField('\u200b', `${event.eventTime}`, true);
		}
	});
	// Return the remaining embed after it exits for loop
	// Ensures that the last events are sent
	// I.e if 28 events in db, 24 will get sent with code above, last 4 will get sent with this
	return message.channel.send(embed);
}

module.exports = {
	name: 'events',
	aliases: ['schedules, reminds'],
	description: 'Shows a list of all the events or info about a specific one',
	args: false,
	usage: ' **OR** \nia!events [event name]',
	execute(message, args) {
		console.log(message, args);
		// Create the MessageEmbed
		const embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter('Parshotan Seenanan');
		// If the message guild exists (message is in server) set the author and thumbnail
		// Else set it static values (message would be dm then)
		if (message.guild) {
			embed
				.setAuthor(message.guild.name, message.guild.iconURL())
				.setThumbnail(message.guild.iconURL());
		} else {
			embed
				.setAuthor('Immature Bot');
		}

		// If no args given (i.e just ia!events)
		if(!args.length) {

		// Else if there is only one argument (should be the ID)
		} else if(args.length === 1) {

		} else {
			return message.channel.send('Incorrect command usage. For proper usage use ia!help events');
		}
	},
};