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

async function listStreamer(message, args) {

}

module.exports = {
	name: 'twitch',
	aliases: [],
	description: 'Adds or removes a Twitch streamer from the database or shows all streamers',
	args: true,
	usage: '\n[add] [Twitch Username] **OR** \n[remove] [ID] **OR** \n[list]',
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
			await listStreamer(message, args);
		} else {
			return message.channel.send('Add or Remove not found. Use ia!help [twitch] for proper usage');
		}
	},
};