require('dotenv').config();
const axios = require('axios');
const Streamer = require('../database/models/streamers');


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
			console.log(idNumber);

			// Construct a new streamer document from the model
			const streamer = new Streamer({
				id: idNumber,
				streamerName: twitchStreamer,
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
		console.log(searchResult);
	} catch(err) {
		console.log(err);
	}
}

async function removeStreamer(message, args) {

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