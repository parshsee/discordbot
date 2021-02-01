require('dotenv').config();
const axios = require('axios');
const Streamer = require('../database/models/streamers');
const Discord = require('discord.js');

async function addStreamer(message, args) {
	const twitchStreamer = args[0];

	try {
		const searchResult = (await axios({
			url: `${process.env.TWITCH_USER_API}`,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Client-ID': process.env.TWITCH_CLIENT_ID,
				'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
			},
			params: {
				login: twitchStreamer,
			},
		})).data.data;

		if(searchResult.length) {
			const idNumber = await Streamer.countDocuments() + 1;

			// Construct a new streamer document from the model
			const streamer = new Streamer({
				id: idNumber,
				streamerName: searchResult[0].display_name,
				gameTitle: '',
				status: 'Offline',
			});

			// Save the Streamer to the database
			(async () => {
				try {
					await streamer.save();
					console.log('Streamer added to Database');
					return message.channel.send('Streamer Added Successfully');
				} catch (err) {
					console.log('error: ' + err);
					return message.channel.send('Error saving streamer');
				}
			})();
		} else {
			message.channel.send('Streamer not found');
		}
	} catch(err) {
		console.log(err);
	}
}

async function removeStreamer(message, args) {
	// Check if id is a number
	if (isNaN(args[0])) return message.channel.send('Please enter a valid ID number');

	// Get the id number from the args
	const idNumber = args[0];

	// Create a query finding and deleting the doc with the id number
	// Await the query to get the document that was deleted
	const query = Streamer.findOneAndDelete({ id: idNumber });
	const doc = await query;

	// If document is null (search result failed) return error message
	if (!doc) return message.channel.send('Streamer could not be found. Please make sure the streamer is in \'ia!twitch list\' and that it is typed correctly ');

	// Get Streamer name from Document
	const streamerName = doc.streamerName;

	// Call to update the ids for the remaining docs
	await updateCollectionIDs();

	// Return a message saying deletion was successful
	console.log('Streamer removed from Database');
	return message.channel.send(`${streamerName} has been removed from database.`);
}

async function updateCollectionIDs() {
// Get number of documents in collection
	const numberOfDocs = await Streamer.countDocuments();

	for(let i = 0; i < numberOfDocs; i++) {
		// Find all documents matching the condition (id > i)
		// Update the first documents id to be i + 1
		// Function takes a filter, an update, and a callback
		Streamer.updateOne(
			{ id: { $gt:i } },
			{ id: i + 1 },
			(err) => {
				if (err) console.log(err);
			});
	}
}

async function listStreamer(message) {
	// Create the MessageEmbed
	const embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTimestamp()
		.setFooter('Parshotan Seenanan')
		.setAuthor(message.guild.name, message.guild.iconURL())
		.setThumbnail(message.guild.iconURL());

	const doc = await Streamer.find().sort({ id: 1 });
	console.log('Streamer DB Called');

	if(!doc.length) return message.channel.send('No streamers in database.\nTo add a streamer use \'ia!twitch add [streamer name]\'');

	// The limit of how many stremers can be in an embed
	// Only have 25 fields
	// Need to set the ID, Streamer, and Twitch Url each column is a different field (so 3)
	// 8 * 3 = 24, Only 8 events can be in an embed at a time
	let limit = 8;

	// Loop through the array of docs getting the streamer object and index
	doc.forEach((streamer, index) => {
		// If the index = the limit
		if (index === limit) {
			// Ternary Operator, set initial title for first embed and the titles for the others
			embed.setTitle(index === 8 ? 'All Streamers' : 'All Streamers Cont.');
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
			embed.addField('ID', `${streamer.id}`, true);
			embed.addField('Streamer', `${streamer.streamerName}`, true);
			embed.addField('Twitch URL', `[twitch.tv/${streamer.streamerName}](https://twitch.tv/${streamer.streamerName})`, true);
			// Else its not the first row, titles can be blank
		} else {
			embed.addField('\u200b', `${streamer.id}`, true);
			embed.addField('\u200b', `${streamer.streamerName}`, true);
			embed.addField('\u200b', `[twitch.tv/${streamer.streamerName}](https://twitch.tv/${streamer.streamerName})`, true);
		}
	});
	// Return the remaining embed after it exits for loop
	// Ensures that the last events are sent
	// I.e if 28 events in db, 24 will get sent with code above, last 4 will get sent with this
	return message.channel.send(embed);
}

module.exports = {
	name: 'twitch',
	aliases: [],
	description: 'Adds or removes a Twitch streamer from the database or shows all streamers',
	args: true,
	usage: 'add [Twitch Username] --- Adds a streamer to the bot' +
				'\n**•**ia!twitch remove [ID] --- Removes a streamer from the bot' +
				'\n**•**ia!twitch list --- Shows all streamers followed by the bot',
	async execute(message, args) {
		if(message.channel.type === 'dm') return message.channel.send('This command can\'t be used as a DM');

		// Get the first argument and remove it from array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 1 args)
			if (args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run \'ia!help twitch\' for more info');
			}
			// Call addStreamer function to confirm and add to database
			await addStreamer(message, args);
		} else if (firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 1 args)
			if (args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run \'ia!help twitch\' for more info');
			}
			// Call removeStreamer function to remove from database
			await removeStreamer(message, args);
		} else if(firstArg === 'list') {
			// ID	|	Twitch Streamer Name   |   Twitch URL
			await listStreamer(message);
		} else {
			return message.channel.send('Add or Remove not found. Use \'ia!help twitch\' for proper usage');
		}
	},
};